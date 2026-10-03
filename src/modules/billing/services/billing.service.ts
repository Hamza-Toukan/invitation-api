import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  EventStatus,
  OrderStatus,
  DiscountType,
  UserRole,
  type PricingPlan,
  type Coupon,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';
import {
  ValidateCouponDto,
  CreateOrderDto,
  SubmitCliqReceiptDto,
} from '../dto';

export interface CouponValidationResult {
  valid: boolean;
  couponCode: string;
  originalPrice: number;
  discountAmount: number;
  finalTotal: number;
  currency: string;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Retrieves all active pricing plans.
   */
  async getPricingPlans(): Promise<PricingPlan[]> {
    return this.prisma.pricingPlan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Helper to calculate discounts given a plan and coupon.
   */
  calculateDiscount(originalPrice: number, coupon: Coupon): { discountAmount: number; finalTotal: number } {
    let discountAmount = 0;
    const discountVal = Number(coupon.discount_value);

    if (coupon.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (originalPrice * discountVal) / 100;
    } else {
      discountAmount = discountVal;
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    const finalTotal = Math.max(0, Number((originalPrice - discountAmount).toFixed(2)));
    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      finalTotal,
    };
  }

  /**
   * Validates a coupon code against a chosen plan and returns calculations.
   */
  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResult> {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.is_active) {
      throw new NotFoundException('Selected pricing plan not found or inactive');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.is_active) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    if (coupon.expires_at && new Date() > coupon.expires_at) {
      throw new BadRequestException('This coupon code has expired');
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      throw new BadRequestException('This coupon code has reached its maximum usage limit');
    }

    const originalPrice = Number(plan.price);
    const { discountAmount, finalTotal } = this.calculateDiscount(originalPrice, coupon);

    return {
      valid: true,
      couponCode: coupon.code,
      originalPrice,
      discountAmount,
      finalTotal,
      currency: plan.currency,
    };
  }

  /**
   * Creates a new pending checkout order for an event.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.host_id !== userId) {
      throw new ForbiddenException('You do not own this event');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        `Event cannot be checked out because it is already in ${event.status} status`,
      );
    }

    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.is_active) {
      throw new NotFoundException('Pricing plan not found or inactive');
    }

    let finalAmount = Number(plan.price);

    if (dto.couponCode && dto.couponCode.trim().length > 0) {
      const couponRes = await this.validateCoupon({
        code: dto.couponCode.trim(),
        planId: plan.id,
      });
      finalAmount = couponRes.finalTotal;
    }

    const order = await this.prisma.order.create({
      data: {
        event_id: event.id,
        user_id: userId,
        amount: finalAmount,
        currency: plan.currency,
        status: OrderStatus.PENDING,
        transaction_reference: dto.couponCode ? `COUPON:${dto.couponCode.trim().toUpperCase()}` : null,
      },
      include: {
        event: {
          select: {
            id: true,
            event_title: true,
            status: true,
            event_date: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Retrieves all orders created by the authenticated user.
   */
  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            event_title: true,
            status: true,
            slug: true,
            event_date: true,
          },
        },
        manualVerification: true,
      },
    });
  }

  /**
   * Retrieves a specific order by ID with ownership validation.
   */
  async getOrderById(orderId: string, userId: string, userRole: UserRole = UserRole.HOST) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        manualVerification: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && order.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  /**
   * Submits a Jordanian CliQ transfer receipt screenshot for manual verification.
   */
  async submitCliqReceipt(
    orderId: string,
    userId: string,
    dto: SubmitCliqReceiptDto,
    userRole?: UserRole,
  ) {
    const order = await this.getOrderById(orderId, userId, userRole);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Receipt cannot be submitted for order with status "${order.status}"`,
      );
    }

    // Upsert manual verification record
    const verification = await this.prisma.manualPaymentVerification.upsert({
      where: { order_id: order.id },
      update: {
        receipt_image_url: dto.receiptImageUrl,
        sender_name: dto.senderName.trim(),
        cliq_reference: dto.cliqReference?.trim() ?? null,
      },
      create: {
        order_id: order.id,
        receipt_image_url: dto.receiptImageUrl,
        sender_name: dto.senderName.trim(),
        cliq_reference: dto.cliqReference?.trim() ?? null,
      },
    });

    // Update order provider to CLIQ_MANUAL
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        payment_provider: 'CLIQ_MANUAL',
      },
    });

    return {
      message: 'CliQ receipt submitted successfully and is pending administrative review',
      orderId: order.id,
      verification,
    };
  }

  /**
   * Completes an order atomically:
   * 1. Updates Order to COMPLETED.
   * 2. Atomically increments coupon used_count if a coupon was used.
   * 3. Transitions associated event to PUBLISHED, sets published_at, computes expires_at, and ensures a unique slug.
   * 4. Invalidates event cache.
   */
  async completeOrder(orderId: string, verifiedByUserId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        manualVerification: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.COMPLETED) {
      return {
        alreadyCompleted: true,
        order,
      };
    }

    // Determine unique slug for the event
    let eventSlug = order.event.slug;
    if (!eventSlug) {
      const baseSlug = order.event.event_title
        .toLowerCase()
        .replace(/[^\w\u0621-\u064A]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      eventSlug = `${baseSlug || 'event'}-${crypto.randomUUID().slice(0, 8)}`;
    }

    // Compute expiration date (default 14 days after event date)
    const gracePeriodDays = 14;
    const expiresAt = new Date(order.event.event_date);
    expiresAt.setDate(expiresAt.getDate() + gracePeriodDays);

    // Check if coupon was used from transaction_reference
    const couponCode = order.transaction_reference?.startsWith('COUPON:')
      ? order.transaction_reference.replace('COUPON:', '').trim()
      : null;

    // Run atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark order COMPLETED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });

      // 2. Mark verification verified if present
      if (order.manualVerification) {
        await tx.manualPaymentVerification.update({
          where: { order_id: order.id },
          data: {
            verified_by: verifiedByUserId ?? null,
            verified_at: new Date(),
          },
        });
      }

      // 3. Increment coupon usage if used
      if (couponCode) {
        await tx.coupon.updateMany({
          where: { code: couponCode },
          data: {
            used_count: { increment: 1 },
          },
        });
      }

      // 4. Update Event to PUBLISHED
      const updatedEvent = await tx.event.update({
        where: { id: order.event_id },
        data: {
          status: EventStatus.PUBLISHED,
          slug: eventSlug,
          published_at: new Date(),
          expires_at: expiresAt,
        },
      });

      return { updatedOrder, updatedEvent };
    });

    // Invalidate event caches
    await this.cacheService.invalidatePrefix(`event:slug:${eventSlug}`);
    await this.cacheService.invalidatePrefix(`event:${order.event_id}`);

    this.logger.log(
      `Order ${order.id} completed. Event ${order.event_id} is now PUBLISHED with slug "${eventSlug}"`,
    );

    return {
      message: 'Order completed successfully and event published',
      order: result.updatedOrder,
      event: result.updatedEvent,
    };
  }
}
