import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOrderDto {
  @ApiProperty({
    example: true,
    description: 'Whether the CliQ transfer receipt is verified and approved',
  })
  @IsBoolean()
  @IsNotEmpty()
  approved!: boolean;

  @ApiPropertyOptional({
    example: 'Transfer receipt is unreadable or amount is incorrect',
    description: 'Reason for rejection if approved is false',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
