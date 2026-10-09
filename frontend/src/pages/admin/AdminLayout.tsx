import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/BrandLogo';
import { LangSwitch } from '../../components/LangSwitch';

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.4" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 20a5.5 5.5 0 0 0-3-4.9" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5.5" width="16" height="15" rx="2.2" /><path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
  </svg>
);

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4V6Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5h3a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 19h-3" />
    <path d="M10 12h9M16 8.5 19.5 12 16 15.5" />
  </svg>
);

interface AdminLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = [
    { to: '/admin/clients', label: t.admin.nav.clients, icon: <UsersIcon /> },
    { to: '/admin/guests', label: t.admin.nav.guests, icon: <CalendarIcon /> },
    { to: '/admin/messages', label: t.admin.nav.messages, icon: <MessageIcon /> },
  ];

  return (
    <div className="admin-shell" data-collapsed={collapsed} style={{ minHeight: '100vh', display: 'flex', background: 'var(--admin-bg, #fdf7f4)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{
        width: collapsed ? '80px' : '264px',
        background: 'var(--admin-sidebar-bg, #fbeee9)',
        borderInlineEnd: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        transition: 'width 0.3s ease',
        flexShrink: 0,
      }}>
        <div>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <BrandLogo variant={collapsed ? 'monogram' : 'wordmark'} />
            </a>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? t.admin.nav.expand : t.admin.nav.collapse}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--taupe)',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
            >
              ⇄
            </button>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {navLinks.map(link => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => `admin-navlink ${isActive ? 'is-active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.65rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--ivory)' : 'var(--cocoa)',
                      background: isActive ? 'var(--gradient-rose)' : 'transparent',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                    })}
                  >
                    <span style={{ display: 'inline-flex' }}>{link.icon}</span>
                    {!collapsed && <span>{link.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid var(--border-fine)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!collapsed && <LangSwitch />}
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              background: 'none',
              border: 'none',
              color: 'var(--taupe)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '0.4rem 0.6rem',
            }}
          >
            <LogoutIcon />
            {!collapsed && <span>{t.admin.nav.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header className="admin-header" style={{
          background: 'var(--ivory)',
          borderBottom: '1px solid var(--border-soft)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', color: 'var(--cocoa)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              {title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', margin: '0.2rem 0 0' }}>
              {subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--gradient-rose)',
              color: 'var(--ivory)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MI'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa)' }}>
                {user?.name || 'Admin Mira'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)' }}>
                Administrator
              </span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="admin-main" style={{ padding: '2rem', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
