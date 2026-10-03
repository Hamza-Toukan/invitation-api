import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { OtpService } from './otp.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OtpService', () => {
  let service: OtpService;
  let mockPrismaService: {
    otpVerification: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const testPhone = '+962791234567';

  beforeEach(() => {
    mockPrismaService = {
      otpVerification: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new OtpService(
      mockPrismaService as unknown as PrismaService,
    );
  });

  describe('sendOtp', () => {
    it('should generate, hash, and store a 6-digit OTP code successfully', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(null);
      mockPrismaService.otpVerification.create.mockResolvedValue({
        id: 'otp-id-1',
        phone_number: testPhone,
        code_hash: 'somehash',
        expires_at: new Date(Date.now() + 300000),
      });

      const result = await service.sendOtp(testPhone);

      expect(result.success).toBe(true);
      expect(result.expiresInSeconds).toBe(300);
      expect(mockPrismaService.otpVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone_number: testPhone,
          code_hash: expect.any(String),
          expires_at: expect.any(Date),
          attempts: 0,
          is_verified: false,
        }),
      });
    });

    it('should throw 429 Too Many Requests if requested within cooldown period', async () => {
      const recentDate = new Date(Date.now() - 20000); // 20s ago (less than 60s cooldown)
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'recent-otp-id',
        phone_number: testPhone,
        createdAt: recentDate,
        is_verified: false,
      });

      await expect(service.sendOtp(testPhone)).rejects.toThrow(HttpException);

      try {
        await service.sendOtp(testPhone);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should allow sending new OTP if previous one was sent after cooldown window', async () => {
      const oldDate = new Date(Date.now() - 70000); // 70s ago (exceeds 60s cooldown)
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'old-otp-id',
        phone_number: testPhone,
        createdAt: oldDate,
        is_verified: false,
      });
      mockPrismaService.otpVerification.create.mockResolvedValue({
        id: 'new-otp-id',
      });

      const result = await service.sendOtp(testPhone);
      expect(result.success).toBe(true);
      expect(mockPrismaService.otpVerification.create).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    const secret = process.env.OTP_SECRET ?? 'invitation-otp-secret-key';
    const validCode = '654321';
    const validHash = crypto
      .createHmac('sha256', secret)
      .update(validCode)
      .digest('hex');

    it('should throw BadRequestException if no unverified OTP record exists', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp(testPhone, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP code has expired', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'expired-otp-id',
        phone_number: testPhone,
        code_hash: validHash,
        expires_at: new Date(Date.now() - 10000), // expired 10s ago
        attempts: 0,
      });

      await expect(service.verifyOtp(testPhone, validCode)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if maximum attempts exceeded', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'max-attempts-otp-id',
        phone_number: testPhone,
        code_hash: validHash,
        expires_at: new Date(Date.now() + 100000),
        attempts: 5,
      });

      await expect(service.verifyOtp(testPhone, validCode)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should increment attempts and throw BadRequestException on wrong code', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-id-fail',
        phone_number: testPhone,
        code_hash: validHash,
        expires_at: new Date(Date.now() + 100000),
        attempts: 1,
      });
      mockPrismaService.otpVerification.update.mockResolvedValue({
        attempts: 2,
      });

      await expect(service.verifyOtp(testPhone, '000000')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.otpVerification.update).toHaveBeenCalledWith({
        where: { id: 'otp-id-fail' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('should mark OTP as verified and return true when code is correct', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'valid-otp-id',
        phone_number: testPhone,
        code_hash: validHash,
        expires_at: new Date(Date.now() + 100000),
        attempts: 0,
      });
      mockPrismaService.otpVerification.update.mockResolvedValue({
        id: 'valid-otp-id',
        is_verified: true,
      });

      const isVerified = await service.verifyOtp(testPhone, validCode);

      expect(isVerified).toBe(true);
      expect(mockPrismaService.otpVerification.update).toHaveBeenCalledWith({
        where: { id: 'valid-otp-id' },
        data: { is_verified: true },
      });
    });
  });
});
