import { useLang } from '../i18n/LanguageContext';

interface Props {
  variant?: 'wordmark' | 'monogram';
}

export function BrandLogo({ variant = 'wordmark' }: Props) {
  const { t } = useLang();
  return (
    <span className={`brand-logo ${variant === 'monogram' ? 'brand-logo--mono' : ''}`}>
      {/* Monogram SVG */}
      <svg
        className="brand-mono"
        viewBox="0 0 52 61"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9e5e49" />
            <stop offset="45%" stopColor="#d6a18c" />
            <stop offset="75%" stopColor="#b8735a" />
            <stop offset="100%" stopColor="#8c4f3d" />
          </linearGradient>
        </defs>
        <path
          d="M26 4C14 4 5 13 5 25s8 18 18 22c2 .8 3 1.2 3 2s-1 1.4-3 2.2C12.5 54 5 60 5 60h42s-7.5-6-18-8.8c-2-.8-3-1.4-3-2.2s1-1.2 3-2C37 43 47 37 47 25S38 4 26 4Z"
          fill="url(#logo-gradient)"
          opacity="0.9"
        />
        <text
          x="26"
          y="32"
          textAnchor="middle"
          fontFamily="'Pinyon Script', cursive"
          fontSize="22"
          fill="#fff9f6"
          opacity="0.95"
        >
          S
        </text>
      </svg>
      {variant === 'wordmark' && (
        <span className="brand-logo__text">
          <span className="brand-logo__name">{t.brand.name}</span>
          <span className="brand-logo__by">{t.brand.by}</span>
        </span>
      )}
    </span>
  );
}
