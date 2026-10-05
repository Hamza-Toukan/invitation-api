import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from './dto';
import {
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { normalizePhoneNumber } from './utils/phone.util';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Dispatches an OTP verification code to the normalized phone number.
   */
  async sendOtp(dto: SendOtpDto): Promise<SendOtpResponseDto> {
    const normalizedPhone = normalizePhoneNumber(dto.phoneNumber);
    return this.otpService.sendOtp(normalizedPhone);
  }

  /**
   * Verifies the OTP code. If valid, registers the user if new, or logs them in.
   * Generates JWT Access and Refresh tokens.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    const normalizedPhone = normalizePhoneNumber(dto.phoneNumber);

    // Verify OTP validity, attempts, and expiry
    await this.otpService.verifyOtp(normalizedPhone, dto.code);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone_number: normalizedPhone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone_number: normalizedPhone,
          role: UserRole.HOST,
        },
      });
    }

    // Generate JWT access & refresh tokens
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phone_number,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_SECRET ??
        'super-secret-jwt-key-for-invitation-platform',
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh' },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ??
          'super-secret-refresh-key-for-invitation-platform',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
      },
    );

    const userProfile: UserProfileDto = {
      id: user.id,
      phoneNumber: user.phone_number,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }

  /**
   * Retrieves profile of currently authenticated user.
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone_number: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      phoneNumber: user.phone_number,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
