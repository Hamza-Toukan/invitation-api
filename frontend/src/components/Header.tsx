import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { Btn } from './Btn';
import { LangSwitch } from './LangSwitch';
import { useLang } from '../i18n/LanguageContext';

const WHATSAPP = 'https://wa.me/+962790739763';
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export function Header() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: t.nav.home },
    { id: 'features', label: t.nav.features },
    { id: 'how', label: t.nav.how },
    { id: 'templates', label: t.nav.templates },
    { id: 'pricing', label: t.nav.pricing },
    { id: 'faq', label: t.nav.faq },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); burgerRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (id === 'home') {
      if (window.location.pathname !== '/') { navigate('/'); return; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else { navigate(`/#${id}`); }
  };

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="header__inner container">
        <a
          href="/"
          className="header__brand"
          onClick={e => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          aria-label={`${t.brand.name} ${t.brand.by}`}
        >
          <BrandLogo />
        </a>

        <nav className="header__nav" aria-label="Primary">
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <button type="button" className="header__link" onClick={() => scrollTo(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <LangSwitch className="header__lang" />
          <Btn to="/login" variant="ghost" className="header__login">{t.nav.login}</Btn>
          <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" className="header__cta">
            {t.nav.cta}
          </Btn>
          <button
            ref={burgerRef}
            type="button"
            className="header__burger"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav aria-label="Mobile" className="mobile-menu__nav">
          <ul>
            {navItems.map(item => (
              <li key={item.id}>
                <button type="button" className="mobile-menu__link" onClick={() => scrollTo(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__actions">
          <Btn to="/login" variant="secondary" size="lg">{t.nav.login}</Btn>
          <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" size="lg">
            {t.nav.cta}
          </Btn>
        </div>
        <LangSwitch className="mobile-menu__lang" />
      </div>

      {menuOpen && (
        <button
          type="button"
          className="mobile-menu__scrim"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
