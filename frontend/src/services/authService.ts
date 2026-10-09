import { authApi } from './api/auth.api';
import type { AuthTokens, UserProfile } from './types';

const PRIMARY_STORAGE_KEY = 'mira.auth';
const LEGACY_STORAGE_KEY = 'invite-studio.auth';

export function getStoredAuth(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    // Handle both direct and nested data structures safely
    const payload = parsed?.data?.data || parsed?.data || parsed;
    if (payload?.accessToken) {
      return {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || '',
        user: payload.user || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const authService = {
  /**
   * Send verification code via real backend authApi
   */
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    return authApi.sendOtp(phoneNumber);
  },

  /**
   * Verify verification code via real backend authApi
   * Tokens are guaranteed to be stored before returning
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<AuthTokens> {
    return authApi.verifyOtp(phoneNumber, code);
  },

  getCurrentUser(): UserProfile | null {
    const auth = getStoredAuth();
    return auth?.user || null;
  },

  getAccessToken(): string | null {
    const auth = getStoredAuth();
    return auth?.accessToken || null;
  },

  logout(): void {
    authApi.logout();
  },
};
