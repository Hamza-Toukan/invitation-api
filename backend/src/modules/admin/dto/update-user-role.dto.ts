import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, description: 'Updated role for user' })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
