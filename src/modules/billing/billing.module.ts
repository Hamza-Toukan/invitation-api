import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppCacheModule } from '../../core/cache/cache.module';
import { BillingService } from './services/billing.service';
import { BillingController } from './controllers/billing.controller';

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
