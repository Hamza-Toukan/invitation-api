import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventStatus, GuestStatus, UserRole } from '@prisma/client';
import { EventsService } from './events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService } from '../../common/i18n/i18n.service';

describe('EventsService', () => {
  let service: EventsService;
  let mockPrisma: {
    template: { findUnique: jest.Mock };
    event: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    eventGallery: {
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };
  let i18nService: I18nService;

  const mockHostId = 'host-uuid-1';
  const mockOtherUser = 'other-uuid-2';
  const mockTemplateId = 'template-uuid-1';
  const mockEventId = 'event-uuid-1';

  beforeEach(() => {
    mockPrisma = {
      template: { findUnique: jest.fn() },
      event: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      eventGallery: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };
    i18nService = new I18nService();
    service = new EventsService(
      mockPrisma as unknown as PrismaService,
      i18nService,
    );
  });

  describe('createEvent', () => {
    it('should throw NotFoundException if template does not exist', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(
        service.createEvent(
          mockHostId,
          {
            templateId: mockTemplateId,
            eventTitle: 'My Wedding',
            eventDate: '2026-10-15T18:00:00Z',
          },
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create event in DRAFT status with template and initial RSVP summary', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: mockTemplateId,
        default_config: { color: 'blue' },
      });
      mockPrisma.event.create.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
        template_id: mockTemplateId,
        event_title: 'My Wedding',
        event_date: new Date('2026-10-15T18:00:00Z'),
        status: EventStatus.DRAFT,
        template: { id: mockTemplateId, name: 'Royal' },
        gallery: [],
      });

      const result = await service.createEvent(mockHostId, {
        templateId: mockTemplateId,
        eventTitle: 'My Wedding',
        eventDate: '2026-10-15T18:00:00Z',
      });

      expect(result.id).toBe(mockEventId);
      expect(result.status).toBe(EventStatus.DRAFT);
      expect(result.rsvpSummary).toEqual({
        totalGuests: 0,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 0,
        checkedInCount: 0,
      });
    });
  });

  describe('getMyEvents', () => {
    it('should return list of events with computed rsvpSummary', async () => {
      mockPrisma.event.findMany.mockResolvedValue([
        {
          id: mockEventId,
          host_id: mockHostId,
          event_title: 'Graduation Party',
          guests: [
            { status: GuestStatus.ACCEPTED, checked_in: true },
            { status: GuestStatus.DECLINED, checked_in: false },
            { status: GuestStatus.PENDING, checked_in: false },
          ],
          gallery: [],
        },
      ]);

      const events = await service.getMyEvents(mockHostId);

      expect(events).toHaveLength(1);
      expect(events[0].rsvpSummary).toEqual({
        totalGuests: 3,
        acceptedCount: 1,
        declinedCount: 1,
        pendingCount: 1,
        checkedInCount: 1,
      });
    });
  });

  describe('getEventById', () => {
    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.getEventById(mockEventId, mockHostId, UserRole.HOST, 'en'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
        guests: [],
      });

      await expect(
        service.getEventById(mockEventId, mockOtherUser, UserRole.HOST, 'en'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow event owner to retrieve event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
        event_title: 'My Wedding',
        guests: [],
      });

      const event = await service.getEventById(
        mockEventId,
        mockHostId,
        UserRole.HOST,
      );
      expect(event.id).toBe(mockEventId);
    });

    it('should allow ADMIN to retrieve event even if not owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
        guests: [],
      });

      const event = await service.getEventById(
        mockEventId,
        mockOtherUser,
        UserRole.ADMIN,
      );
      expect(event.id).toBe(mockEventId);
    });
  });

  describe('updateEvent', () => {
    it('should throw ForbiddenException if non-owner tries to update', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
      });

      await expect(
        service.updateEvent(
          mockEventId,
          mockOtherUser,
          UserRole.HOST,
          { eventTitle: 'Hacked' },
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update event when requested by owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
      });
      mockPrisma.event.update.mockResolvedValue({
        id: mockEventId,
        event_title: 'Updated Title',
      });

      const updated = await service.updateEvent(
        mockEventId,
        mockHostId,
        UserRole.HOST,
        { eventTitle: 'Updated Title' },
      );

      expect(updated.event_title).toBe('Updated Title');
    });
  });

  describe('gallery management', () => {
    it('should add gallery image if caller is owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
      });
      mockPrisma.eventGallery.create.mockResolvedValue({
        id: 'img-1',
        event_id: mockEventId,
        image_url: 'https://r2.com/photo.webp',
        display_order: 1,
      });

      const img = await service.addGalleryImage(
        mockEventId,
        mockHostId,
        UserRole.HOST,
        { imageUrl: 'https://r2.com/photo.webp', displayOrder: 1 },
      );

      expect(img.id).toBe('img-1');
    });

    it('should delete gallery image if caller is owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: mockEventId,
        host_id: mockHostId,
      });
      mockPrisma.eventGallery.findFirst.mockResolvedValue({
        id: 'img-1',
        event_id: mockEventId,
      });
      mockPrisma.eventGallery.delete.mockResolvedValue({ id: 'img-1' });

      const res = await service.deleteGalleryImage(
        mockEventId,
        'img-1',
        mockHostId,
        UserRole.HOST,
      );

      expect(res.success).toBe(true);
      expect(mockPrisma.eventGallery.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
    });
  });
});
