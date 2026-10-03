import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitCliqReceiptDto {
  @ApiProperty({
    example: 'https://cdn.aura-invite.com/orders/receipts/cliq-12345.webp',
    description: 'Cloudflare R2 URL of the uploaded transfer receipt screenshot',
  })
  @IsUrl()
  @IsNotEmpty()
  receiptImageUrl!: string;

  @ApiProperty({
    example: 'حمزة كمال طوقان',
    description: 'Full sender name shown on the Jordanian CliQ transaction slip',
  })
  @IsString()
  @IsNotEmpty()
  senderName!: string;

  @ApiPropertyOptional({
    example: 'CLIQ-JO-20261002-98471',
    description: 'Bank or CliQ transaction reference / confirmation number',
  })
  @IsOptional()
  @IsString()
  cliqReference?: string;
}
