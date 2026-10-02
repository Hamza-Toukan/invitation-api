import { useState, useId, useEffect, useRef } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Btn } from '../components/Btn';
import { Botanical } from '../components/Botanical';
import { TypingTitle } from '../components/TypingTitle';
import { useReveal } from '../hooks/useReveal';
import { Link } from 'react-router-dom';

const WHATSAPP = 'https://wa.me/963956576033';

// Icons
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const MusicIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);
const UsersIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.4" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 20a5.5 5.5 0 0 0-3-4.9" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5.5" width="16" height="15" rx="2.2" /><path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.6-9.2-8.6A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 9.2 4.9C19 15.4 12 20 12 20Z" />
  </svg>
);
const ImageIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
const HeartIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.6-9.2-8.6A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 9.2 4.9C19 15.4 12 20 12 20Z" />
  </svg>
);

const featureIcons = [<MusicIcon />, <UsersIcon />, <CalendarIcon />, <MapPinIcon />, <ImageIcon />, <HeartIcon />];

const experienceIcons = [
  <MusicIcon />, <UsersIcon />, <CalendarIcon />, <ImageIcon />,
  <HeartIcon />, <MapPinIcon />, <CalendarIcon />, <UsersIcon />
];

const TEMPLATES = [
  { id: 1, slug: 'amalfi-rose', titleEn: 'Amalfi Rose', titleAr: 'ورد أمالفي', subtitleEn: 'Rose Terrace', subtitleAr: 'شرفة الورد', image: '/templates/romance.jpg' },
  { id: 2, slug: 'golden-sunset', titleEn: 'Golden Sunset', titleAr: 'الغروب الذهبي', subtitleEn: 'Sunset Glow', subtitleAr: 'توهّج الغروب', image: '/templates/yellow.jpg' },
  { id: 3, slug: 'soft-blush', titleEn: 'Soft Blush', titleAr: 'الوردي الناعم', subtitleEn: 'Soft Floral', subtitleAr: 'زهور ناعمة', image: '/templates/white%20and%20pink.jpg' },
  { id: 4, slug: 'pink-floral', titleEn: 'Pink Floral', titleAr: 'الوردي المزهر', subtitleEn: 'Floral Daylight', subtitleAr: 'طابع زهري', image: '/templates/pink.jpg' },
  { id: 5, slug: 'blue-and-gold', titleEn: 'Blue & Gold', titleAr: 'الأزرق والذهبي', subtitleEn: 'Coastal Elegance', subtitleAr: 'أناقة ساحلية', image: '/templates/gold%20and%20sky.jpg' },
];

// Hero Section
function HeroSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="hero" id="home" ref={ref as React.RefObject<HTMLElement>}>
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__glow hero__glow--1" />
        <span className="hero__glow hero__glow--2" />
        <Botanical variant="corner" className="hero__botanical" draw />
      </div>
      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow reveal" data-reveal>{t.hero.eyebrow}</p>
          <TypingTitle as="h1" text={t.hero.heading} className="hero__title reveal" data-reveal style={{ '--reveal-delay': '0.08s' } as React.CSSProperties} />
          <p className="lead hero__lead reveal" data-reveal style={{ '--reveal-delay': '0.16s' } as React.CSSProperties}>{t.hero.paragraph}</p>
          <div className="hero__actions reveal" data-reveal style={{ '--reveal-delay': '0.24s' } as React.CSSProperties}>
            <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" size="lg" icon={<ArrowIcon />}>
              {t.hero.primary}
            </Btn>
            <Btn
              type="button" variant="secondary" size="lg"
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t.hero.secondary}
            </Btn>
          </div>
          <p className="hero__trust reveal" data-reveal style={{ '--reveal-delay': '0.32s' } as React.CSSProperties}>{t.hero.trust}</p>
        </div>
        <div className="hero__visual reveal" data-reveal style={{ '--reveal-delay': '0.2s' } as React.CSSProperties}>
          <div className="hero__stage">
            <img
              className="hero__artwork"
              src="/hero-artwork.png"
              alt={t.hero.heading}
              loading="eager"
              decoding="async"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Value Section
function ValueSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section value" ref={ref as React.RefObject<HTMLElement>}>
      <div className="value__inner container">
        <div className="value__media reveal" data-reveal>
          <picture className="picture-passthrough">
            <source srcSet="/second-section.webp" type="image/webp" />
            <img
              className="value__artwork"
              src="/second-section.png"
              alt={t.value.heading}
              width={1023}
              height={1537}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        <div className="value__copy">
          <p className="eyebrow reveal" data-reveal>{t.value.eyebrow}</p>
          <TypingTitle text={t.value.heading} className="section-title reveal" data-reveal />
          <p className="lead reveal" data-reveal>{t.value.paragraph}</p>
          <figure className="value__quote reveal" data-reveal>
            <blockquote>{t.value.quote}</blockquote>
            <figcaption>— {t.value.quoteBy}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section features" id="features" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <header className="features__head">
          <p className="eyebrow reveal" data-reveal>{t.features.eyebrow}</p>
          <TypingTitle text={t.features.heading} className="section-title reveal" data-reveal />
          <p className="lead reveal" data-reveal>{t.features.paragraph}</p>
        </header>
        <ul className="features__grid">
          {t.features.items.map((item, i) => (
            <li key={i} className="feature reveal" data-reveal style={{ '--reveal-delay': `${(i % 3) * 0.08}s` } as React.CSSProperties}>
              <span className="feature__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="feature__icon" aria-hidden="true">{featureIcons[i]}</span>
              <h3 className="feature__title">{item.title}</h3>
              <p className="feature__desc">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Process Section
function ProcessSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section process" id="how" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <header className="process__head">
          <p className="eyebrow reveal" data-reveal>{t.process.eyebrow}</p>
          <TypingTitle text={t.process.heading} className="section-title reveal" data-reveal />
        </header>
        <ol className="process__steps">
          <span className="process__line" aria-hidden="true" />
          {t.process.steps.map((step, i) => (
            <li key={i} className="process__step reveal" data-reveal style={{ '--reveal-delay': `${i * 0.1}s` } as React.CSSProperties}>
              <span className="process__no">{step.no}</span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Experience Section
function ExperienceSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section experience" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <header className="experience__head">
          <p className="eyebrow reveal" data-reveal>{t.experience.eyebrow}</p>
          <TypingTitle text={t.experience.heading} className="section-title reveal" data-reveal />
          <p className="lead reveal" data-reveal>{t.experience.paragraph}</p>
        </header>
        <div className="experience__stage reveal" data-reveal>
          <ul className="experience__labels experience__labels--start">
            {t.experience.labels.slice(0, 4).map((label, i) => (
              <li key={i} className="experience__label">
                <span className="experience__label-icon" aria-hidden="true">{experienceIcons[i]}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <div className="experience__phone float-slow">
            <div className="mockup mockup--phone mockup--photo">
              <div className="mockup__notch" aria-hidden="true" />
              <video
                className="mockup__photo"
                src="/intro.mp4"
                poster="/phone2-poster.webp"
                aria-label={t.experience.heading}
                autoPlay muted loop playsInline preload="metadata"
              />
            </div>
          </div>
          <ul className="experience__labels experience__labels--end">
            {t.experience.labels.slice(4, 8).map((label, i) => (
              <li key={i} className="experience__label">
                <span className="experience__label-icon" aria-hidden="true">{experienceIcons[i + 4]}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Templates Section
function TemplatesSection() {
  const { t, lang } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section templates" id="templates" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <header className="templates__head">
          <div>
            <p className="eyebrow reveal" data-reveal>{t.templates.eyebrow}</p>
            <TypingTitle text={t.templates.heading} className="section-title reveal" data-reveal />
            <p className="lead reveal" data-reveal>{t.templates.paragraph}</p>
          </div>
          <Btn to="/templates" variant="secondary" className="templates__viewall reveal" data-reveal icon={<ArrowIcon />}>
            {t.templates.viewAll}
          </Btn>
        </header>
      </div>
      <div className="templates__scroller" role="list" aria-label={t.templates.heading} tabIndex={0}>
        <div className="templates__track container">
          {TEMPLATES.map((tpl, i) => (
            <article key={tpl.id} className="template-card reveal" data-reveal role="listitem" style={{ '--reveal-delay': `${(i % 3) * 0.08}s` } as React.CSSProperties}>
              <div className="template-card__preview">
                <picture className="picture-passthrough">
                  <source srcSet={tpl.image.replace(/\.jpe?g$/i, '.webp')} type="image/webp" />
                  <img
                    className="template-card__image"
                    src={tpl.image}
                    alt={lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                    width={590}
                    height={1146}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <div className="template-card__meta">
                <h3 className="template-card__title">{lang === 'ar' ? tpl.titleAr : tpl.titleEn}</h3>
                <p className="template-card__subtitle">{lang === 'ar' ? tpl.subtitleAr : tpl.subtitleEn}</p>
              </div>
              <Btn to="/templates" variant="ghost" className="template-card__action">{t.templates.action}</Btn>
            </article>
          ))}
          <Link to="/templates" className="template-card template-card--all reveal" data-reveal role="listitem">
            <div className="template-card__preview template-card__all-frame">
              <span className="template-card__all-icon" aria-hidden="true"><ArrowIcon /></span>
            </div>
            <div className="template-card__meta">
              <h3 className="template-card__title">{t.templates.viewAll}</h3>
              <p className="template-card__subtitle">{t.templates.allSubtitle}</p>
            </div>
            <span className="brand-btn brand-btn--ghost brand-btn--md template-card__action">
              <span className="brand-btn__label">{t.templates.allAction}</span>
            </span>
          </Link>
        </div>
      </div>
      <div className="container templates__foot">
        <Btn to="/templates" variant="primary" icon={<ArrowIcon />}>{t.templates.viewAll}</Btn>
      </div>
    </section>
  );
}

// Why Section
function WhySection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section why" ref={ref as React.RefObject<HTMLElement>}>
      <div className="why__inner container">
        <div className="why__visual reveal" data-reveal>
          <Botanical variant="corner" className="why__corner" />
          <figure className="why__logo-frame">
            <img
              src="/logo1.jpg"
              alt="Invite Studio by Sarah — brand logo"
              width={520} height={520}
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
            />
          </figure>
        </div>
        <div className="why__copy">
          <p className="eyebrow reveal" data-reveal>{t.why.eyebrow}</p>
          <TypingTitle text={t.why.heading} className="section-title reveal" data-reveal />
          <p className="lead reveal" data-reveal>{t.why.paragraph}</p>
          <ul className="why__points">
            {t.why.points.map((point, i) => (
              <li key={i} className="why__point reveal" data-reveal style={{ '--reveal-delay': `${i * 0.06}s` } as React.CSSProperties}>
                <span className="why__check" aria-hidden="true"><CheckIcon /></span>
                {point}
              </li>
            ))}
          </ul>
          <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" className="why__cta reveal" data-reveal icon={<ArrowIcon />}>
            {t.nav.cta}
          </Btn>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section testimonials" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <header className="testimonials__head">
          <p className="eyebrow reveal" data-reveal>{t.testimonials.eyebrow}</p>
          <TypingTitle text={t.testimonials.heading} className="section-title reveal" data-reveal />
        </header>
        <ul className="testimonials__grid">
          {t.testimonials.items.map((item, i) => (
            <li key={i} className="testimonial reveal" data-reveal style={{ '--reveal-delay': `${i * 0.09}s` } as React.CSSProperties}>
              <span className="testimonial__mark" aria-hidden="true">&ldquo;</span>
              <blockquote className="testimonial__quote">{item.quote}</blockquote>
              <footer className="testimonial__by">
                <span className="testimonial__avatar" aria-hidden="true">{item.name.trim().charAt(0)}</span>
                <span>
                  <span className="testimonial__name">{item.name}</span>
                  <span className="testimonial__role">{item.role}</span>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// FAQ Item
function FaqItem({ item, isOpen, onToggle, questionId, answerId }: {
  item: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
  questionId: string;
  answerId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const height = isOpen ? (panelRef.current?.scrollHeight ?? 'auto') : 0;
  return (
    <li className={`faq__item${isOpen ? ' is-open' : ''}`}>
      <h3 className="faq__q-wrap">
        <button
          type="button" id={questionId} className="faq__q"
          aria-expanded={isOpen} aria-controls={answerId}
          onClick={onToggle}
        >
          <span>{item.q}</span>
          <span className="faq__chevron" aria-hidden="true"><ChevronIcon /></span>
        </button>
      </h3>
      <div
        id={answerId} role="region" aria-labelledby={questionId}
        className="faq__panel"
        style={{ height: isOpen ? (typeof height === 'number' ? `${height}px` : height) : 0 }}
      >
        <div className="faq__answer" ref={panelRef}>
          <p>{item.a}</p>
        </div>
      </div>
    </li>
  );
}

// FAQ Section
function FaqSection() {
  const { t } = useLang();
  const uid = useId();
  const ref = useReveal({ group: true });
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="section faq" id="faq" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container faq__inner">
        <header className="faq__head">
          <p className="eyebrow reveal" data-reveal>{t.faq.eyebrow}</p>
          <TypingTitle text={t.faq.heading} className="section-title reveal" data-reveal />
        </header>
        <ul className="faq__list reveal" data-reveal>
          {t.faq.items.map((item, i) => (
            <FaqItem
              key={i} item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              questionId={`${uid}-q-${i}`}
              answerId={`${uid}-a-${i}`}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

// Final CTA
function FinalCta() {
  const { t } = useLang();
  const ref = useReveal({ group: true });
  return (
    <section className="section final-cta" ref={ref as React.RefObject<HTMLElement>}>
      <div className="final-cta__panel container">
        <Botanical variant="corner" className="final-cta__deco final-cta__deco--1" />
        <Botanical variant="corner" className="final-cta__deco final-cta__deco--2" />
        <div className="final-cta__content">
          <p className="eyebrow reveal" data-reveal>{t.finalCta.eyebrow}</p>
          <h2 className="final-cta__title reveal" data-reveal>{t.finalCta.heading}</h2>
          <p className="lead final-cta__body reveal" data-reveal>{t.finalCta.body}</p>
          <div className="reveal" data-reveal>
            <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" size="lg" icon={<ArrowIcon />}>
              {t.finalCta.cta}
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Landing Page
export function LandingPage() {
  const { t } = useLang();

  useEffect(() => {
    document.title = t.meta.title;
    const hash = window.location.hash;
    if (!hash) { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); return; }
    const id = hash.slice(1);
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [t]);

  return (
    <div className="landing">
      <a href="#main" className="skip-link">{t.nav.home}</a>
      <Header />
      <main id="main">
        <HeroSection />
        <ValueSection />
        <FeaturesSection />
        <ProcessSection />
        <ExperienceSection />
        <TemplatesSection />
        <WhySection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
