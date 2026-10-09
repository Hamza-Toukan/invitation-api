import { useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { LangSwitch } from './LangSwitch';
import { useLang } from '../i18n/LanguageContext';

const WHATSAPP = 'https://wa.me/+962790739763';
const INSTAGRAM = 'https://instagram.com/[INSTAGRAM_HANDLE]';
const EMAIL = '[EMAIL]';
const GMAIL_LINK = `mailto:${EMAIL}`;
const YEAR = new Date().getFullYear();

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
  </svg>
);
const InstaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11.5a8 8 0 0 1-11.9 6.96L4 20l1.6-3.9A8 8 0 1 1 20 11.5Z" />
    <path d="M9 8.5c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.6 2 .8 2.5.7 2.9.6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.4-.3-.2-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.1-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.3Z" fill="currentColor" stroke="none" />
  </svg>
);

export function Footer() {
  const { t } = useLang();
  const navigate = useNavigate();

  const navItems = [
    { id: 'features', label: t.nav.features },
    { id: 'how', label: t.nav.how },
    { id: 'templates', label: t.nav.templates },
    { id: 'faq', label: t.nav.faq },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else navigate(`/#${id}`);
  };

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a
            href="/"
            onClick={e => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0 }); }}
            aria-label={`${t.brand.name} ${t.brand.by}`}
          >
            <BrandLogo />
          </a>
          <p className="footer__desc">{t.footer.description}</p>
          <LangSwitch />
        </div>

        <nav className="footer__col" aria-label={t.footer.navTitle}>
          <h2 className="footer__title">{t.footer.navTitle}</h2>
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <button type="button" className="footer__link" onClick={() => scrollTo(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="footer__title">{t.footer.contactTitle}</h2>
          <ul>
            <li>
              <a className="footer__link footer__link--icon" href={GMAIL_LINK} target="_blank" rel="noreferrer noopener">
                <EmailIcon /> {t.footer.contact}
              </a>
            </li>
            <li>
              <a className="footer__link footer__link--icon" href={INSTAGRAM} target="_blank" rel="noreferrer noopener">
                <InstaIcon /> {t.footer.instagram}
              </a>
            </li>
            <li>
              <a className="footer__link footer__link--icon" href={WHATSAPP} target="_blank" rel="noreferrer noopener">
                <WhatsAppIcon /> {t.footer.whatsapp}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {YEAR} {t.brand.name} {t.brand.by}. {t.footer.rights}</p>
        <div className="footer__legal">
          <a href="#" className="footer__link">{t.footer.privacy}</a>
          <span aria-hidden="true">·</span>
          <a href="#" className="footer__link">{t.footer.terms}</a>
        </div>
      </div>
    </footer>
  );
}
