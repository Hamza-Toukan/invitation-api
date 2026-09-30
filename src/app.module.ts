import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { EventsModule } from './events/events.module';
import { I18nModule } from './common/i18n/i18n.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ...(process.env.OBSERVE_APP_KEY
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY,
            appSecret: process.env.OBSERVE_APP_SECRET ?? '',
            serviceId: process.env.SERVICE_NAME ?? 'invitation-api',
          }),
        ]
      : []),
    PrismaModule,
    I18nModule,
    AuthModule,
    MediaModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
