import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NOTIFICATION_PROVIDER_TOKEN } from './notification-provider.interface';
import { ConsoleNotificationProvider } from './console-notification.provider';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: NOTIFICATION_PROVIDER_TOKEN,
      useClass: ConsoleNotificationProvider,
    },
    NotificationService,
  ],
  exports: [NotificationService, NOTIFICATION_PROVIDER_TOKEN],
})
export class NotificationModule {}
