import { BadRequestException } from '@nestjs/common';
import { ExcelService } from './excel.service';

interface SampleGuest {
  name: string;
  phone: string;
  companions: number;
}

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    service = new ExcelService();
  });

  it('should generate an Excel buffer and parse it back accurately', async () => {
    const columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Companions Count', key: 'companions', width: 15 },
    ];

    const data: SampleGuest[] = [
      { name: 'Ahmad Al-Khalil', phone: '+962791234567', companions: 2 },
      { name: 'Sarah Toukan', phone: '+962788765432', companions: 0 },
    ];

    const buffer = await service.generateExcelBuffer(columns, data, 'Guests');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const mapping: Record<string, keyof SampleGuest> = {
      'Full Name': 'name',
      'Phone Number': 'phone',
      'Companions Count': 'companions',
    };

    const parsed = await service.parseExcelBuffer<SampleGuest>(buffer, mapping, 'Guests');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      name: 'Ahmad Al-Khalil',
      phone: '+962791234567',
      companions: 2,
    });
    expect(parsed[1]).toEqual({
      name: 'Sarah Toukan',
      phone: '+962788765432',
      companions: 0,
    });
  });

  it('should throw BadRequestException when parsing empty buffer', async () => {
    await expect(
      service.parseExcelBuffer(Buffer.alloc(0), { Name: 'name' as never }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when columns do not match mapping', async () => {
    const columns = [{ header: 'Random Header', key: 'col1' }];
    const buffer = await service.generateExcelBuffer(columns, [{ col1: 'test' }]);

    await expect(
      service.parseExcelBuffer(buffer, { 'Non-Existent Column': 'test' as never }),
    ).rejects.toThrow(BadRequestException);
  });
});
