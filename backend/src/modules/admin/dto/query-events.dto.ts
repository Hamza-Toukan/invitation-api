import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { QueryAdminPaginationDto } from './query-admin-pagination.dto';

export class QueryAdminEventsDto extends QueryAdminPaginationDto {
  @ApiPropertyOptional({ description: 'Search term for event title, host name, or host phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EventStatus, description: 'Filter by event status' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
