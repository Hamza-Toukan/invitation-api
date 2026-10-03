import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SendOtpResponseDto } from './dto/auth-response.dto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates, hashes, stores, and dispatches a 6-digit OTP code to the provided phone number.
   * Includes rate-limiting / cooldown checks to prevent SMS spam.
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponseDto> {
    const cooldownSeconds = Number.parseInt(
      process.env.OTP_COOLDOWN_SECONDS ?? '60',
      10,
    );
    const expirySeconds = Number.parseInt(
      process.env.OTP_EXPIRY_SECONDS ?? '300',
      10,
    );

    // Rate-limiting check: Prevent re-sending within cooldown window
    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        is_verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const elapsedSeconds = Math.floor(
        (Date.now() - recentOtp.createdAt.getTime()) / 1000,
      );
      if (elapsedSeconds < cooldownSeconds) {
        const remainingWait = cooldownSeconds - elapsedSeconds;
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${remainingWait} seconds before requesting a new verification code.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Generate secure 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    // Save in database
    await this.prisma.otpVerification.create({
      data: {
        phone_number: phoneNumber,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        is_verified: false,
      },
    });

    // Development logging and extensible gateway dispatch interface
    this.dispatchOtpMessage(phoneNumber, code, expirySeconds);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresInSeconds: expirySeconds,
    };
  }

  /**
   * Verifies the provided 6-digit OTP code against the latest unverified active OTP in database.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        is_verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException(
        'No active verification code found for this phone number. Please request a new code.',
      );
    }

    if (record.expires_at < new Date()) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new code.',
      );
    }

    if (record.attempts >= 5) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new code.',
      );
    }

    const expectedHash = this.hashCode(code);
    const isMatch = this.safeCompare(record.code_hash, expectedHash);

    if (!isMatch) {
      const updatedRecord = await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = Math.max(0, 5 - updatedRecord.attempts);
      throw new BadRequestException(
        `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      );
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { is_verified: true },
    });

    return true;
  }

  /**
   * Cryptographically secure HMAC-SHA256 hash
   */
  private hashCode(code: string): string {
    const secret = process.env.OTP_SECRET ?? 'invitation-otp-secret-key';
    return crypto.createHmac('sha256', secret).update(code).digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Dispatches OTP message via SMS / WhatsApp gateway (mocked with logger for development)
   */
  private dispatchOtpMessage(
    phoneNumber: string,
    code: string,
    expiresInSeconds: number,
  ): void {
    const minutes = Math.floor(expiresInSeconds / 60);
    this.logger.log(
      `📲 [SMS/WhatsApp Gateway] Verification code for ${phoneNumber}: ${code} (Expires in ${minutes} minutes)`,
    );
  }
}
