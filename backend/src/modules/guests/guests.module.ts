import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExcelModule } from '../../core/excel/excel.module';
import { PdfModule } from '../../core/pdf/pdf.module';
import { AppCacheModule } from '../../core/cache/cache.module';
import { GuestsService } from './services/guests.service';
import { RsvpService } from './services/rsvp.service';
import { GuestAdminController } from './controllers/guest-admin.controller';
import { GuestCheckinController } from './controllers/guest-checkin.controller';
import { InvitationPublicController } from './controllers/invitation-public.controller';

@Module({
  imports: [PrismaModule, ExcelModule, PdfModule, AppCacheModule],
  controllers: [
    GuestAdminController,
    GuestCheckinController,
    InvitationPublicController,
  ],
  providers: [GuestsService, RsvpService],
  exports: [GuestsService, RsvpService],
})
export class GuestsModule {}
