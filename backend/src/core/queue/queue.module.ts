import { Module, Global } from '@nestjs/common';
import { QueueProducerService } from './queue-producer.service';

@Global()
@Module({
  providers: [QueueProducerService],
  exports: [QueueProducerService],
})
export class AppQueueModule {}
