import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile } from '../services/types';
import { authService } from '../services/authService';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; expiresInSeconds: number }>;
  verifyOtp: (phone: string, code: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    return authService.sendOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await authService.verifyOtp(phone, code);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      sendOtp,
      verifyOtp,
      logout,
    }),
    [user, sendOtp, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
