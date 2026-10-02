import { useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { BrandLogo } from '../components/BrandLogo';
import { Btn } from '../components/Btn';

// Placeholder dashboard page - shows a mock client dashboard
export function DashboardPage() {
  const { t } = useLang();

  useEffect(() => {
    document.title = `Dashboard — Invite Studio by Sarah`;
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <BrandLogo />
      <h1 style={{ marginTop: '2rem', fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--cocoa)' }}>Dashboard</h1>
      <p style={{ color: 'var(--taupe)', marginTop: '1rem', marginBottom: '2rem', maxWidth: '42ch', lineHeight: 1.7 }}>
        Welcome! Your invitation dashboard is being set up. Check back soon.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn to="/" variant="secondary" size="lg">{t.nav.home}</Btn>
      </div>
    </div>
  );
}
