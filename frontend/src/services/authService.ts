import { authApi } from './api/auth.api';
import { mockAuthService } from './mockAuthService';
import type { AuthTokens, UserProfile } from './types';

const STORAGE_KEY_AUTH = 'invite-studio.auth';

export const authService = {
  /**
   * Send verification code via real backend, with graceful demo fallback
   */
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    try {
      return await authApi.sendOtp(phoneNumber);
    } catch (err: any) {
      console.warn('Real backend send-otp failed, falling back to mock:', err);
      return mockAuthService.sendOtp(phoneNumber);
    }
  },

  /**
   * Verify verification code via real backend, with graceful demo fallback
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<AuthTokens> {
    try {
      return await authApi.verifyOtp(phoneNumber, code);
    } catch (err: any) {
      console.warn('Real backend verify-otp failed, falling back to mock:', err);
      return mockAuthService.verifyOtp(phoneNumber, code);
    }
  },

  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!raw) return null;
      const parsed: AuthTokens = JSON.parse(raw);
      return parsed.user;
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!raw) return null;
      const parsed: AuthTokens = JSON.parse(raw);
      return parsed.accessToken;
    } catch {
      return null;
    }
  },

  logout(): void {
    authApi.logout();
  },
};
