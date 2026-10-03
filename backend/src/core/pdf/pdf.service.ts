import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface GuestPassData {
  name: string;
  eventTitle: string;
  qrCodeBuffer?: Buffer;
  tableNumber?: string;
  seatInfo?: string;
  dateString?: string;
}

export interface RsvpReportGuestItem {
  name: string;
  phone?: string;
  status: string;
  companions: number;
}

export interface RsvpReportData {
  eventTitle: string;
  date: Date | string;
  summary: {
    total: number;
    accepted: number;
    declined: number;
  };
  guests: RsvpReportGuestItem[];
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generates a sleek, single-page printable VIP Guest Pass PDF with QR Code and table info.
   */
  async generateGuestPassPdf(guest: GuestPassData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A6',
          layout: 'portrait',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => {
          this.logger.error('Error generating guest pass PDF:', err);
          reject(err);
        });

        // Background Accent / Header Band
        doc.rect(0, 0, doc.page.width, 50).fill('#1F2937');

        doc.fillColor('#FFFFFF').fontSize(14).text('VIP INVITATION PASS', 0, 18, {
          align: 'center',
        });

        doc.moveDown(2);
        doc.fillColor('#111827').fontSize(16).text(guest.eventTitle, {
          align: 'center',
        });

        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#4B5563').text(`Guest: ${guest.name}`, {
          align: 'center',
        });

        if (guest.tableNumber) {
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#059669').text(`Table: ${guest.tableNumber}`, {
            align: 'center',
          });
        }

        if (guest.qrCodeBuffer && guest.qrCodeBuffer.length > 0) {
          doc.moveDown(1);
          const qrSize = 120;
          const x = (doc.page.width - qrSize) / 2;
          doc.image(guest.qrCodeBuffer, x, doc.y, { width: qrSize, height: qrSize });
          doc.y += qrSize + 10;
        }

        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#9CA3AF').text(
          'Please present this QR code at the reception desk.',
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        this.logger.error('Exception during PDF creation:', error);
        reject(error);
      }
    });
  }

  /**
   * Generates a formal RSVP Report PDF for event organizers and hosts.
   */
  async generateRsvpReportPdf(
    event: { title: string; date: Date | string },
    summary: { total: number; accepted: number; declined: number },
    guests: RsvpReportGuestItem[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => {
          this.logger.error('Error generating RSVP report PDF:', err);
          reject(err);
        });

        // Header Title
        doc.fontSize(20).fillColor('#111827').text('Event RSVP Summary Report');
        doc.fontSize(12).fillColor('#4B5563').text(`Event: ${event.title}`);
        const dateStr = event.date instanceof Date ? event.date.toISOString().split('T')[0] : String(event.date);
        doc.text(`Date: ${dateStr}`);
        doc.moveDown(1);

        // Stats Box
        doc.rect(40, doc.y, 515, 50).fillAndStroke('#F3F4F6', '#E5E7EB');
        doc.fillColor('#1F2937').fontSize(11);
        doc.text(
          `Total Invited: ${summary.total}   |   Confirmed (Attending): ${summary.accepted}   |   Declined: ${summary.declined}`,
          50,
          doc.y - 35,
        );

        doc.moveDown(2);
        doc.fontSize(14).fillColor('#111827').text('Guest Attendance Details');
        doc.moveDown(0.5);

        // Simple tabular listing
        doc.fontSize(10).fillColor('#374151');
        const startY = doc.y;
        doc.text('Name', 40, startY, { bold: true } as never);
        doc.text('Phone', 220, startY);
        doc.text('Status', 360, startY);
        doc.text('Companions', 460, startY);

        doc.moveTo(40, startY + 15).lineTo(555, startY + 15).stroke('#D1D5DB');

        let currentY = startY + 22;

        for (const guest of guests) {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }
          doc.text(guest.name, 40, currentY);
          doc.text(guest.phone || '-', 220, currentY);
          doc.text(guest.status, 360, currentY);
          doc.text(String(guest.companions), 460, currentY);
          currentY += 18;
        }

        doc.end();
      } catch (error) {
        this.logger.error('Exception during RSVP report creation:', error);
        reject(error);
      }
    });
  }
}
