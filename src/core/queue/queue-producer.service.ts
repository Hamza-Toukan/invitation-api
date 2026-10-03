import { Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_QUEUE,
  EVENT_MAINTENANCE_QUEUE,
  type SendNotificationJobData,
  type EventMaintenanceJobData,
} from './queue.constants';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  /**
   * Enqueues a notification dispatch job.
   */
  async enqueueNotification(data: SendNotificationJobData): Promise<void> {
    this.logger.log(
      `[Queue: ${NOTIFICATION_QUEUE}] Enqueued ${data.channel} job for recipient: ${data.phoneNumber}`,
    );
  }

  /**
   * Enqueues an event expiration check job.
   */
  async enqueueEventMaintenance(data: EventMaintenanceJobData): Promise<void> {
    this.logger.log(
      `[Queue: ${EVENT_MAINTENANCE_QUEUE}] Enqueued maintenance check at ${data.triggeredAt}`,
    );
  }
}
