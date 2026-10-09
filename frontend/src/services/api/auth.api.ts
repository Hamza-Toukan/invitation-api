import { apiClient } from './client';
import type { AuthTokens, UserProfile } from '../types';

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

export const authApi = {
  /**
   * Send 6-digit verification code to the given phone number
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResult> {
    return apiClient.post<SendOtpResult>('/auth/otp/send', {
      phoneNumber: phoneNumber.trim(),
    });
  },

  /**
   * Verify OTP and receive JWT access & refresh tokens
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<AuthTokens> {
    const res = await apiClient.post<AuthTokens>('/auth/otp/verify', {
      phoneNumber: phoneNumber.trim(),
      code: code.trim(),
    });

    // Persist authenticated session
    try {
      localStorage.setItem('mira.auth', JSON.stringify(res));
    } catch {}

    return res;
  },

  /**
   * Fetch currently authenticated user profile using stored JWT
   */
  async getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/me');
  },

  /**
   * Clear authentication tokens from localStorage
   */
  logout(): void {
    try {
      localStorage.removeItem('mira.auth');
      localStorage.removeItem('invite-studio.auth');
    } catch {}
  },
};
