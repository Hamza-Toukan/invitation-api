import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GuestStatus } from '@prisma/client';
import { RsvpService } from './rsvp.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';

describe('RsvpService', () => {
  let service: RsvpService;
  let mockPrisma: {
    guest: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    guestWish: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let mockCacheService: {
    delete: jest.Mock;
    invalidatePrefix: jest.Mock;
  };

  const token = 'inv_1234567890abcdef';

  beforeEach(() => {
    mockPrisma = {
      guest: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      guestWish: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockCacheService = {
      delete: jest.fn().mockResolvedValue(undefined),
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
    };

    service = new RsvpService(
      mockPrisma as unknown as PrismaService,
      mockCacheService as unknown as CacheService,
    );
  });

  describe('getInvitationByToken', () => {
    it('should throw NotFoundException if token does not exist', async () => {
      mockPrisma.guest.findUnique.mockResolvedValue(null);
      await expect(service.getInvitationByToken('invalid_token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return guest and event invitation details', async () => {
      const mockRecord = {
        id: 'guest-1',
        guest_name: 'Sarah',
        status: GuestStatus.PENDING,
        companions_allowed: 2,
        companions_confirmed: 0,
        notes: 'Table 5',
        event: {
          id: 'event-1',
          event_title: 'Wedding of Sarah & Zaid',
          event_date: new Date('2026-11-20'),
          location_name: 'Four Seasons Amman',
          template: {
            slug: 'classic-royal-wedding',
            category: 'WEDDING',
            default_config: { primaryColor: '#D4AF37' },
          },
          gallery: [],
        },
      };

      mockPrisma.guest.findUnique.mockResolvedValue(mockRecord);

      const result = await service.getInvitationByToken(token);
      expect(result.guest.name).toBe('Sarah');
      expect(result.event.title).toBe('Wedding of Sarah & Zaid');
      expect(result.event.template.slug).toBe('classic-royal-wedding');
    });
  });

  describe('submitRsvp', () => {
    it('should throw BadRequestException if confirmed companions exceed allowed', async () => {
      mockPrisma.guest.findUnique.mockResolvedValue({
        id: 'guest-1',
        companions_allowed: 1,
      });

      await expect(
        service.submitRsvp(token, {
          status: GuestStatus.ACCEPTED,
          companionsConfirmed: 3,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update guest status and invalidate cache', async () => {
      mockPrisma.guest.findUnique.mockResolvedValue({
        id: 'guest-1',
        event_id: 'event-1',
        companions_allowed: 2,
        notes: null,
      });

      mockPrisma.guest.update.mockResolvedValue({
        id: 'guest-1',
        guest_name: 'Sarah',
        status: GuestStatus.ACCEPTED,
        companions_confirmed: 2,
      });

      const res = await service.submitRsvp(token, {
        status: GuestStatus.ACCEPTED,
        companionsConfirmed: 2,
        notes: 'Vegetarian meals please',
      });

      expect(res.guest.status).toBe(GuestStatus.ACCEPTED);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`invitation:token:${token}`);
      expect(mockCacheService.invalidatePrefix).toHaveBeenCalledWith('event:rsvp:event-1');
    });
  });

  describe('submitWish', () => {
    it('should create guest wish in guestbook', async () => {
      mockPrisma.guest.findUnique.mockResolvedValue({
        id: 'guest-1',
        event_id: 'event-1',
      });

      mockPrisma.guestWish.create.mockResolvedValue({
        id: 'wish-1',
        author_name: 'Uncle Tariq',
        message: 'Mabrouk!',
        createdAt: new Date(),
      });

      const res = await service.submitWish(token, {
        authorName: 'Uncle Tariq',
        message: 'Mabrouk!',
      });

      expect(res.wish.authorName).toBe('Uncle Tariq');
      expect(mockPrisma.guestWish.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_id: 'event-1',
          guest_id: 'guest-1',
          author_name: 'Uncle Tariq',
        }),
      });
    });
  });
});
