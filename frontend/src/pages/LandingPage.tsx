import { useState, useId, useEffect, useRef } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Btn } from '../components/Btn';
import { Botanical } from '../components/Botanical';
import { TypingTitle } from '../components/TypingTitle';
import { useReveal } from '../hooks/useReveal';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { HeroSection } from '../components/HeroSection';
import { billingApi, type PricingPlan, type CouponValidationResponse } from '../services/api/billing.api';

const WHATSAPP = 'https://wa.me/[WHATSAPP_NUMBER]';

// Icons
const ArrowIcon = ({ isRtl = false }: { isRtl?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${isRtl ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
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

// Value Section
function ValueSection() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const ref = useReveal({ group: true });
  return (
    <section className="section value" ref={ref as React.RefObject<HTMLElement>}>
      <div className="value__inner container">
        <div className="value__media reveal" data-reveal>
          <div className="bg-sand-card border border-sand-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[380px]">
            {/* Top Badge */}
            <div className="flex items-center justify-between border-b border-sand-border/60 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center text-ivory font-bold text-sm">
                  M
                </div>
                <div>
                  <h4 className="font-heading font-medium text-teal text-sm leading-tight">
                    {t.brand.name} {t.brand.by}
                  </h4>
                  <p className="text-[11px] text-ink/60">
                    {isAr ? 'منصة الدعوات التفاعلية' : 'Digital Invitation Studio'}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-brass/10 text-brass border border-brass/20 rounded-full px-3 py-1 font-medium">
                {isAr ? 'متعدد المناسبات' : 'Multi-Event'}
              </span>
            </div>

            {/* Event categories preview cards */}
            <div className="space-y-3 my-auto">
              <div className="p-3.5 rounded-2xl bg-ivory/60 border border-sand-border flex items-center justify-between transition-all hover:bg-ivory">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center text-base">💍</span>
                  <div>
                    <h5 className="font-medium text-ink text-sm">{isAr ? 'حفلات الزفاف والخطوبة' : 'Weddings & Engagements'}</h5>
                    <p className="text-xs text-ink/60">{isAr ? 'موسيقى خاصة، تأكيد حضور، وتوقيت الحفل' : 'Custom music, RSVP, itinerary & directions'}</p>
                  </div>
                </div>
                <span className="text-xs text-brass font-medium">✦</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-ivory/60 border border-sand-border flex items-center justify-between transition-all hover:bg-ivory">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-brass/15 text-brass flex items-center justify-center text-base">🎓</span>
                  <div>
                    <h5 className="font-medium text-ink text-sm">{isAr ? 'حفلات التخرج والتكريم' : 'Graduation & Galas'}</h5>
                    <p className="text-xs text-ink/60">{isAr ? 'مشاركة سهلة عبر الجوال وجدار التهاني' : 'Mobile sharing & live guest congratulations wall'}</p>
                  </div>
                </div>
                <span className="text-xs text-brass font-medium">✦</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-ivory/60 border border-sand-border flex items-center justify-between transition-all hover:bg-ivory">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-clay/15 text-clay flex items-center justify-center text-base">✨</span>
                  <div>
                    <h5 className="font-medium text-ink text-sm">{isAr ? 'الاحتفالات والمناسبات الخاصة' : 'Milestone Celebrations'}</h5>
                    <p className="text-xs text-ink/60">{isAr ? 'ألبوم صور عالي الدقة وخرائط تفاعلية' : 'Curated photo albums & venue navigation'}</p>
                  </div>
                </div>
                <span className="text-xs text-brass font-medium">✦</span>
              </div>
            </div>

            {/* Bottom summary chip */}
            <div className="pt-4 mt-4 border-t border-sand-border/60 flex items-center justify-between text-xs text-ink/70">
              <span className="flex items-center gap-1.5 font-medium text-teal">
                <span className="w-2 h-2 rounded-full bg-brass" />
                {isAr ? 'تأكيد الحضور في ثوانٍ' : 'One-Tap Guest Confirmation'}
              </span>
              <span className="font-mono text-[11px] text-ink/50">2026 Edition</span>
            </div>
          </div>
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
          <figure className="why__logo-frame flex flex-col items-center justify-center p-8 bg-sand-card rounded-3xl border border-sand-border shadow-sm min-h-[340px] text-center">
            <BrandLogo size="lg" />
            <p className="mt-4 font-heading text-brass text-lg tracking-wide">
              {t.brand.tagline}
            </p>
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

// Pricing Plans Section
function PricingSection() {
  const { lang, t } = useLang();
  const isAr = lang === 'ar';
  const bT = t.billing;
  const ref = useReveal({ group: true });

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponRes, setCouponRes] = useState<CouponValidationResponse | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    billingApi.getPlans().then((data) => {
      if (Array.isArray(data) && data.length > 0) setPlans(data);
    }).catch(() => {});
  }, []);

  const displayPlans = Array.isArray(plans) && plans.length > 0 ? plans : [
    {
      id: 'basic-tier',
      slug: 'basic-tier',
      name: isAr ? 'باقة الفرح الأساسية' : 'Basic Celebration Suite',
      price: 15,
      currency: 'JOD',
      max_guests: 150,
      features: {
        en: [
          'Up to 150 unique guest invitations',
          'Interactive RSVP tracking',
          'Custom music playback',
          'Google Maps venue integration',
        ],
        ar: [
          'حتى 150 دعوة مخصصة للضيوف',
          'تتبع تأكيد الحضور (RSVP) لحظياً',
          'تشغيل موسيقى الخلفية المخصصة',
          'موقع القاعة عبر خرائط Google',
        ],
      },
      is_active: true,
    },
    {
      id: 'premium-vip',
      slug: 'premium-vip',
      name: isAr ? 'الباقة الملكية الفاخرة' : 'Royal VIP Suite',
      price: 35,
      currency: 'JOD',
      max_guests: 500,
      features: {
        en: [
          'Up to 500 unique guest invitations',
          'Photo Memories Gallery (up to 15 photos)',
          'VIP Entry QR Codes & Table assignments',
          'Live attendance scanner for reception desk',
          'Export RSVP and guest list to Excel/PDF',
        ],
        ar: [
          'حتى 500 دعوة مخصصة للضيوف',
          'معرض صور الذكريات (حتى 15 صورة)',
          'بطاقات دخول VIP مع QR Code وتوزيع الطاولات',
          'نظام مسح الحضور المباشر لموظفي الاستقبال',
          'تصدير قائمة الحضور إلى Excel و PDF',
        ],
      },
      is_active: true,
    },
  ];

  const handleValidateCoupon = async (planId: string) => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    setCouponErr(null);
    try {
      const res = await billingApi.validateCoupon({
        code: couponCode.trim(),
        planId,
      });
      setCouponRes(res);
    } catch (err: any) {
      setCouponRes(null);
      setCouponErr(err?.message || bT.couponInvalid);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <section className="section pricing py-16 md:py-24" id="pricing" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <header className="text-center mb-12">
          <p className="eyebrow text-brass font-semibold uppercase tracking-widest text-xs reveal" data-reveal>
            {isAr ? 'الباقات والأسعار' : 'Pricing Plans'}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl text-teal mt-2 mb-3 reveal" data-reveal>
            {bT.pricingTitle}
          </h2>
          <p className="text-ink/70 text-sm md:text-base max-w-xl mx-auto reveal" data-reveal>
            {bT.pricingSubtitle}
          </p>
        </header>

        {/* Promo Code Live Calculator */}
        <div className="max-w-md mx-auto mb-10 text-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidateCoupon(displayPlans[0].id);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={bT.couponPlaceholder}
              className="flex-1 px-4 py-2 rounded-xl bg-sand-card border border-sand-border text-xs text-ink focus:outline-none focus:border-brass uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || isValidating}
              className="px-4 py-2 rounded-xl bg-brass text-ivory text-xs font-semibold hover:bg-brass/90 disabled:opacity-50 transition-colors"
            >
              {isValidating ? bT.applyingCoupon : bT.applyCoupon}
            </button>
          </form>
          {couponRes && (
            <p className="text-xs text-teal font-medium mt-2">
              {bT.couponApplied
                .replace('{discount}', String(couponRes.discountAmount))
                .replace('{currency}', couponRes.currency)}
            </p>
          )}
          {couponErr && (
            <p className="text-xs text-clay font-medium mt-2">{couponErr}</p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {displayPlans.map((plan, idx) => {
            const isVip = idx === 1;
            const features =
              typeof plan.features === 'object' && plan.features !== null
                ? (isAr ? (plan.features as any).ar : (plan.features as any).en) || []
                : [];
            const planFinalPrice =
              couponRes && couponRes.valid && couponRes.originalPrice === Number(plan.price)
                ? couponRes.finalTotal
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 relative flex flex-col justify-between ${
                  isVip
                    ? 'bg-sand-card border-brass shadow-xl shadow-brass/10'
                    : 'bg-ivory border-sand-border shadow-sm'
                }`}
              >
                {isVip && (
                  <span className="absolute -top-3.5 start-6 bg-brass text-ivory text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-xl md:text-2xl text-teal">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-2 my-4">
                    <span className="font-heading text-4xl font-bold text-teal">{planFinalPrice}</span>
                    <span className="text-sm font-semibold text-brass">{plan.currency}</span>
                    <span className="text-xs text-ink/60">{bT.perEvent}</span>
                  </div>

                  {Array.isArray(features) && features.length > 0 && (
                    <ul className="space-y-2.5 my-6 text-xs sm:text-sm text-ink/80">
                      {features.map((feat: string, fIdx: number) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <span className="text-brass font-bold">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-6 border-t border-sand-border space-y-3">
                  <Btn
                    to="/login"
                    variant={isVip ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full text-center justify-center"
                  >
                    {isAr ? 'ابدأ بهذه الباقة' : 'Select Plan'}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>

        {/* CliQ Acceptance Banner */}
        <div className="bg-sand-card border border-sand-border rounded-2xl p-6 text-center max-w-2xl mx-auto shadow-sm space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
            <span className="w-2 h-2 rounded-full bg-brass" />
            <span>{isAr ? 'الدفع الآمن والسهل عبر كليك (CliQ)' : 'Seamless Jordanian CliQ Payment'}</span>
          </div>
          <p className="text-xs text-ink/70">
            {isAr
              ? 'ندعم التحويل المباشر عبر كليك بالاسم المستعار MIRA مع التحقق السريع من الإشعار وتفعيل الدعوة خلال دقائق.'
              : 'Direct transfers supported via Jordanian CliQ (Alias: MIRA) with quick receipt verification and instant activation.'}
          </p>
        </div>
      </div>
    </section>
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
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
