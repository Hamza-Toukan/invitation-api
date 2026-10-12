import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { QueryAdminPaginationDto } from './query-admin-pagination.dto';

export class QueryUsersDto extends QueryAdminPaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name, phone number, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
