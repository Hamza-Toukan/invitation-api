import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventStatus, GuestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEventDto,
  UpdateEventDto,
  AddGalleryImageDto,
  RsvpSummaryDto,
} from './dto';
import { I18nService } from '../../common/i18n/i18n.service';
import { SupportedLanguage } from '../../common/i18n/i18n.types';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Creates a new event invitation in DRAFT status linked to the host.
   */
  async createEvent(
    hostId: string,
    dto: CreateEventDto,
    lang: SupportedLanguage = 'ar',
  ) {
    // 1. Verify template exists
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `${this.i18n.t('event.not_found', lang)} (Template not found)`,
      );
    }

    // 2. Insert event
    const event = await this.prisma.event.create({
      data: {
        host_id: hostId,
        template_id: dto.templateId,
        event_title: dto.eventTitle,
        event_date: new Date(dto.eventDate),
        location_name: dto.locationName ?? null,
        location_url: dto.locationUrl ?? null,
        location_coordinates: (dto.locationCoordinates as any) ?? null,
        music_url: dto.musicUrl ?? null,
        custom_config: (dto.customConfig as any) ?? template.default_config,
        status: EventStatus.DRAFT,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            preview_image_url: true,
          },
        },
        gallery: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    return {
      ...event,
      rsvpSummary: this.computeRsvpSummary([]),
    };
  }

  /**
   * Retrieves all events belonging to the host, with gallery and RSVP summaries.
   */
  async getMyEvents(hostId: string) {
    const events = await this.prisma.event.findMany({
      where: { host_id: hostId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            preview_image_url: true,
          },
        },
        gallery: {
          orderBy: { display_order: 'asc' },
        },
        guests: {
          select: {
            status: true,
            checked_in: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => {
      const { guests, ...rest } = event;
      return {
        ...rest,
        rsvpSummary: this.computeRsvpSummary(guests),
      };
    });
  }

  /**
   * Retrieves an event by ID with permission check (owner or admin).
   */
  async getEventById(
    eventId: string,
    userId: string,
    userRole: UserRole,
    lang: SupportedLanguage = 'ar',
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            preview_image_url: true,
          },
        },
        gallery: {
          orderBy: { display_order: 'asc' },
        },
        guests: {
          select: {
            status: true,
            checked_in: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(this.i18n.t('event.not_found', lang));
    }

    this.checkOwnership(event.host_id, userId, userRole, lang);

    const { guests, ...rest } = event;
    return {
      ...rest,
      rsvpSummary: this.computeRsvpSummary(guests),
    };
  }

  /**
   * Updates event configuration, schedule, title, or music.
   */
  async updateEvent(
    eventId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateEventDto,
    lang: SupportedLanguage = 'ar',
  ) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new NotFoundException(this.i18n.t('event.not_found', lang));
    }

    this.checkOwnership(existing.host_id, userId, userRole, lang);

    if (dto.templateId) {
      const templateExists = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });
      if (!templateExists) {
        throw new NotFoundException('Template not found');
      }
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        template_id: dto.templateId,
        event_title: dto.eventTitle,
        event_date: dto.eventDate ? new Date(dto.eventDate) : undefined,
        location_name: dto.locationName,
        location_url: dto.locationUrl,
        location_coordinates: (dto.locationCoordinates as any) ?? undefined,
        music_url: dto.musicUrl,
        custom_config: (dto.customConfig as any) ?? undefined,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            preview_image_url: true,
          },
        },
        gallery: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    return updated;
  }

  /**
   * Adds an image to an event's gallery showcase.
   */
  async addGalleryImage(
    eventId: string,
    userId: string,
    userRole: UserRole,
    dto: AddGalleryImageDto,
    lang: SupportedLanguage = 'ar',
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(this.i18n.t('event.not_found', lang));
    }

    this.checkOwnership(event.host_id, userId, userRole, lang);

    return this.prisma.eventGallery.create({
      data: {
        event_id: eventId,
        image_url: dto.imageUrl,
        display_order: dto.displayOrder ?? 0,
      },
    });
  }

  /**
   * Deletes an image from the event's gallery.
   */
  async deleteGalleryImage(
    eventId: string,
    imageId: string,
    userId: string,
    userRole: UserRole,
    lang: SupportedLanguage = 'ar',
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(this.i18n.t('event.not_found', lang));
    }

    this.checkOwnership(event.host_id, userId, userRole, lang);

    const image = await this.prisma.eventGallery.findFirst({
      where: { id: imageId, event_id: eventId },
    });

    if (!image) {
      throw new NotFoundException('Gallery image not found on this event');
    }

    await this.prisma.eventGallery.delete({
      where: { id: imageId },
    });

    return {
      success: true,
      message: this.i18n.t('gallery.deleted', lang),
    };
  }

  /**
   * Validates that the requesting user is the host owner or has administrative privileges.
   */
  private checkOwnership(
    hostId: string,
    userId: string,
    userRole: UserRole,
    lang: SupportedLanguage,
  ): void {
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.SUPER_ADMIN &&
      hostId !== userId
    ) {
      throw new ForbiddenException(this.i18n.t('event.forbidden', lang));
    }
  }

  /**
   * Aggregates RSVP statistics from the guest list.
   */
  private computeRsvpSummary(
    guests: Array<{ status: GuestStatus; checked_in: boolean }>,
  ): RsvpSummaryDto {
    let acceptedCount = 0;
    let declinedCount = 0;
    let pendingCount = 0;
    let checkedInCount = 0;

    for (const g of guests) {
      if (g.status === GuestStatus.ACCEPTED) acceptedCount++;
      else if (g.status === GuestStatus.DECLINED) declinedCount++;
      else pendingCount++;

      if (g.checked_in) checkedInCount++;
    }

    return {
      totalGuests: guests.length,
      acceptedCount,
      declinedCount,
      pendingCount,
      checkedInCount,
    };
  }
}
