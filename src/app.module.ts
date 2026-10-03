import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { EventsModule } from './modules/events/events.module';
import { GuestsModule } from './modules/guests/guests.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { I18nModule } from './common/i18n/i18n.module';
import { HealthModule } from './core/health/health.module';
import { ExcelModule } from './core/excel/excel.module';
import { AppLoggerModule } from './core/logger/logger.module';
import { AppCacheModule } from './core/cache/cache.module';
import { AppQueueModule } from './core/queue/queue.module';
import { PdfModule } from './core/pdf/pdf.module';
import { NotificationModule } from './core/notifications/notification.module';
import { TransformResponseInterceptor } from './core/interceptors/transform-response.interceptor';
import { FastifyThrottlerGuard } from './core/throttler/fastify-throttler.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    AppLoggerModule,
    AppCacheModule,
    AppQueueModule,
    PdfModule,
    NotificationModule,
    ...(process.env.OBSERVE_APP_KEY
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY,
            appSecret: process.env.OBSERVE_APP_SECRET ?? '',
            serviceId: process.env.SERVICE_NAME ?? 'invitation-api',
          }),
        ]
      : []),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 60,  // 60 requests per minute by default
      },
    ]),
    PrismaModule,
    I18nModule,
    HealthModule,
    ExcelModule,
    AuthModule,
    MediaModule,
    EventsModule,
    GuestsModule,
    BillingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: FastifyThrottlerGuard,
    },
  ],
})
export class AppModule {}

