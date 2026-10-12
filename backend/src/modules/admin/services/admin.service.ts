import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  OrderStatus,
  EventStatus,
  GuestStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService } from '../../billing/services/billing.service';
import {
  VerifyOrderDto,
  QueryAdminPaginationDto,
  QueryUsersDto,
  QueryAdminEventsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateCouponDto,
  UpdateCouponDto,
  CreateAudioDto,
  UpdateAudioDto,
} from '../dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  // -------------------------------------------------------------
  // ORDERS & VERIFICATIONS
  // -------------------------------------------------------------

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
      const result = await this.billingService.completeOrder(orderId, adminId);

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

  // -------------------------------------------------------------
  // USERS MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Retrieves paginated list of registered users with search and role filter.
   */
  async getUsers(query: QueryUsersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { phone_number: { contains: s } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { events: true, orders: true },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        phoneNumber: u.phone_number,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        eventsCount: u._count.events,
        ordersCount: u._count.orders,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves full user profile and associated events and orders.
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            event_title: true,
            status: true,
            event_date: true,
            slug: true,
            createdAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            payment_provider: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Updates user role (e.g. promoting to ADMIN or reverting to HOST).
   */
  async updateUserRole(adminId: string, userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'USER_ROLE_UPDATED',
        entity_type: 'USER',
        entity_id: userId,
        old_values: { role: user.role },
        new_values: { role: updated.role },
      },
    });

    return updated;
  }

  // -------------------------------------------------------------
  // EVENTS MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Retrieves all platform events with filtering and host details.
   */
  async getAllEvents(query: QueryAdminEventsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { event_title: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
        { host: { name: { contains: s, mode: 'insensitive' } } },
        { host: { phone_number: { contains: s } } },
      ];
    }

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          host: {
            select: { id: true, name: true, phone_number: true, email: true },
          },
          template: {
            select: { id: true, name: true, category: true },
          },
          _count: {
            select: { guests: true, gallery: true },
          },
        },
      }),
    ]);

    return {
      data: events.map((e) => ({
        id: e.id,
        title: e.event_title,
        status: e.status,
        date: e.event_date,
        slug: e.slug,
        host: e.host,
        template: e.template,
        guestsCount: e._count.guests,
        galleryCount: e._count.gallery,
        createdAt: e.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single event full administration details.
   */
  async getAdminEventDetails(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: { select: { id: true, name: true, phone_number: true, email: true } },
        template: true,
        gallery: { orderBy: { display_order: 'asc' } },
        orders: { include: { manualVerification: true } },
        _count: { select: { guests: true, wishes: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Updates an event's publication status directly as admin.
   */
  async updateEventStatus(adminId: string, eventId: string, status: EventStatus) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'EVENT_STATUS_UPDATED',
        entity_type: 'EVENT',
        entity_id: eventId,
        old_values: { status: event.status },
        new_values: { status: updated.status },
      },
    });

    return updated;
  }

  /**
   * Permanently deletes an event and associated orders as admin.
   */
  async deleteEventAsAdmin(adminId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { event_id: eventId } });
      await tx.event.delete({ where: { id: eventId } });
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'EVENT_DELETED_BY_ADMIN',
        entity_type: 'EVENT',
        entity_id: eventId,
        old_values: { title: event.event_title, hostId: event.host_id },
      },
    });

    return { success: true, message: 'Event deleted successfully' };
  }

  // -------------------------------------------------------------
  // TEMPLATES MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Lists all templates including inactive ones.
   */
  async getAllTemplates() {
    return this.prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { events: true } },
      },
    });
  }

  /**
   * Creates a new invitation design template.
   */
  async createTemplate(adminId: string, dto: CreateTemplateDto) {
    const existing = await this.prisma.template.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException(`Template with slug "${dto.slug}" already exists`);

    const created = await this.prisma.template.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        category: dto.category,
        preview_image_url: dto.previewImageUrl ?? null,
        default_config: dto.defaultConfig,
        is_active: dto.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'TEMPLATE_CREATED',
        entity_type: 'TEMPLATE',
        entity_id: created.id,
        new_values: { name: created.name, slug: created.slug },
      },
    });

    return created;
  }

  /**
   * Updates an existing invitation template.
   */
  async updateTemplate(adminId: string, id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    const updated = await this.prisma.template.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.category && { category: dto.category }),
        ...(dto.previewImageUrl !== undefined && { preview_image_url: dto.previewImageUrl }),
        ...(dto.defaultConfig && { default_config: dto.defaultConfig }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'TEMPLATE_UPDATED',
        entity_type: 'TEMPLATE',
        entity_id: id,
        new_values: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deletes a template or marks it inactive if events already use it.
   */
  async deleteTemplate(adminId: string, id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { _count: { select: { events: true } } },
    });
    if (!template) throw new NotFoundException('Template not found');

    if (template._count.events > 0) {
      await this.prisma.template.update({
        where: { id },
        data: { is_active: false },
      });
      return { success: true, message: 'Template is used by existing events, marked as inactive' };
    }

    await this.prisma.template.delete({ where: { id } });
    return { success: true, message: 'Template deleted permanently' };
  }

  // -------------------------------------------------------------
  // COUPONS MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Lists all discount coupons with pagination.
   */
  async getAllCoupons(query: QueryAdminPaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, coupons] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: coupons,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Creates a promotional discount coupon.
   */
  async createCoupon(adminId: string, dto: CreateCouponDto) {
    const codeUpper = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code: codeUpper } });
    if (existing) throw new BadRequestException(`Coupon "${codeUpper}" already exists`);

    const created = await this.prisma.coupon.create({
      data: {
        code: codeUpper,
        discount_type: dto.discountType,
        discount_value: dto.discountValue,
        max_uses: dto.maxUses ?? null,
        partner_name: dto.partnerName ?? null,
        expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
        is_active: dto.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'COUPON_CREATED',
        entity_type: 'COUPON',
        entity_id: created.id,
        new_values: { code: created.code, discountValue: Number(created.discount_value) },
      },
    });

    return created;
  }

  /**
   * Updates an existing coupon.
   */
  async updateCoupon(adminId: string, id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.discountType && { discount_type: dto.discountType }),
        ...(dto.discountValue !== undefined && { discount_value: dto.discountValue }),
        ...(dto.maxUses !== undefined && { max_uses: dto.maxUses }),
        ...(dto.partnerName !== undefined && { partner_name: dto.partnerName }),
        ...(dto.expiresAt !== undefined && { expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'COUPON_UPDATED',
        entity_type: 'COUPON',
        entity_id: id,
        new_values: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deletes a coupon code.
   */
  async deleteCoupon(adminId: string, id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.prisma.coupon.delete({ where: { id } });
    return { success: true, message: 'Coupon deleted successfully' };
  }

  // -------------------------------------------------------------
  // AUDIO LIBRARY MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Lists all audio tracks with pagination.
   */
  async getAllAudio(query: QueryAdminPaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, tracks] = await Promise.all([
      this.prisma.audioLibrary.count(),
      this.prisma.audioLibrary.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: tracks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Adds a new audio track or zaffeh to the library.
   */
  async createAudio(adminId: string, dto: CreateAudioDto) {
    const created = await this.prisma.audioLibrary.create({
      data: {
        title: dto.title,
        category: dto.category,
        file_url: dto.fileUrl,
        duration_seconds: dto.durationSeconds,
        is_active: dto.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'AUDIO_CREATED',
        entity_type: 'AUDIO',
        entity_id: created.id,
        new_values: { title: created.title, category: created.category },
      },
    });

    return created;
  }

  /**
   * Updates an existing audio track.
   */
  async updateAudio(adminId: string, id: string, dto: UpdateAudioDto) {
    const track = await this.prisma.audioLibrary.findUnique({ where: { id } });
    if (!track) throw new NotFoundException('Audio track not found');

    const updated = await this.prisma.audioLibrary.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.category && { category: dto.category }),
        ...(dto.fileUrl && { file_url: dto.fileUrl }),
        ...(dto.durationSeconds !== undefined && { duration_seconds: dto.durationSeconds }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'AUDIO_UPDATED',
        entity_type: 'AUDIO',
        entity_id: id,
        new_values: dto as any,
      },
    });

    return updated;
  }

  /**
   * Deletes an audio track.
   */
  async deleteAudio(adminId: string, id: string) {
    const track = await this.prisma.audioLibrary.findUnique({ where: { id } });
    if (!track) throw new NotFoundException('Audio track not found');

    await this.prisma.audioLibrary.delete({ where: { id } });
    return { success: true, message: 'Audio track deleted successfully' };
  }

  // -------------------------------------------------------------
  // DASHBOARD ANALYTICS & AUDIT LOGS
  // -------------------------------------------------------------

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
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
      this.prisma.event.count({ where: { status: EventStatus.DRAFT } }),
      this.prisma.guest.count(),
      this.prisma.guest.count({ where: { status: GuestStatus.ACCEPTED } }),
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
