import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { GuestStatus, UserRole } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExcelService } from '../../../core/excel/excel.service';
import { PdfService } from '../../../core/pdf/pdf.service';
import { CreateGuestDto, BatchCreateGuestsDto, QueryGuestsDto } from '../dto';

export interface RawGuestExcelRow {
  name: string;
  phone?: string;
  companions?: string | number;
  notes?: string;
}

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Helper to verify that the requesting user owns the event (or is an ADMIN).
   */
  async verifyEventOwnership(eventId: string, userId: string, userRole: UserRole = UserRole.HOST) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && event.host_id !== userId) {
      throw new ForbiddenException('You do not have permission to manage guests for this event');
    }

    return event;
  }

  /**
   * Generates a cryptographically random URL-safe invitation token and unique QR hash.
   */
  private generateGuestTokens() {
    const randomHex = crypto.randomUUID().replace(/-/g, '');
    const invitation_token = `inv_${randomHex.slice(0, 16)}`;
    const qr_code_hash = `qr_${randomHex.slice(16, 32)}`;
    return { invitation_token, qr_code_hash };
  }

  /**
   * Creates a single guest with unique invitation token and QR hash.
   */
  async createGuest(eventId: string, userId: string, dto: CreateGuestDto, userRole?: UserRole) {
    await this.verifyEventOwnership(eventId, userId, userRole);
    const { invitation_token, qr_code_hash } = this.generateGuestTokens();

    return this.prisma.guest.create({
      data: {
        event_id: eventId,
        guest_name: dto.guestName.trim(),
        phone_number: dto.phoneNumber?.trim() ?? null,
        companions_allowed: dto.companionsAllowed ?? 0,
        notes: dto.notes?.trim() ?? null,
        invitation_token,
        qr_code_hash,
      },
    });
  }

  /**
   * Batch creates multiple guests in a single transaction.
   */
  async createGuestsBatch(
    eventId: string,
    userId: string,
    dto: BatchCreateGuestsDto,
    userRole?: UserRole,
  ) {
    await this.verifyEventOwnership(eventId, userId, userRole);

    const guestData = dto.guests.map((g) => {
      const { invitation_token, qr_code_hash } = this.generateGuestTokens();
      return {
        event_id: eventId,
        guest_name: g.guestName.trim(),
        phone_number: g.phoneNumber?.trim() ?? null,
        companions_allowed: g.companionsAllowed ?? 0,
        notes: g.notes?.trim() ?? null,
        invitation_token,
        qr_code_hash,
      };
    });

    return this.prisma.$transaction(
      guestData.map((data) => this.prisma.guest.create({ data })),
    );
  }

  /**
   * Imports guests from an uploaded Excel (.xlsx) file buffer.
   */
  async importGuestsFromExcel(
    eventId: string,
    userId: string,
    fileBuffer: Buffer,
    userRole?: UserRole,
  ) {
    await this.verifyEventOwnership(eventId, userId, userRole);

    const columnMapping: Record<string, keyof RawGuestExcelRow> = {
      name: 'name',
      'guest name': 'name',
      'الاسم': 'name',
      'اسم الضيف': 'name',
      phone: 'phone',
      'phone number': 'phone',
      'الهاتف': 'phone',
      'رقم الهاتف': 'phone',
      'رقم الموبايل': 'phone',
      companions: 'companions',
      'companions allowed': 'companions',
      'المرافقين': 'companions',
      'عدد المرافقين': 'companions',
      notes: 'notes',
      'ملاحظات': 'notes',
      'الطاولة': 'notes',
    };

    const parsedRows = await this.excelService.parseExcelBuffer<RawGuestExcelRow>(
      fileBuffer,
      columnMapping,
    );

    if (parsedRows.length === 0) {
      throw new BadRequestException('Excel file does not contain any valid guest records');
    }

    const validGuestsToInsert = parsedRows
      .filter((row: RawGuestExcelRow) => Boolean(row.name && String(row.name).trim().length > 0))
      .map((row: RawGuestExcelRow) => {
        const { invitation_token, qr_code_hash } = this.generateGuestTokens();
        let companions = 0;
        if (row.companions !== undefined) {
          const parsed = Number.parseInt(String(row.companions), 10);
          if (!Number.isNaN(parsed) && parsed >= 0) {
            companions = parsed;
          }
        }

        return {
          event_id: eventId,
          guest_name: String(row.name).trim(),
          phone_number: row.phone ? String(row.phone).trim() : null,
          companions_allowed: companions,
          notes: row.notes ? String(row.notes).trim() : null,
          invitation_token,
          qr_code_hash,
        };
      });

    const created = await this.prisma.$transaction(
      validGuestsToInsert.map((data: {
        event_id: string;
        guest_name: string;
        phone_number: string | null;
        companions_allowed: number;
        notes: string | null;
        invitation_token: string;
        qr_code_hash: string;
      }) => this.prisma.guest.create({ data })),
    );

    return {
      message: `Successfully imported ${created.length} guests`,
      totalImported: created.length,
    };
  }

  /**
   * Generates and returns an Excel sheet containing all guests for the event.
   */
  async exportGuestsToExcel(eventId: string, userId: string, userRole?: UserRole): Promise<Buffer> {
    const event = await this.verifyEventOwnership(eventId, userId, userRole);

    const guests = await this.prisma.guest.findMany({
      where: { event_id: eventId },
      orderBy: { createdAt: 'asc' },
    });

    const columns = [
      { header: 'Guest Name (اسم الضيف)', key: 'guest_name', width: 25 },
      { header: 'Phone Number (الهاتف)', key: 'phone_number', width: 18 },
      { header: 'RSVP Status (الحالة)', key: 'status', width: 15 },
      { header: 'Companions Allowed (المرافقين المسموحين)', key: 'companions_allowed', width: 18 },
      { header: 'Companions Confirmed (المؤكدين)', key: 'companions_confirmed', width: 18 },
      { header: 'Checked In (حضر؟)', key: 'checked_in', width: 14 },
      { header: 'Notes (ملاحظات/طاولة)', key: 'notes', width: 22 },
      { header: 'Invitation Token (رمز الدعوة)', key: 'invitation_token', width: 25 },
    ];

    const data = guests.map((g: typeof guests[number]) => ({
      guest_name: g.guest_name,
      phone_number: g.phone_number || '-',
      status: g.status,
      companions_allowed: g.companions_allowed,
      companions_confirmed: g.companions_confirmed,
      checked_in: g.checked_in ? 'Yes (نعم)' : 'No (لا)',
      notes: g.notes || '-',
      invitation_token: g.invitation_token,
    }));

    return this.excelService.generateExcelBuffer(
      columns,
      data,
      `Guests - ${event.event_title.slice(0, 20)}`,
    );
  }

  /**
   * Returns a paginated list of guests with filters.
   */
  async getGuests(
    eventId: string,
    userId: string,
    query: QueryGuestsDto,
    userRole?: UserRole,
  ) {
    await this.verifyEventOwnership(eventId, userId, userRole);

    const whereClause: Record<string, unknown> = { event_id: eventId };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.checkedIn !== undefined) {
      whereClause.checked_in = query.checkedIn;
    }

    if (query.search && query.search.trim().length > 0) {
      whereClause.OR = [
        { guest_name: { contains: query.search.trim(), mode: 'insensitive' } },
        { phone_number: { contains: query.search.trim() } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, guests] = await Promise.all([
      this.prisma.guest.count({ where: whereClause }),
      this.prisma.guest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: guests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Deletes a guest record.
   */
  async deleteGuest(eventId: string, guestId: string, userId: string, userRole?: UserRole) {
    await this.verifyEventOwnership(eventId, userId, userRole);

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, event_id: eventId },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found for this event`);
    }

    await this.prisma.guest.delete({
      where: { id: guestId },
    });

    return { message: 'Guest removed successfully' };
  }

  /**
   * Generates a personalized VIP Guest Pass PDF with embedded QR Code.
   */
  async generateGuestPassPdf(
    eventId: string,
    guestId: string,
    userId: string,
    userRole?: UserRole,
  ): Promise<Buffer> {
    const event = await this.verifyEventOwnership(eventId, userId, userRole);

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, event_id: eventId },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    // Generate QR Code image buffer from the guest's qr_code_hash
    const qrData = guest.qr_code_hash || guest.invitation_token;
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 1,
      color: { dark: '#111827', light: '#FFFFFF' },
    });

    return this.pdfService.generateGuestPassPdf({
      name: guest.guest_name,
      eventTitle: event.event_title,
      qrCodeBuffer: qrBuffer,
      tableNumber: guest.notes || undefined,
    });
  }

  /**
   * Reception QR Check-in: validates QR hash, ensures guest accepted, and updates check-in status.
   */
  async checkInGuest(eventId: string, qrCodeHash: string, userId: string, userRole?: UserRole) {
    await this.verifyEventOwnership(eventId, userId, userRole);

    const guest = await this.prisma.guest.findFirst({
      where: {
        event_id: eventId,
        OR: [{ qr_code_hash: qrCodeHash }, { invitation_token: qrCodeHash }],
      },
    });

    if (!guest) {
      throw new NotFoundException('Invalid QR code: Guest not found for this event');
    }

    if (guest.status === GuestStatus.DECLINED) {
      throw new BadRequestException('Guest has previously declined this invitation');
    }

    if (guest.checked_in) {
      return {
        alreadyCheckedIn: true,
        checkedInAt: guest.checked_in_at,
        guest: {
          id: guest.id,
          name: guest.guest_name,
          companionsConfirmed: guest.companions_confirmed,
          table: guest.notes || null,
        },
        message: 'Guest was already checked in earlier',
      };
    }

    const updated = await this.prisma.guest.update({
      where: { id: guest.id },
      data: {
        checked_in: true,
        checked_in_at: new Date(),
        status: GuestStatus.ACCEPTED,
      },
    });

    return {
      alreadyCheckedIn: false,
      checkedInAt: updated.checked_in_at,
      guest: {
        id: updated.id,
        name: updated.guest_name,
        companionsConfirmed: updated.companions_confirmed,
        table: updated.notes || null,
      },
      message: 'Guest successfully checked in at reception desk',
    };
  }
}
