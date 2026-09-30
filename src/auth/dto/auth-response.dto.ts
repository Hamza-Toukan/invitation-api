import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class SendOtpResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'OTP sent successfully' })
  message: string;

  @ApiProperty({ example: 300, description: 'Code validity in seconds' })
  expiresInSeconds: number;
}

export class UserProfileDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '+962791234567' })
  phoneNumber: string;

  @ApiProperty({ example: 'user@example.com', nullable: true, required: false })
  email?: string | null;

  @ApiProperty({ example: 'Ahmad Toukan', nullable: true, required: false })
  name?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.HOST })
  role: UserRole;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'JWT Bearer Access Token (short-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT Refresh Token (long-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
