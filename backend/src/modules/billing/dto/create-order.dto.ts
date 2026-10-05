import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Event ID in DRAFT status to be published',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'Pricing plan tier selected by the host',
  })
  @IsUUID()
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({
    example: 'AMMAN10',
    description: 'Optional discount coupon code',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
