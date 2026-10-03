import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage } from 'node:http';
import type { FastifyRequest, FastifyReply } from 'fastify';

export const AppLoggerModule = LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,
    genReqId: (req: IncomingMessage) => {
      const fastifyReq = req as unknown as FastifyRequest;
      const headerReqId = fastifyReq.headers?.['x-request-id'];
      if (typeof headerReqId === 'string' && headerReqId.trim().length > 0) {
        return headerReqId.trim();
      }
      return crypto.randomUUID();
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.code',
        'req.body.token',
        'req.body.password',
        'req.body.codeHash',
        'code',
        'token',
        'password',
        'codeHash',
      ],
      censor: '[REDACTED]',
    },
    customProps: (req: IncomingMessage) => {
      const fastifyReq = req as unknown as FastifyRequest;
      return {
        ip: fastifyReq.ip || fastifyReq.headers?.['cf-connecting-ip'] || fastifyReq.headers?.['x-forwarded-for'],
      };
    },
    customLogLevel: (_req: IncomingMessage, res: FastifyReply, err?: Error) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    customSuccessMessage: (req: IncomingMessage, res: FastifyReply, responseTime: number) => {
      const fastifyReq = req as unknown as FastifyRequest;
      return `[${fastifyReq.method}] ${fastifyReq.url} - ${res.statusCode} (${responseTime.toFixed(2)}ms)`;
    },
    customErrorMessage: (req: IncomingMessage, res: FastifyReply, error: Error) => {
      const fastifyReq = req as unknown as FastifyRequest;
      return `[${fastifyReq.method}] ${fastifyReq.url} - ${res.statusCode} ERROR: ${error.message}`;
    },
  },
});
