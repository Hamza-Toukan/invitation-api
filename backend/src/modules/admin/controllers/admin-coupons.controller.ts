import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { AdminService } from '../services/admin.service';
import { CreateCouponDto, UpdateCouponDto, QueryAdminPaginationDto } from '../dto';

@ApiTags('Admin - Coupons')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List all coupons with pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated coupons list' })
  async getAllCoupons(@Query() query: QueryAdminPaginationDto) {
    return this.adminService.getAllCoupons(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new discount coupon',
  })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async createCoupon(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateCouponDto,
  ) {
    return this.adminService.createCoupon(admin.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing coupon',
  })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async updateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.adminService.updateCoupon(admin.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a coupon code',
  })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @ApiResponse({ status: 200, description: 'Coupon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async deleteCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.deleteCoupon(admin.sub, id);
  }
}
