import { useEffect, type RefObject } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Botanical } from '../components/Botanical';
import { Btn } from '../components/Btn';
import { useReveal } from '../hooks/useReveal';

const WHATSAPP = 'https://wa.me/963956576033';
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const ExternalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 5h5v5M19 5l-8 8" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

const TEMPLATES = [
  { id: 1, slug: 'amalfi-rose', titleEn: 'Amalfi Rose', titleAr: 'ورد أمالفي', subtitleEn: 'Rose Terrace', subtitleAr: 'شرفة الورد', image: '/templates/romance.jpg', hasLiveDemo: true, demoUrl: 'https://invitations-a8x.pages.dev/demo/amalfi-rose/' },
  { id: 2, slug: 'golden-sunset', titleEn: 'Golden Sunset', titleAr: 'الغروب الذهبي', subtitleEn: 'Sunset Glow', subtitleAr: 'توهّج الغروب', image: '/templates/yellow.jpg', hasLiveDemo: false },
  { id: 3, slug: 'soft-blush', titleEn: 'Soft Blush', titleAr: 'الوردي الناعم', subtitleEn: 'Soft Floral', subtitleAr: 'زهور ناعمة', image: '/templates/white%20and%20pink.jpg', hasLiveDemo: false },
  { id: 4, slug: 'pink-floral', titleEn: 'Pink Floral', titleAr: 'الوردي المزهر', subtitleEn: 'Floral Daylight', subtitleAr: 'طابع زهري', image: '/templates/pink.jpg', hasLiveDemo: false },
  { id: 5, slug: 'blue-and-gold', titleEn: 'Blue & Gold', titleAr: 'الأزرق والذهبي', subtitleEn: 'Coastal Elegance', subtitleAr: 'أناقة ساحلية', image: '/templates/gold%20and%20sky.jpg', hasLiveDemo: false },
  { id: 6, slug: 'burgundy-classic', titleEn: 'Burgundy Classic', titleAr: 'العنابي الكلاسيكي', subtitleEn: 'Classic Romance', subtitleAr: 'رومانسية كلاسيكية', image: '/templates/burgandy.jpg', hasLiveDemo: false },
  { id: 7, slug: 'midnight-purple', titleEn: 'Midnight Purple', titleAr: 'البنفسجي الليلي', subtitleEn: 'Moonlit Garden', subtitleAr: 'حديقة ليلية', image: '/templates/purple.jpg', hasLiveDemo: false },
];

export function TemplatesPage() {
  const { t, lang } = useLang();
  const pg = t.templatesPage;
  const ref = useReveal({ group: true });

  useEffect(() => {
    document.title = pg.metaTitle;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pg.metaTitle]);

  const getTitle = (tpl: typeof TEMPLATES[0]) => lang === 'ar' ? tpl.titleAr : tpl.titleEn;
  const getSubtitle = (tpl: typeof TEMPLATES[0]) => lang === 'ar' ? tpl.subtitleAr : tpl.subtitleEn;

  return (
    <div className="landing templates-page">
      <a href="#main" className="skip-link">{t.nav.home}</a>
      <Header />
      <main id="main">
        {/* Intro */}
        <section className="templates-page__intro">
          <Botanical variant="corner" className="templates-page__deco" />
          <div className="container templates-page__intro-inner">
            <p className="eyebrow">{pg.eyebrow}</p>
            <h1 className="section-title templates-page__title">{pg.heading}</h1>
            <p className="lead templates-page__lead">{pg.paragraph}</p>
          </div>
        </section>

        {/* Gallery */}
        <section className="section templates-page__gallery">
          <div className="container">
            <ul className="gallery-grid" ref={ref as unknown as RefObject<HTMLUListElement>}>
              {TEMPLATES.map((tpl, i) => {
                const title = getTitle(tpl);
                return (
                  <li key={tpl.id} className="gallery-card reveal" data-reveal style={{ '--reveal-delay': `${(i % 3) * 0.08}s` } as React.CSSProperties}>
                    <div className="gallery-card__preview">
                      <picture className="picture-passthrough">
                        <source srcSet={tpl.image.replace(/\.jpe?g$/i, '.webp')} type="image/webp" />
                        <img
                          className="gallery-card__image"
                          src={tpl.image}
                          alt={title}
                          width={590}
                          height={1146}
                          loading={i < 3 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      </picture>
                    </div>
                    <div className="gallery-card__meta">
                      <h2 className="gallery-card__title">{title}</h2>
                      <p className="gallery-card__subtitle">{getSubtitle(tpl)}</p>
                    </div>
                    <div className="gallery-card__action">
                      {tpl.hasLiveDemo && tpl.demoUrl ? (
                        <Btn
                          href={tpl.demoUrl} target="_blank" rel="noopener noreferrer"
                          variant="primary" className="gallery-card__demo" icon={<ExternalIcon />}
                          aria-label={`${pg.liveDemo} — ${title} (${pg.newTab})`}
                        >
                          {pg.liveDemo}
                        </Btn>
                      ) : (
                        <span className="gallery-card__badge">{pg.previewOnly}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="section templates-page__cta">
          <div className="container templates-page__cta-inner">
            <h2 className="section-title">{pg.ctaHeading}</h2>
            <p className="lead">{pg.ctaParagraph}</p>
            <div className="templates-page__cta-actions">
              <Btn href={WHATSAPP} target="_blank" rel="noreferrer noopener" variant="primary" size="lg">
                {pg.ctaAction}
              </Btn>
              <Btn to="/" variant="secondary" size="lg" icon={<ArrowIcon />}>
                {pg.back}
              </Btn>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
