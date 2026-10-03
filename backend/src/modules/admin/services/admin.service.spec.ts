import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, EventStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService } from '../../billing/services/billing.service';

describe('AdminService', () => {
  let service: AdminService;
  let mockPrisma: {
    order: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      aggregate: jest.Mock;
    };
    event: {
      count: jest.Mock;
    };
    guest: {
      count: jest.Mock;
    };
    manualPaymentVerification: {
      count: jest.Mock;
    };
    auditLog: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mockBillingService: {
    completeOrder: jest.Mock;
  };

  const adminId = '99999999-9999-9999-9999-999999999999';
  const orderId = '88888888-8888-8888-8888-888888888888';

  beforeEach(() => {
    mockPrisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        aggregate: jest.fn(),
      },
      event: {
        count: jest.fn(),
      },
      guest: {
        count: jest.fn(),
      },
      manualPaymentVerification: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockBillingService = {
      completeOrder: jest.fn(),
    };

    service = new AdminService(
      mockPrisma as unknown as PrismaService,
      mockBillingService as unknown as BillingService,
    );
  });

  describe('verifyOrder', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOrder('non-existent', adminId, { approved: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is not PENDING', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        service.verifyOrder(orderId, adminId, { approved: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delegate to billingService.completeOrder and log audit when approved', async () => {
      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        amount: 35.0,
        currency: 'JOD',
        event_id: 'event-1',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockBillingService.completeOrder.mockResolvedValue({
        order: { ...mockOrder, status: OrderStatus.COMPLETED },
        event: { id: 'event-1', status: EventStatus.PUBLISHED },
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1n });

      const res = await service.verifyOrder(orderId, adminId, { approved: true });

      expect(res.order.status).toBe(OrderStatus.COMPLETED);
      expect(mockBillingService.completeOrder).toHaveBeenCalledWith(orderId, adminId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actor_id: adminId,
          action: 'ORDER_VERIFY_APPROVED',
          entity_id: orderId,
        }),
      });
    });

    it('should mark order FAILED and update rejection notes when rejected', async () => {
      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        manualVerification: { order_id: orderId },
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: { update: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.FAILED }) },
          manualPaymentVerification: { update: jest.fn() },
          auditLog: { create: jest.fn() },
        };
        return callback(tx);
      });

      const res = await service.verifyOrder(orderId, adminId, {
        approved: false,
        rejectionReason: 'Invalid screenshot',
      });

      expect(res.order.status).toBe(OrderStatus.FAILED);
      expect(mockBillingService.completeOrder).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardAnalytics', () => {
    it('should aggregate revenue, events, guests, and confirmation percentage', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { amount: 1500.0 } });
      mockPrisma.event.count.mockResolvedValueOnce(30); // published
      mockPrisma.event.count.mockResolvedValueOnce(10); // draft
      mockPrisma.guest.count.mockResolvedValueOnce(100); // total guests
      mockPrisma.guest.count.mockResolvedValueOnce(75); // accepted guests
      mockPrisma.manualPaymentVerification.count.mockResolvedValueOnce(4); // pending cliq

      const stats = await service.getDashboardAnalytics();

      expect(stats.revenue.totalJod).toBe(1500.0);
      expect(stats.events.published).toBe(30);
      expect(stats.events.draft).toBe(10);
      expect(stats.events.total).toBe(40);
      expect(stats.guests.total).toBe(100);
      expect(stats.guests.accepted).toBe(75);
      expect(stats.guests.rsvpConfirmationRate).toBe('75%');
      expect(stats.verifications.pendingCliqOrders).toBe(4);
    });
  });
});
