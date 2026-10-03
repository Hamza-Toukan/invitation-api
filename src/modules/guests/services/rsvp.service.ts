import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';
import { SubmitRsvpDto, CreateWishDto } from '../dto';

@Injectable()
export class RsvpService {
  private readonly logger = new Logger(RsvpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Fetches public invitation details by secret token for rendering the invitation page.
   */
  async getInvitationByToken(token: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { invitation_token: token },
      include: {
        event: {
          include: {
            template: true,
            gallery: {
              orderBy: { display_order: 'asc' },
            },
          },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    const { event } = guest;

    return {
      guest: {
        id: guest.id,
        name: guest.guest_name,
        status: guest.status,
        companionsAllowed: guest.companions_allowed,
        companionsConfirmed: guest.companions_confirmed,
        table: guest.notes || null,
      },
      event: {
        id: event.id,
        title: event.event_title,
        date: event.event_date,
        locationName: event.location_name,
        locationCoordinates: event.location_coordinates,
        locationUrl: event.location_url,
        musicUrl: event.music_url,
        customConfig: event.custom_config,
        template: {
          slug: event.template.slug,
          category: event.template.category,
          config: event.template.default_config,
        },
        gallery: event.gallery.map((g) => ({
          id: g.id,
          imageUrl: g.image_url,
          order: g.display_order,
        })),
      },
    };
  }

  /**
   * Submits or updates guest RSVP decision (ACCEPTED / DECLINED).
   */
  async submitRsvp(token: string, dto: SubmitRsvpDto) {
    const guest = await this.prisma.guest.findUnique({
      where: { invitation_token: token },
    });

    if (!guest) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    const confirmed = dto.companionsConfirmed ?? 0;
    if (confirmed > guest.companions_allowed) {
      throw new BadRequestException(
        `Confirmed companions (${confirmed}) cannot exceed allowed limit (${guest.companions_allowed})`,
      );
    }

    const updated = await this.prisma.guest.update({
      where: { id: guest.id },
      data: {
        status: dto.status,
        companions_confirmed: dto.status === 'ACCEPTED' ? confirmed : 0,
        notes: dto.notes ? `${guest.notes ? `${guest.notes} | ` : ''}RSVP: ${dto.notes}` : guest.notes,
      },
    });

    // Invalidate cached token response
    await this.cacheService.delete(`invitation:token:${token}`);
    await this.cacheService.invalidatePrefix(`event:rsvp:${guest.event_id}`);

    return {
      message: dto.status === 'ACCEPTED' ? 'Thank you! Your attendance is confirmed.' : 'Thank you for letting us know.',
      guest: {
        id: updated.id,
        name: updated.guest_name,
        status: updated.status,
        companionsConfirmed: updated.companions_confirmed,
      },
    };
  }

  /**
   * Posts a congratulatory wish from a guest into the digital guestbook.
   */
  async submitWish(token: string, dto: CreateWishDto) {
    const guest = await this.prisma.guest.findUnique({
      where: { invitation_token: token },
    });

    if (!guest) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    const wish = await this.prisma.guestWish.create({
      data: {
        event_id: guest.event_id,
        guest_id: guest.id,
        author_name: dto.authorName.trim(),
        message: dto.message.trim(),
        is_approved: true, // Auto-approved by default
      },
    });

    return {
      message: 'Your wish has been published to the guestbook!',
      wish: {
        id: wish.id,
        authorName: wish.author_name,
        message: wish.message,
        createdAt: wish.createdAt,
      },
    };
  }

  /**
   * Retrieves all approved guestbook wishes for this invitation's event.
   */
  async getEventWishes(token: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { invitation_token: token },
    });

    if (!guest) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    const wishes = await this.prisma.guestWish.findMany({
      where: {
        event_id: guest.event_id,
        is_approved: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        author_name: true,
        message: true,
        createdAt: true,
      },
    });

    return wishes;
  }
}
