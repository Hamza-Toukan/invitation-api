import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({
    example: 'qr_9f83a2c4e1b742a0',
    description: 'Unique QR Code cryptographic hash scanned at reception desk',
  })
  @IsString()
  @IsNotEmpty()
  qrCodeHash!: string;
}
