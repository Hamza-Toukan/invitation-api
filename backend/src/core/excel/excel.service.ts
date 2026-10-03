import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExcelColumnConfig {
  header: string;
  key: string;
  width?: number;
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  /**
   * Generates a binary Buffer representing an Excel spreadsheet (.xlsx).
   * Ensures proper workbook cleanup and memory deallocation.
   */
  async generateExcelBuffer<T extends Record<string, unknown>>(
    columns: ExcelColumnConfig[],
    data: T[],
    sheetName = 'Sheet1',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    try {
      workbook.creator = 'Invitation Platform';
      workbook.lastModifiedBy = 'Invitation Platform';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width ?? 20,
      }));

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }, // Slate gray / dark header
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      // Add data rows
      for (const item of data) {
        worksheet.addRow(item);
      }

      // Convert to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('Failed to generate Excel workbook buffer:', error);
      throw error;
    } finally {
      // Memory cleanup: remove worksheet reference to free node memory
      const sheet = workbook.getWorksheet(sheetName);
      if (sheet) {
        workbook.removeWorksheet(sheet.id);
      }
    }
  }

  /**
   * Parses an Excel buffer into typed JavaScript objects using header-to-key mapping.
   */
  async parseExcelBuffer<T>(
    buffer: Buffer,
    columnMapping: Record<string, keyof T>,
    sheetIndexOrName: number | string = 1,
  ): Promise<T[]> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Excel file buffer is empty');
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

      const worksheet = workbook.getWorksheet(sheetIndexOrName);

      if (!worksheet) {
        throw new BadRequestException('Worksheet not found in Excel workbook');
      }

      // Read header row (Row 1)
      const headerRow = worksheet.getRow(1);
      const colMap: Map<number, keyof T> = new Map();

      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        let cellText = '';
        if (typeof cell.value === 'string' || typeof cell.value === 'number') {
          cellText = String(cell.value).trim();
        } else if (cell.value && typeof cell.value === 'object') {
          if ('text' in cell.value && typeof cell.value.text === 'string') {
            cellText = cell.value.text.trim();
          } else if ('result' in cell.value && (typeof cell.value.result === 'string' || typeof cell.value.result === 'number')) {
            cellText = String(cell.value.result).trim();
          }
        }

        // Find mapped key (case-insensitive and trimmed)
        for (const [mapKey, prop] of Object.entries(columnMapping)) {
          if (cellText.toLowerCase() === mapKey.trim().toLowerCase()) {
            colMap.set(colNumber, prop);
            break;
          }
        }
      });

      if (colMap.size === 0) {
        throw new BadRequestException(
          'Excel file does not contain expected header columns matching mapping',
        );
      }

      const results: T[] = [];
      const totalRows = worksheet.rowCount;

      // Iterate through data rows (Row 2 onwards)
      for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        if (!row?.hasValues) continue;

        const rowObject = {} as Partial<T>;
        let hasAtLeastOneValue = false;

        colMap.forEach((propKey, colNumber) => {
          const cell = row.getCell(colNumber);
          let value: unknown = cell.value;

          // Normalize formula or rich text cell values
          if (value && typeof value === 'object') {
            if ('result' in value) {
              value = (value as { result: unknown }).result;
            } else if ('text' in value) {
              value = (value as { text: unknown }).text;
            }
          }

          if (value !== null && value !== undefined && value !== '') {
            rowObject[propKey] =
              typeof value === 'string'
                ? (value.trim() as unknown as T[keyof T])
                : (value as unknown as T[keyof T]);
            hasAtLeastOneValue = true;
          }
        });

        if (hasAtLeastOneValue) {
          results.push(rowObject as T);
        }
      }

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to parse Excel buffer:', error);
      throw new BadRequestException('Malformed or unsupported Excel file');
    } finally {
      // Ensure sheets are cleared for garbage collection
      const sheet = workbook.getWorksheet(sheetIndexOrName);
      if (sheet) {
        workbook.removeWorksheet(sheet.id);
      }
    }
  }
}
