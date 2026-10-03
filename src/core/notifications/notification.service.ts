import { Injectable, Inject, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NOTIFICATION_PROVIDER_TOKEN,
  type NotificationProvider,
  SendNotificationResult,
} from './notification-provider.interface';

export interface DispatchNotificationOptions {
  eventId: string;
  guestId: string;
  phoneNumber: string;
  channel: NotificationChannel;
  message?: string;
  templateName?: string;
  templateParameters?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFICATION_PROVIDER_TOKEN)
    private readonly provider: NotificationProvider,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Dispatches an SMS or WhatsApp notification and records the record in NotificationDispatch.
   */
  async dispatch(options: DispatchNotificationOptions): Promise<SendNotificationResult> {
    let result: SendNotificationResult;

    try {
      if (options.channel === NotificationChannel.SMS) {
        result = await this.provider.sendSms(
          options.phoneNumber,
          options.message ?? '',
        );
      } else {
        result = await this.provider.sendWhatsApp(
          options.phoneNumber,
          options.templateName ?? 'generic_invite',
          options.templateParameters ?? {},
        );
      }

      await this.prisma.notificationDispatch.create({
        data: {
          event_id: options.eventId,
          guest_id: options.guestId,
          channel: options.channel,
          status: result.success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
          provider_message_id: result.messageId ?? null,
          error_reason: result.error ?? null,
          sent_at: result.success ? new Date() : null,
        },
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown dispatch error';
      this.logger.error(`Notification dispatch failed for guest ${options.guestId}:`, error);

      await this.prisma.notificationDispatch.create({
        data: {
          event_id: options.eventId,
          guest_id: options.guestId,
          channel: options.channel,
          status: NotificationStatus.FAILED,
          error_reason: errorMsg,
        },
      });

      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
