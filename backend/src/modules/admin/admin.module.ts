import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminEventsController } from './controllers/admin-events.controller';
import { AdminTemplatesController } from './controllers/admin-templates.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminAudioController } from './controllers/admin-audio.controller';

@Module({
  imports: [PrismaModule, BillingModule, AuthModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminEventsController,
    AdminTemplatesController,
    AdminCouponsController,
    AdminAudioController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
