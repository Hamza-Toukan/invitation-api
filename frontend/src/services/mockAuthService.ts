import type { AuthTokens, UserProfile } from './types';

const STORAGE_KEY_AUTH = 'mira.auth';
const DEMO_CODE = '123456';

export const mockAuthService = {
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Basic format validation
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    if (!cleaned) {
      throw new Error('Phone number is required');
    }

    return {
      success: true,
      message: 'Verification code sent via SMS/WhatsApp',
      expiresInSeconds: 300,
    };
  },

  async verifyOtp(phoneNumber: string, code: string): Promise<AuthTokens> {
    await new Promise(resolve => setTimeout(resolve, 700));

    if (code !== DEMO_CODE && code.length !== 6) {
      throw new Error('Invalid verification code. Please enter 123456 for demo.');
    }

    const isAdmin = phoneNumber.includes('9999') || phoneNumber.includes('admin');
    const user: UserProfile = {
      id: isAdmin ? 'admin-uuid-0001' : 'host-uuid-0001',
      phoneNumber,
      name: isAdmin ? 'Admin Mira' : 'Ahmad Toukan',
      email: isAdmin ? 'admin@mira-invitations.com' : 'ahmad@example.com',
      role: isAdmin ? 'ADMIN' : 'HOST',
    };

    const tokens: AuthTokens = {
      accessToken: `mock-jwt-access-${Date.now()}`,
      refreshToken: `mock-jwt-refresh-${Date.now()}`,
      user,
    };

    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(tokens));
    } catch {}

    return tokens;
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
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {}
  },
};
