import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestDto {
  @ApiProperty({
    example: 'أحمد خليل التميمي',
    description: 'Full name of invited guest',
  })
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @ApiPropertyOptional({
    example: '0791234567',
    description: 'Jordanian or international mobile number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?962|0)?7[789]\d{7}$/, {
    message: 'phoneNumber must be a valid Jordanian mobile number (e.g. 0791234567 or +962791234567)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 2,
    default: 0,
    description: 'Number of extra companions permitted for this invitation',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  companionsAllowed?: number = 0;

  @ApiPropertyOptional({
    example: 'VIP Table 3',
    description: 'Optional host note, seating, or table assignment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
