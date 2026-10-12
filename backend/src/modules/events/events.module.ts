import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { TemplatesController } from './templates.controller';
import { AudioLibraryController } from './audio-library.controller';
import { EventsService } from './events.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EventsController, TemplatesController, AudioLibraryController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

