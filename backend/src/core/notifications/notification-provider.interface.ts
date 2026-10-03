export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  sendSms(phoneNumber: string, message: string): Promise<SendNotificationResult>;
  sendWhatsApp(
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, string>,
  ): Promise<SendNotificationResult>;
}

export const NOTIFICATION_PROVIDER_TOKEN = 'NOTIFICATION_PROVIDER_TOKEN';
