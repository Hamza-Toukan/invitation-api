import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuestStatus } from '@prisma/client';

export class SubmitRsvpDto {
  @ApiProperty({
    enum: [GuestStatus.ACCEPTED, GuestStatus.DECLINED],
    example: GuestStatus.ACCEPTED,
    description: 'Attendance confirmation decision',
  })
  @IsEnum([GuestStatus.ACCEPTED, GuestStatus.DECLINED], {
    message: 'status must be either ACCEPTED or DECLINED',
  })
  status!: GuestStatus;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Number of confirmed attending companions (cannot exceed companionsAllowed)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  companionsConfirmed?: number;

  @ApiPropertyOptional({
    example: 'Looking forward to celebrating with you!',
    description: 'Optional note or dietary/attendance comments from guest',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
