import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  SendNotificationResult,
} from './notification-provider.interface';

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async sendSms(
    phoneNumber: string,
    message: string,
  ): Promise<SendNotificationResult> {
    const messageId = `sms-${crypto.randomUUID()}`;
    this.logger.log(
      `📲 [SMS Gateway MOCK] -> ${phoneNumber}: "${message}" (ID: ${messageId})`,
    );
    return {
      success: true,
      messageId,
    };
  }

  async sendWhatsApp(
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, string>,
  ): Promise<SendNotificationResult> {
    const messageId = `wa-${crypto.randomUUID()}`;
    this.logger.log(
      `💬 [WhatsApp Gateway MOCK] -> ${phoneNumber} [Template: ${templateName}] Parameters: ${JSON.stringify(
        parameters,
      )} (ID: ${messageId})`,
    );
    return {
      success: true,
      messageId,
    };
  }
}
