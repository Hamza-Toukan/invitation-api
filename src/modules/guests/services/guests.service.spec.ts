import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { GuestStatus } from '@prisma/client';
import { GuestsService } from './guests.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExcelService } from '../../../core/excel/excel.service';
import { PdfService } from '../../../core/pdf/pdf.service';

describe('GuestsService', () => {
  let service: GuestsService;
  let mockPrisma: {
    event: { findUnique: jest.Mock };
    guest: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mockExcelService: {
    parseExcelBuffer: jest.Mock;
    generateExcelBuffer: jest.Mock;
  };
  let mockPdfService: {
    generateGuestPassPdf: jest.Mock;
  };

  const eventId = '11111111-1111-1111-1111-111111111111';
  const hostId = '22222222-2222-2222-2222-222222222222';
  const otherUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    mockPrisma = {
      event: { findUnique: jest.fn() },
      guest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockExcelService = {
      parseExcelBuffer: jest.fn(),
      generateExcelBuffer: jest.fn(),
    };

    mockPdfService = {
      generateGuestPassPdf: jest.fn(),
    };

    service = new GuestsService(
      mockPrisma as unknown as PrismaService,
      mockExcelService as unknown as ExcelService,
      mockPdfService as unknown as PdfService,
    );
  });

  describe('verifyEventOwnership', () => {
    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.verifyEventOwnership(eventId, hostId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not host or admin', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      await expect(service.verifyEventOwnership(eventId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should succeed if user is host', async () => {
      const mockEvent = { id: eventId, host_id: hostId };
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      const res = await service.verifyEventOwnership(eventId, hostId);
      expect(res).toBe(mockEvent);
    });
  });

  describe('createGuest', () => {
    it('should create guest with auto-generated token and qr hash', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      mockPrisma.guest.create.mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 'guest-1', ...(data as object) }),
      );

      const result = await service.createGuest(eventId, hostId, {
        guestName: 'Omar Salem',
        phoneNumber: '0791234567',
        companionsAllowed: 2,
        notes: 'VIP Table 1',
      });

      expect(result).toHaveProperty('id', 'guest-1');
      expect(result).toHaveProperty('invitation_token');
      expect(result).toHaveProperty('qr_code_hash');
      expect(mockPrisma.guest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_id: eventId,
          guest_name: 'Omar Salem',
          phone_number: '0791234567',
          companions_allowed: 2,
        }),
      });
    });
  });

  describe('checkInGuest', () => {
    it('should throw NotFoundException if QR code hash does not match', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      mockPrisma.guest.findFirst.mockResolvedValue(null);

      await expect(service.checkInGuest(eventId, 'invalid_qr', hostId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if guest declined', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      mockPrisma.guest.findFirst.mockResolvedValue({
        id: 'guest-1',
        event_id: eventId,
        status: GuestStatus.DECLINED,
      });

      await expect(service.checkInGuest(eventId, 'qr_declined', hostId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return alreadyCheckedIn: true if already checked in', async () => {
      const checkedInAt = new Date();
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      mockPrisma.guest.findFirst.mockResolvedValue({
        id: 'guest-1',
        event_id: eventId,
        guest_name: 'Omar',
        status: GuestStatus.ACCEPTED,
        checked_in: true,
        checked_in_at: checkedInAt,
        companions_confirmed: 1,
      });

      const res = await service.checkInGuest(eventId, 'qr_valid', hostId);
      expect(res.alreadyCheckedIn).toBe(true);
      expect(res.guest.name).toBe('Omar');
    });

    it('should successfully check in guest and mark checked_in: true', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ id: eventId, host_id: hostId });
      mockPrisma.guest.findFirst.mockResolvedValue({
        id: 'guest-1',
        event_id: eventId,
        guest_name: 'Omar',
        status: GuestStatus.PENDING,
        checked_in: false,
        companions_confirmed: 2,
      });
      mockPrisma.guest.update.mockResolvedValue({
        id: 'guest-1',
        guest_name: 'Omar',
        checked_in: true,
        checked_in_at: new Date(),
        companions_confirmed: 2,
      });

      const res = await service.checkInGuest(eventId, 'qr_valid', hostId);
      expect(res.alreadyCheckedIn).toBe(false);
      expect(mockPrisma.guest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'guest-1' },
          data: expect.objectContaining({ checked_in: true }),
        }),
      );
    });
  });
});
