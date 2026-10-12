import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';

const WHATSAPP = 'https://wa.me/+962790739763';

/** Social-proof number shown under the CTAs. Change ONLY this value before launch. */
const HERO_FAMILIES_COUNT = '+100';

/** Demo countdown: starts at 14 days, 8 hours, 32 minutes from page load. */
const DEMO_OFFSET_MS = ((14 * 24 + 8) * 60 + 32) * 60 * 1000;
const DAY_MS = 86_400_000;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function useCountdown() {
  const [target] = useState(() => Date.now() + DEMO_OFFSET_MS);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  return {
    target,
    days: Math.floor(diff / DAY_MS),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
  };
}

const ArrowIcon = () => (
  <svg className="mh__arrow" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const CheckIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D5B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

const SparkIcon = () => (
  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
    <path d="M5 0l1.4 3.6L10 5 6.4 6.4 5 10 3.6 6.4 0 5l3.6-1.4z" fill="#B8873B" />
  </svg>
);

export function HeroSection() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const h = t.hero;
  const { target, days, hours, minutes } = useCountdown();

  const num = (n: number) => {
    const s = String(n).padStart(2, '0');
    return isAr ? s.replace(/\d/g, (c) => ARABIC_DIGITS[Number(c)]) : s;
  };

  const { eventDate, gradDate } = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(isAr ? 'ar-u-nu-arab' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      eventDate: fmt.format(target),
      gradDate: fmt.format(target + 22 * DAY_MS),
    };
  }, [isAr, target]);

  const avatars = isAr ? ['س', 'ن', 'ل', 'م'] : ['S', 'N', 'L', 'M'];

  return (
    <section className="mh" id="home">
      <svg className="mh__pattern" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mh-pattern" width="72" height="72" patternUnits="userSpaceOnUse">
            <rect x="18" y="18" width="36" height="36" fill="none" stroke="#0F3B3A" strokeWidth="1.2" />
            <rect x="18" y="18" width="36" height="36" fill="none" stroke="#0F3B3A" strokeWidth="1.2" transform="rotate(45 36 36)" />
            <circle cx="36" cy="36" r="4" fill="none" stroke="#0F3B3A" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mh-pattern)" />
      </svg>

      <div className="mh__inner">
        {/* ───────── Text column ───────── */}
        <div className="mh__copy">
          <p className="mh__eyebrow mh-r1">
            <span className="mh__dot" />
            {h.eyebrow}
          </p>

          <h1 className="mh__title mh-r2" aria-label={h.heading}>
            <span className="mh__t1">{h.headingLine1}</span>
            <span className="mh__t2">{h.headingLine2}</span>
          </h1>

          <p className="mh__lead mh-r3">{h.paragraph}</p>

          <div className="mh__cta mh-r4">
            <a className="mh__btn mh__btn--primary" href={WHATSAPP} target="_blank" rel="noreferrer noopener">
              <span>{h.primary}</span>
              <ArrowIcon />
            </a>
            <Link className="mh__btn mh__btn--ghost" to="/templates">
              {h.secondary}
            </Link>
          </div>

          <div className="mh__trust mh-r5">
            <div className="mh__avatars" aria-hidden="true">
              {avatars.map((a, i) => (
                <span key={i} className={`mh__avatar mh__avatar--${i + 1}`}>{a}</span>
              ))}
            </div>
            <p className="mh__trust-text">
              {h.trustPre} <b>{HERO_FAMILIES_COUNT}</b> {h.trustPost}
              <br />
              {h.trustSub}
            </p>
          </div>
        </div>

        {/* ───────── Visual column ───────── */}
        <div className="mh__visual" aria-hidden="true">
          <div className="mh__glow mh-glow" />

          <div className="mh__stage">
            {/* Second invitation peeking from behind */}
            <div className="mh__back mh-back">
              <div className="mh__back-inner">
                <span className="mh__back-kind">{isAr ? 'حفل تخرج' : 'Graduation'}</span>
                <span className="mh__back-title">{isAr ? 'ألف مبروك' : 'Congratulations'}</span>
                <span className="mh__rule" />
                <span className="mh__back-date">{gradDate}</span>
              </div>
            </div>

            {/* Main phone */}
            <div className="mh__phone mh-phone">
              <div className="mh__screen">
                <div className="mh__music">
                  <span>{isAr ? 'موسيقى الحفل ترحيبية' : 'Curated Welcome Audio'}</span>
                  <span className="mh-eq"><i /><i /><i /><i /></span>
                </div>

                <div className="mh__card">
                  <div className="mh__mono">M</div>
                  <div className="mh__invited">{isAr ? 'يسرّنا دعوتكم لحضور' : 'You are cordially invited'}</div>
                  <div className="mh__couple">{isAr ? 'نور وطارق' : 'Nour & Tarek'}</div>
                  <div className="mh__divider">
                    <span /><SparkIcon /><span />
                  </div>
                  <div className="mh__when">
                    {eventDate}
                    <br />
                    {isAr ? 'قاعة اللؤلؤة' : 'The Grand Ballroom'}
                  </div>
                  <div className="mh__count">
                    <div><b>{num(days)}</b><small>{isAr ? 'يوم' : 'Days'}</small></div>
                    <div><b>{num(hours)}</b><small>{isAr ? 'ساعة' : 'Hours'}</small></div>
                    <div><b>{num(minutes)}</b><small>{isAr ? 'دقيقة' : 'Mins'}</small></div>
                  </div>
                </div>

                <div className="mh__rsvp mh-pulse">
                  {isAr ? 'تأكيد الحضور (RSVP)' : 'Confirm Attendance (RSVP)'}
                </div>
              </div>
            </div>
          </div>

          <div className="mh__chip mh__chip--a">
            <span className="mh__dot" />
            {h.chipLive}
          </div>
          <div className="mh__chip mh__chip--b">
            <CheckIcon />
            {h.chipRsvp}
          </div>
        </div>
      </div>
    </section>
  );
}
