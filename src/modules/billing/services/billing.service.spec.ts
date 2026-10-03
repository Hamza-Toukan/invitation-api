import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventStatus, OrderStatus, DiscountType } from '@prisma/client';
import { BillingService } from './billing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';

describe('BillingService', () => {
  let service: BillingService;
  let mockPrisma: {
    pricingPlan: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    coupon: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    event: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    order: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    manualPaymentVerification: {
      upsert: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mockCacheService: {
    invalidatePrefix: jest.Mock;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const eventId = '22222222-2222-2222-2222-222222222222';
  const planId = '33333333-3333-3333-3333-333333333333';
  const orderId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    mockPrisma = {
      pricingPlan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      event: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      manualPaymentVerification: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockCacheService = {
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
    };

    service = new BillingService(
      mockPrisma as unknown as PrismaService,
      mockCacheService as unknown as CacheService,
    );
  });

  describe('validateCoupon', () => {
    it('should calculate percentage discount accurately', async () => {
      mockPrisma.pricingPlan.findUnique.mockResolvedValue({
        id: planId,
        price: 35.0,
        currency: 'JOD',
        is_active: true,
      });

      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'SAVE20',
        discount_type: DiscountType.PERCENTAGE,
        discount_value: 20,
        max_uses: 100,
        used_count: 10,
        is_active: true,
        expires_at: null,
      });

      const res = await service.validateCoupon({
        code: 'SAVE20',
        planId,
      });

      expect(res.valid).toBe(true);
      expect(res.originalPrice).toBe(35.0);
      expect(res.discountAmount).toBe(7.0);
      expect(res.finalTotal).toBe(28.0);
    });

    it('should calculate fixed amount discount accurately', async () => {
      mockPrisma.pricingPlan.findUnique.mockResolvedValue({
        id: planId,
        price: 15.0,
        currency: 'JOD',
        is_active: true,
      });

      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'MINUS5',
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 5,
        max_uses: 50,
        used_count: 2,
        is_active: true,
        expires_at: null,
      });

      const res = await service.validateCoupon({
        code: 'MINUS5',
        planId,
      });

      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(5.0);
      expect(res.finalTotal).toBe(10.0);
    });

    it('should throw BadRequestException if coupon is expired', async () => {
      mockPrisma.pricingPlan.findUnique.mockResolvedValue({
        id: planId,
        price: 15.0,
        is_active: true,
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'EXPIRED',
        is_active: true,
        expires_at: pastDate,
      });

      await expect(
        service.validateCoupon({ code: 'EXPIRED', planId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if coupon reached max uses', async () => {
      mockPrisma.pricingPlan.findUnique.mockResolvedValue({
        id: planId,
        price: 15.0,
        is_active: true,
      });

      mockPrisma.coupon.findUnique.mockResolvedValue({
        code: 'EXHAUSTED',
        is_active: true,
        max_uses: 5,
        used_count: 5,
        expires_at: null,
      });

      await expect(
        service.validateCoupon({ code: 'EXHAUSTED', planId }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createOrder', () => {
    it('should throw ForbiddenException if user does not own event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        host_id: 'someone-else',
        status: EventStatus.DRAFT,
      });

      await expect(
        service.createOrder(userId, { eventId, planId }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event is not in DRAFT', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        host_id: userId,
        status: EventStatus.PUBLISHED,
      });

      await expect(
        service.createOrder(userId, { eventId, planId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create pending order with plan amount', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        host_id: userId,
        status: EventStatus.DRAFT,
      });

      mockPrisma.pricingPlan.findUnique.mockResolvedValue({
        id: planId,
        price: 35.0,
        currency: 'JOD',
        is_active: true,
      });

      mockPrisma.order.create.mockResolvedValue({
        id: orderId,
        amount: 35.0,
        currency: 'JOD',
        status: OrderStatus.PENDING,
      });

      const order = await service.createOrder(userId, { eventId, planId });
      expect(order).toHaveProperty('id', orderId);
      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_id: eventId,
          user_id: userId,
          amount: 35.0,
          currency: 'JOD',
          status: OrderStatus.PENDING,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('completeOrder', () => {
    it('should atomically transition order and publish event', async () => {
      const mockOrder = {
        id: orderId,
        event_id: eventId,
        status: OrderStatus.PENDING,
        transaction_reference: 'COUPON:SAVE20',
        manualVerification: { order_id: orderId },
        event: {
          id: eventId,
          event_title: 'Wedding of Hamza & Noor',
          event_date: new Date('2026-11-20'),
          slug: null,
          status: EventStatus.DRAFT,
        },
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: { update: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED }) },
          manualPaymentVerification: { update: jest.fn() },
          coupon: { updateMany: jest.fn() },
          event: { update: jest.fn().mockResolvedValue({ ...mockOrder.event, status: EventStatus.PUBLISHED, slug: 'wedding-slug' }) },
        };
        return callback(tx);
      });

      const result = await service.completeOrder(orderId, 'admin-1');

      expect(result.order.status).toBe(OrderStatus.COMPLETED);
      expect(result.event?.status).toBe(EventStatus.PUBLISHED);
      expect(mockCacheService.invalidatePrefix).toHaveBeenCalled();
    });
  });
});
