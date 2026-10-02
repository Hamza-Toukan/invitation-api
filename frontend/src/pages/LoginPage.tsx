import { useState, useId, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { Botanical } from '../components/Botanical';
import { BrandLogo } from '../components/BrandLogo';
import { Btn } from '../components/Btn';
import { LangSwitch } from '../components/LangSwitch';

const WHATSAPP = 'https://wa.me/963956576033';
const INSTAGRAM = 'https://www.instagram.com/invite_studio_by_sarah';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
  </svg>
);
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10" width="15" height="10" rx="2.2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l16 16" />
    <path d="M9.6 5.6A9.6 9.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a16 16 0 0 1-3.3 4M6.3 7.9A15.8 15.8 0 0 0 2 12s3.5 6.5 10 6.5a9.7 9.7 0 0 0 3.4-.6" />
    <path d="M9.9 10a2.6 2.6 0 0 0 3.7 3.7" />
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
      <div className="auth-panel__content">
        <figure className="auth-panel__logo">
          <img
            src="/logo1.jpg" alt="Invite Studio by Sarah"
            width={440} height={440} loading="lazy"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                parent.style.background = 'var(--gradient-blush)';
                parent.style.minHeight = '200px';
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
              }
            }}
          />
        </figure>
      </div>
    </aside>
  );
}

export function LoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const uid = useId();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const emailErrId = `${uid}-email-err`;
  const passwordErrId = `${uid}-password-err`;
  const formErrId = `${uid}-form-err`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { document.title = t.login.metaTitle; }, [t]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = t.login.errors.emailRequired;
    else if (!EMAIL_RE.test(email.trim())) errs.email = t.login.errors.emailInvalid;
    if (!password) errs.password = t.login.errors.passwordRequired;
    else if (password.length < 6) errs.password = t.login.errors.passwordShort;
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      // Mock auth - in real app this would call the API
      await new Promise(resolve => setTimeout(resolve, 800));
      // Demo: any email/password with admin in email goes to admin, else dashboard
      if (email.includes('admin')) {
        navigate('/admin/clients', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setFormError(t.login.errors.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

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
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <p id={formErrId} className="login-form__alert" role="alert">{formError}</p>
              )}

              {/* Email */}
              <div className="field">
                <label htmlFor={emailId} className="field__label">{t.login.emailLabel}</label>
                <div className={`field__control${errors.email ? ' has-error' : ''}`}>
                  <span className="field__icon" aria-hidden="true"><EmailIcon /></span>
                  <input
                    id={emailId} type="email" name="email" className="field__input"
                    placeholder={t.login.emailPlaceholder}
                    value={email} autoComplete="email" inputMode="email" dir="ltr"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? emailErrId : undefined}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p id={emailErrId} className="field__error" role="alert">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor={passwordId} className="field__label">{t.login.passwordLabel}</label>
                <div className={`field__control${errors.password ? ' has-error' : ''}`}>
                  <span className="field__icon" aria-hidden="true"><LockIcon /></span>
                  <input
                    id={passwordId} type={showPw ? 'text' : 'password'} name="password" className="field__input"
                    placeholder={t.login.passwordPlaceholder}
                    value={password} autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? passwordErrId : undefined}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button" className="field__toggle"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? t.login.hidePassword : t.login.showPassword}
                    aria-pressed={showPw}
                    disabled={loading}
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p id={passwordErrId} className="field__error" role="alert">{errors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <label className="checkbox">
                <input
                  type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox__box" aria-hidden="true" />
                <span>{t.login.remember}</span>
              </label>

              <Btn type="submit" variant="primary" size="lg" className="login-form__submit" disabled={loading}>
                {loading ? t.login.submitting : t.login.submit}
              </Btn>

              <p className="login-form__help">
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
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
