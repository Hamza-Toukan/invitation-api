import { useLang } from '../i18n/LanguageContext';
import { Btn } from '../components/Btn';
import { BrandLogo } from '../components/BrandLogo';
import { Botanical } from '../components/Botanical';

export function NotFoundPage() {
  const { t } = useLang();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '2rem', background: 'var(--gradient-hero)', position: 'relative', overflow: 'hidden'
    }}>
      <Botanical variant="corner" className="" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
      <BrandLogo />
      <h1 style={{ marginTop: '2rem', fontSize: 'clamp(4rem, 12vw, 8rem)', fontFamily: 'var(--font-serif-en)', color: 'var(--rose-gold-light)', lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', color: 'var(--cocoa)', margin: '1rem 0 2rem', fontFamily: 'var(--font-heading)' }}>Page not found</p>
      <Btn to="/" variant="primary" size="lg">{t.nav.home}</Btn>
    </div>
  );
}
