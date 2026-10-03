import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuestStatus } from '@prisma/client';

export class QueryGuestsDto {
  @ApiPropertyOptional({
    enum: GuestStatus,
    description: 'Filter by RSVP status',
  })
  @IsOptional()
  @IsEnum(GuestStatus)
  status?: GuestStatus;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by physical reception check-in status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  checkedIn?: boolean;

  @ApiPropertyOptional({
    description: 'Search by guest name or phone number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    default: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 20,
    description: 'Number of guests per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
