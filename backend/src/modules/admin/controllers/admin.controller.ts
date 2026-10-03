import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { AdminService } from '../services/admin.service';
import { VerifyOrderDto, QueryAdminPaginationDto } from '../dto';

@ApiTags('Admin Console')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders/pending-verifications')
  @ApiOperation({
    summary: 'List pending manual CliQ orders awaiting review',
    description: 'Retrieves pending orders with uploaded transfer screenshots, sender names, and host contact details.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of pending verifications' })
  async getPendingVerifications(@Query() query: QueryAdminPaginationDto) {
    return this.adminService.getPendingVerifications(query);
  }

  @Post('orders/:orderId/verify')
  @ApiOperation({
    summary: 'Approve or reject manual CliQ order',
    description:
      'If approved, marks order COMPLETED and automatically transitions the event to PUBLISHED with a public slug. If rejected, marks order FAILED with reason notes.',
  })
  @ApiResponse({ status: 200, description: 'Verification decision processed and logged' })
  async verifyOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyOrderDto,
  ) {
    return this.adminService.verifyOrder(orderId, user.sub, dto);
  }

  @Get('analytics/dashboard')
  @ApiOperation({
    summary: 'Platform overview metrics and KPIs',
    description:
      'Computes total platform revenue in JOD, event publication stats, guest RSVP acceptance rates, and pending queues.',
  })
  @ApiResponse({ status: 200, description: 'Aggregated dashboard metrics' })
  async getDashboardAnalytics() {
    return this.adminService.getDashboardAnalytics();
  }

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Platform security and administrative audit trail',
    description: 'Returns paginated administrative actions and security records.',
  })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  async getAuditLogs(@Query() query: QueryAdminPaginationDto) {
    return this.adminService.getAuditLogs(query);
  }
}
