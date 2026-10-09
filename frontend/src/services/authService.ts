import { authApi } from './api/auth.api';
import { mockAuthService } from './mockAuthService';
import type { AuthTokens, UserProfile } from './types';

const PRIMARY_STORAGE_KEY = 'mira.auth';
const LEGACY_STORAGE_KEY = 'invite-studio.auth';

function getStoredAuth(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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
    const parsed = getStoredAuth();
    return parsed?.user || null;
  },

  getAccessToken(): string | null {
    const parsed = getStoredAuth();
    return parsed?.accessToken || null;
  },

  logout(): void {
    authApi.logout();
  },
};
