import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not admin (role is not ADMIN or SUPER_ADMIN), redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
