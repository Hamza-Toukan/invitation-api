export const NOTIFICATION_QUEUE = 'notification-queue';
export const EVENT_MAINTENANCE_QUEUE = 'event-maintenance-queue';

export enum NotificationJobType {
  DISPATCH_SMS = 'DISPATCH_SMS',
  DISPATCH_WHATSAPP = 'DISPATCH_WHATSAPP',
}

export enum EventMaintenanceJobType {
  EXPIRE_OVERDUE_EVENTS = 'EXPIRE_OVERDUE_EVENTS',
}

export interface SendNotificationJobData {
  dispatchId: string;
  guestId: string;
  phoneNumber: string;
  channel: 'SMS' | 'WHATSAPP';
  message?: string;
  templateName?: string;
  templateParameters?: Record<string, string>;
}

export interface EventMaintenanceJobData {
  eventId?: string;
  triggeredAt: string;
}
