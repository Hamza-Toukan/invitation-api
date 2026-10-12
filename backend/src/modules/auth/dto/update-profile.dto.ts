import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'أحمد خليل', description: 'User full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'ahmad@example.com', description: 'User email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}
