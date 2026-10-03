import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(() => {
    service = new PdfService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a valid PDF buffer for a VIP guest pass', async () => {
    const buffer = await service.generateGuestPassPdf({
      name: 'Tareq Al-Masri',
      eventTitle: 'Wedding of Hamza & Noor',
      tableNumber: 'Table A-12',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF Magic bytes: %PDF-
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should generate a valid PDF buffer for RSVP report', async () => {
    const buffer = await service.generateRsvpReportPdf(
      { title: 'Graduation Party 2026', date: new Date() },
      { total: 50, accepted: 35, declined: 5 },
      [
        { name: 'Omar Khaled', phone: '+962791112233', status: 'ACCEPTED', companions: 1 },
        { name: 'Rania Salem', phone: '+962785556677', status: 'PENDING', companions: 0 },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
