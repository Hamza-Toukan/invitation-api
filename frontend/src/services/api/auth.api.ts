import { apiClient, saveStoredAuth, clearStoredAuth } from './client';
import type { AuthTokens, UserProfile } from '../types';

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

export interface VerifyOtpDto {
  phoneNumber?: string;
  phone?: string;
  code?: string;
  otp?: string;
}

export const authApi = {
  /**
   * Send 6-digit verification code to the given phone number
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResult> {
    const cleanPhone = (phoneNumber || '').trim().replace(/[\s-]/g, '');
    const res = await apiClient.post<any>('/auth/otp/send', {
      phoneNumber: cleanPhone,
    });

    const payload = res?.data?.data || res?.data || res;
    return {
      success: payload?.success ?? true,
      message: payload?.message ?? 'OTP sent successfully',
      expiresInSeconds: payload?.expiresInSeconds ?? 300,
    };
  },

  /**
   * Verify OTP and receive JWT access & refresh tokens
   * Strictly aligns payload to { phoneNumber, code } matching NestJS VerifyOtpDto
   * Unwraps response data safely supporting both res.data?.data || res.data || res
   * Immediately saves accessToken, refreshToken, and user in localStorage BEFORE returning
   */
  async verifyOtp(
    phoneOrDto: string | VerifyOtpDto,
    maybeCode?: string
  ): Promise<AuthTokens> {
    let cleanPhone = '';
    let cleanCode = '';

    if (typeof phoneOrDto === 'string') {
      cleanPhone = phoneOrDto.trim().replace(/[\s-]/g, '');
      cleanCode = (maybeCode || '').trim();
    } else if (phoneOrDto && typeof phoneOrDto === 'object') {
      cleanPhone = (phoneOrDto.phoneNumber || phoneOrDto.phone || '').trim().replace(/[\s-]/g, '');
      cleanCode = (phoneOrDto.code || phoneOrDto.otp || maybeCode || '').trim();
    }

    const res = await apiClient.post<any>('/auth/otp/verify', {
      phoneNumber: cleanPhone,
      code: cleanCode,
    });

    // Unpack wrapped payload safely
    const payload = res?.data?.data || res?.data || res;
    const { accessToken, refreshToken, user } = payload || {};

    const tokens: AuthTokens = {
      accessToken: accessToken || '',
      refreshToken: refreshToken || '',
      user: {
        id: user?.id || '',
        phoneNumber: user?.phoneNumber || cleanPhone,
        email: user?.email ?? null,
        name: user?.name ?? null,
        role: user?.role || 'HOST',
      },
    };

    // Immediately persist session in localStorage BEFORE state changes
    saveStoredAuth(tokens);

    return tokens;
  },

  /**
   * Fetch currently authenticated user profile using stored JWT
   */
  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<any>('/auth/me');
    const payload = res?.data?.data || res?.data || res;
    return {
      id: payload?.id || '',
      phoneNumber: payload?.phoneNumber || '',
      email: payload?.email ?? null,
      name: payload?.name ?? null,
      role: payload?.role || 'HOST',
    };
  },

  /**
   * Clear authentication tokens from localStorage
   */
  logout(): void {
    clearStoredAuth();
  },
};
