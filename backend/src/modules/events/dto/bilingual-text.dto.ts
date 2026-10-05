import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BilingualTextDto {
  @ApiProperty({
    description: 'Arabic text content (primary)',
    example: 'حفل زفاف أحمد وسارة',
  })
  @IsNotEmpty({ message: 'Arabic text is required' })
  @IsString()
  ar: string;

  @ApiProperty({
    description: 'English text content (optional / secondary)',
    example: 'Wedding of Ahmad & Sara',
    required: false,
  })
  @IsOptional()
  @IsString()
  en?: string;
}
