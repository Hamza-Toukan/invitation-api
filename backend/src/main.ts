import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AppModule, ObserveInstrument } from './app.module';

// Polyfill BigInt serialization for JSON responses (used in EventAnalytics, AuditLog, SystemErrorLog)
(BigInt.prototype as unknown as { toJSON: (this: bigint) => string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      bufferLogs: true,
      instrument: ObserveInstrument,
    },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Security Headers using @fastify/helmet
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io', 'https:'],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `https:`],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // CORS Configuration using @fastify/cors with local frontend and configurable origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map((o) => o.trim()));
  }

  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map((o) => o.trim()));
  }

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-Request-Id',
      'Accept-Language',
    ],
  });

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configure Swagger (OpenAPI) for Fastify
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Digital Interactive Invitations API')
    .setDescription('SaaS API engine for digital wedding & event invitations')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Explicit route for OpenAPI JSON export (frontend code generation)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs-json', (_req: unknown, res: { send: (data: unknown) => void }) => {
    res.send(document);
  });

  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 Application is running on: http://${host}:${port}/api/v1`);
  logger.log(`📚 Swagger documentation available at: http://${host}:${port}/api/docs`);
}

void bootstrap();
