import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrderStatus, EventStatus, GuestStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService } from '../../billing/services/billing.service';
import { VerifyOrderDto, QueryAdminPaginationDto } from '../dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  /**
   * Retrieves paginated list of pending orders with manual CliQ transfer receipts.
   */
  async getPendingVerifications(query: QueryAdminPaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause = {
      status: OrderStatus.PENDING,
      manualVerification: {
        isNot: null,
      },
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: whereClause }),
      this.prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone_number: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              event_title: true,
              event_date: true,
              status: true,
            },
          },
          manualVerification: true,
        },
      }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approves or rejects a manual CliQ order.
   * On approval, delegates to billingService.completeOrder(orderId, adminId).
   * Records audit logs for the action.
   */
  async verifyOrder(orderId: string, adminId: string, dto: VerifyOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        manualVerification: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order is already in "${order.status}" status and cannot be re-verified`,
      );
    }

    if (dto.approved) {
      // 1. Complete order and publish event atomically
      const result = await this.billingService.completeOrder(orderId, adminId);

      // 2. Audit Log
      await this.prisma.auditLog.create({
        data: {
          actor_id: adminId,
          action: 'ORDER_VERIFY_APPROVED',
          entity_type: 'ORDER',
          entity_id: orderId,
          new_values: {
            amount: Number(order.amount),
            currency: order.currency,
            eventId: order.event_id,
          },
        },
      });

      return {
        message: 'Order verified and approved successfully. Event is now published.',
        order: result.order,
        event: result.event,
      };
    }

    // If rejected:
    const updated = await this.prisma.$transaction(async (tx) => {
      const rejectedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FAILED,
        },
      });

      if (order.manualVerification) {
        await tx.manualPaymentVerification.update({
          where: { order_id: orderId },
          data: {
            admin_notes: dto.rejectionReason ?? 'Payment verification rejected by admin',
            verified_by: adminId,
            verified_at: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actor_id: adminId,
          action: 'ORDER_VERIFY_REJECTED',
          entity_type: 'ORDER',
          entity_id: orderId,
          new_values: {
            rejectionReason: dto.rejectionReason ?? 'Payment verification rejected',
          },
        },
      });

      return rejectedOrder;
    });

    return {
      message: 'Order verification rejected.',
      order: updated,
    };
  }

  /**
   * Aggregates platform KPIs, total revenue, event counts, and RSVP rate.
   */
  async getDashboardAnalytics() {
    const [
      revenueAggregate,
      publishedEventsCount,
      draftEventsCount,
      totalGuestsCount,
      acceptedGuestsCount,
      pendingVerificationsCount,
    ] = await Promise.all([
      // 1. Total revenue in JOD from completed orders
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { amount: true },
      }),
      // 2. Published events count
      this.prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
      // 3. Draft events count
      this.prisma.event.count({ where: { status: EventStatus.DRAFT } }),
      // 4. Total guests count
      this.prisma.guest.count(),
      // 5. Accepted guests count
      this.prisma.guest.count({ where: { status: GuestStatus.ACCEPTED } }),
      // 6. Pending manual CliQ receipts count
      this.prisma.manualPaymentVerification.count({
        where: { verified_at: null },
      }),
    ]);

    const totalRevenue = Number(revenueAggregate._sum.amount ?? 0);
    const rsvpRatePercentage =
      totalGuestsCount > 0
        ? Number(((acceptedGuestsCount / totalGuestsCount) * 100).toFixed(1))
        : 0;

    return {
      revenue: {
        totalJod: totalRevenue,
        currency: 'JOD',
      },
      events: {
        published: publishedEventsCount,
        draft: draftEventsCount,
        total: publishedEventsCount + draftEventsCount,
      },
      guests: {
        total: totalGuestsCount,
        accepted: acceptedGuestsCount,
        rsvpConfirmationRate: `${rsvpRatePercentage}%`,
      },
      verifications: {
        pendingCliqOrders: pendingVerificationsCount,
      },
    };
  }

  /**
   * Retrieves paginated platform audit logs.
   */
  async getAuditLogs(query: QueryAdminPaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
