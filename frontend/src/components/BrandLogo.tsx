import { useLang } from '../i18n/LanguageContext';

interface Props {
  variant?: 'wordmark' | 'monogram';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ variant = 'wordmark', className = '', size = 'md' }: Props) {
  const { t } = useLang();

  const svgSize = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const titleSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  const subtitleSize = size === 'lg' ? 'text-xs' : 'text-[0.72rem]';

  return (
    <span className={`inline-flex items-center gap-2.5 leading-none brand-logo ${variant === 'monogram' ? 'brand-logo--mono' : ''} ${className}`}>
      {/* Official Mira SVG Mark */}
      <svg
        className={`${svgSize} shrink-0 rounded-xl shadow-subtle transition-transform hover:scale-105 duration-200`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#12363A" />
        <path
          d="M15 46V24l17 15 17-15v22"
          fill="none"
          stroke="#F6F0E6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M32 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B88A4A" />
      </svg>

      {variant === 'wordmark' && (
        <span className="flex flex-col brand-logo__text">
          <span className={`flex items-center gap-1.5 font-bold text-teal ${titleSize} tracking-tight leading-tight`}>
            <span className="font-fraunces font-bold text-teal tracking-normal">Mira</span>
            <span className="text-brass/60 font-light text-sm">/</span>
            <span className="font-reem-kufi font-bold text-teal">ميرا</span>
          </span>
          <span className={`${subtitleSize} tracking-wider text-brass font-medium uppercase mt-0.5`}>
            {t.brand.by}
          </span>
        </span>
      )}
    </span>
  );
}
