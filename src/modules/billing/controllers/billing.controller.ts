import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { BillingService } from '../services/billing.service';
import {
  ValidateCouponDto,
  CreateOrderDto,
  SubmitCliqReceiptDto,
} from '../dto';

@ApiTags('Billing & Checkout')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('pricing-plans')
  @ApiOperation({
    summary: 'List active event pricing tiers',
    description: 'Public endpoint listing available package plans in JOD with their guest allowances and features.',
  })
  @ApiResponse({ status: 200, description: 'Active pricing tiers' })
  async getPricingPlans() {
    return this.billingService.getPricingPlans();
  }

  @Post('coupons/validate')
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Validate promo coupon code against pricing tier',
    description: 'Calculates the discount amount and total price before placing an order.',
  })
  @ApiResponse({ status: 200, description: 'Coupon details and calculated totals' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.billingService.validateCoupon(dto);
  }

  @Post('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Initiate a checkout order for an event in DRAFT',
    description: 'Creates a pending order linked to the event, calculating coupon deductions if provided.',
  })
  @ApiResponse({ status: 201, description: 'Order created with status PENDING' })
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.billingService.createOrder(user.sub, dto);
  }

  @Get('orders/my-orders')
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List user orders history',
    description: 'Returns all orders, verification states, and associated events for the authenticated host.',
  })
  @ApiResponse({ status: 200, description: 'List of host orders' })
  async getMyOrders(@CurrentUser() user: JwtPayload) {
    return this.billingService.getMyOrders(user.sub);
  }

  @Get('orders/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get details of a specific order',
    description: 'Retrieves order metadata, event status, and manual CliQ receipt verification status.',
  })
  @ApiResponse({ status: 200, description: 'Order details' })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billingService.getOrderById(id, user.sub, user.role);
  }

  @Post('orders/:id/cliq-receipt')
  @ApiTags('CliQ Payments')
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Upload CliQ manual transfer receipt',
    description:
      'Submits a Jordanian CliQ payment screenshot for manual review. Changes provider to CLIQ_MANUAL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt successfully submitted and pending admin verification',
  })
  async submitCliqReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitCliqReceiptDto,
  ) {
    return this.billingService.submitCliqReceipt(id, user.sub, dto, user.role);
  }
}
