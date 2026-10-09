import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvitationPage } from './pages/InvitationPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminGuestsPage } from './pages/admin/AdminGuestsPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminRoute } from './components/AdminRoute';

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gradient-hero)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid var(--border-soft)',
        borderTopColor: 'var(--rose-gold)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/invite/:token" element={<InvitationPage />} />
              <Route path="/invite" element={<InvitationPage />} />
              
              {/* Admin Portal Protected Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/clients" element={<AdminClientsPage />} />
                <Route path="/admin/guests" element={<AdminGuestsPage />} />
                <Route path="/admin/messages" element={<AdminMessagesPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
