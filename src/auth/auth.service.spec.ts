import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let mockOtpService: {
    sendOtp: jest.Mock;
    verifyOtp: jest.Mock;
  };
  let mockJwtService: {
    sign: jest.Mock;
  };

  const rawPhone = '0791234567';
  const normalizedPhone = '+962791234567';

  beforeEach(() => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    mockOtpService = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn().mockImplementation((payload) => `mock_token_for_${payload.sub}`),
    };

    authService = new AuthService(
      mockPrismaService as unknown as PrismaService,
      mockOtpService as unknown as OtpService,
      mockJwtService as unknown as JwtService,
    );
  });

  describe('sendOtp', () => {
    it('should normalize Jordanian phone number and delegate to OtpService', async () => {
      mockOtpService.sendOtp.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresInSeconds: 300,
      });

      const result = await authService.sendOtp({ phoneNumber: rawPhone });

      expect(mockOtpService.sendOtp).toHaveBeenCalledWith(normalizedPhone);
      expect(result.success).toBe(true);
    });
  });

  describe('verifyOtp', () => {
    const code = '123456';

    it('should create a new User with HOST role if user does not exist, and issue tokens', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-uuid',
        phone_number: normalizedPhone,
        email: null,
        name: null,
        role: UserRole.HOST,
      });

      const response = await authService.verifyOtp({
        phoneNumber: rawPhone,
        code,
      });

      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(normalizedPhone, code);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          phone_number: normalizedPhone,
          role: UserRole.HOST,
        },
      });
      expect(response.accessToken).toBe('mock_token_for_new-user-uuid');
      expect(response.refreshToken).toBe('mock_token_for_new-user-uuid');
      expect(response.user.role).toBe(UserRole.HOST);
      expect(response.user.phoneNumber).toBe(normalizedPhone);
    });

    it('should authenticate existing user without creating a new user record', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user-uuid',
        phone_number: normalizedPhone,
        email: 'host@example.com',
        name: 'Existing Host',
        role: UserRole.HOST,
      });

      const response = await authService.verifyOtp({
        phoneNumber: rawPhone,
        code,
      });

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(response.user.id).toBe('existing-user-uuid');
      expect(response.user.name).toBe('Existing Host');
    });
  });

  describe('getProfile', () => {
    it('should return user profile if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id-1',
        phone_number: normalizedPhone,
        email: 'user@example.com',
        name: 'Ahmad',
        role: UserRole.HOST,
      });

      const profile = await authService.getProfile('user-id-1');

      expect(profile.id).toBe('user-id-1');
      expect(profile.phoneNumber).toBe(normalizedPhone);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
