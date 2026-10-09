import { useState, useEffect, useId, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Botanical } from '../components/Botanical';
import { BrandLogo } from '../components/BrandLogo';
import { Btn } from '../components/Btn';
import { LangSwitch } from '../components/LangSwitch';

const WHATSAPP = 'https://wa.me/[WHATSAPP_NUMBER]';
const INSTAGRAM = 'https://instagram.com/[INSTAGRAM_HANDLE]';

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <path d="M12 18h.01" />
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-1.5 1.5L12 11l4 4 1.5-1.5M19 5l-7 7m0 0a5 5 0 1 1-7-7 5 5 0 0 1 7 7z" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const WhatsAppIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="1.05em" height="1.05em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11.5a8 8 0 0 1-11.9 6.96L4 20l1.6-3.9A8 8 0 1 1 20 11.5Z" />
    <path d="M9 8.5c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.6 2 .8 2.5.7 2.9.6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.4-.3-.2-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.1-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.3Z" fill="currentColor" stroke="none" />
  </svg>
);

const InstaIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="1.05em" height="1.05em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

function AuthPanel() {
  const { t } = useLang();
  return (
    <aside className="auth-panel" aria-label={t.brand.tagline}>
      <div className="auth-panel__bg" aria-hidden="true">
        <span className="auth-panel__glow" />
        <Botanical variant="corner" className="auth-panel__deco" draw />
      </div>
      <div className="auth-panel__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <figure className="auth-panel__logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <BrandLogo size="lg" />
          <figcaption style={{ color: 'var(--brass)', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '0.5rem', letterSpacing: '0.02em' }}>
            {t.brand.tagline}
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}

export function LoginPage() {
  const { t } = useLang();
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const uid = useId();

  const phoneId = `${uid}-phone`;
  const codeId = `${uid}-code`;

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('0791234567');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t.login.metaTitle;
  }, [t]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const clean = phone.trim().replace(/[\s-]/g, '');
    if (!clean) {
      setError(t.login.errors.phoneRequired);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(clean);
      setStep('otp');
      setCooldown(60);
      setCode('123456'); // Pre-fill mock code for seamless testing
    } catch (err: any) {
      setError(err?.message || t.login.errors.unknown);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length !== 6) {
      setError(t.login.errors.codeInvalid);
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOtp(phone.trim(), code.trim());
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/clients', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || t.login.errors.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoPhone: string) => {
    setPhone(demoPhone);
    setError(null);
    if (step === 'otp') {
      setCode('123456');
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden="true">
        <span className="login-page__glow login-page__glow--1" />
        <span className="login-page__glow login-page__glow--2" />
      </div>

      <div className="login-page__grid">
        <AuthPanel />

        <main className="login-main" id="main">
          <header className="login-main__top">
            <Link to="/" className="login-main__back">
              <ArrowIcon />
              <span>{t.login.back}</span>
            </Link>
            <LangSwitch />
          </header>

          <div className="login-main__body">
            <Link to="/" className="login-main__logo" aria-label={`${t.brand.name} ${t.brand.by}`}>
              <BrandLogo />
            </Link>

            <div className="login-main__intro">
              <h1 className="login-main__heading">{t.login.heading}</h1>
              <p className="login-main__supporting">{t.login.supporting}</p>
            </div>

            {/* Quick Demo Credentials Bar */}
            <div style={{
              background: 'rgba(184, 115, 90, 0.08)',
              border: '1px dashed var(--border-soft)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--rose-gold-deep)' }}>
                ⚡ {t.login.demoHint}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDemoAccount('0791234567')}
                  style={{
                    border: '1px solid var(--border-soft)',
                    background: 'var(--ivory)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.2rem 0.65rem',
                    fontSize: '0.8rem',
                    color: 'var(--cocoa)',
                    cursor: 'pointer',
                  }}
                >
                  👤 Host (0791234567)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount('0799999999')}
                  style={{
                    border: '1px solid var(--border-soft)',
                    background: 'var(--ivory)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.2rem 0.65rem',
                    fontSize: '0.8rem',
                    color: 'var(--cocoa)',
                    cursor: 'pointer',
                  }}
                >
                  🛡️ Admin (0799999999)
                </button>
              </div>
            </div>

            {error && (
              <p className="login-form__alert" role="alert" style={{ marginBottom: '1.25rem' }}>
                {error}
              </p>
            )}

            {step === 'phone' ? (
              /* Step 1: Phone number */
              <form className="login-form" onSubmit={handleSendCode} noValidate>
                <div className="field">
                  <label htmlFor={phoneId} className="field__label">{t.login.phoneLabel}</label>
                  <div className="field__control">
                    <span className="field__icon" aria-hidden="true"><PhoneIcon /></span>
                    <input
                      id={phoneId}
                      type="tel"
                      name="phone"
                      className="field__input"
                      placeholder={t.login.phonePlaceholder}
                      value={phone}
                      autoComplete="tel"
                      dir="ltr"
                      onChange={e => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                    {t.login.phoneHint}
                  </p>
                </div>

                <Btn type="submit" variant="primary" size="lg" className="login-form__submit" disabled={loading}>
                  {loading ? t.login.sendingCode : t.login.sendCode}
                </Btn>
              </form>
            ) : (
              /* Step 2: 6-digit OTP Code */
              <form className="login-form" onSubmit={handleVerifyCode} noValidate>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--ivory)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.9rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--rose-gold)' }}><PhoneIcon /></span>
                    <span dir="ltr" style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1.05rem' }}>
                      {phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--rose-gold-deep)',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <EditIcon /> {t.login.changePhone}
                  </button>
                </div>

                <div className="field">
                  <label htmlFor={codeId} className="field__label">{t.login.codeLabel}</label>
                  <div className="field__control">
                    <span className="field__icon" aria-hidden="true"><KeyIcon /></span>
                    <input
                      id={codeId}
                      type="text"
                      name="code"
                      className="field__input"
                      placeholder={t.login.codePlaceholder}
                      value={code}
                      maxLength={6}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      dir="ltr"
                      style={{ letterSpacing: '0.3em', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--taupe)' }}>{t.login.codeHint}</span>
                    {cooldown > 0 ? (
                      <span style={{ color: 'var(--taupe)', fontFamily: 'monospace' }}>
                        {t.login.resendIn.replace('{s}', String(cooldown))}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendCode()}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--rose-gold-deep)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {t.login.resendCode}
                      </button>
                    )}
                  </div>
                </div>

                <Btn type="submit" variant="primary" size="lg" className="login-form__submit" disabled={loading || code.length !== 6}>
                  {loading ? t.login.verifyingCode : t.login.verifyCode}
                </Btn>
              </form>
            )}

            <p className="login-form__help" style={{ marginTop: '2rem' }}>
              {t.login.help.prompt}{' '}
              <a className="login-form__help-link" href={WHATSAPP} target="_blank" rel="noreferrer noopener">
                <WhatsAppIcon className="login-form__help-icon login-form__help-icon--whatsapp" />
                {t.login.help.whatsapp}
              </a>{' '}
              {t.login.help.or}{' '}
              <a className="login-form__help-link" href={INSTAGRAM} target="_blank" rel="noreferrer noopener">
                <InstaIcon className="login-form__help-icon" />
                {t.login.help.instagram}
              </a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
