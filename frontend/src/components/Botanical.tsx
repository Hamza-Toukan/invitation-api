type Variant = 'sprig' | 'corner' | 'wreath' | 'divider';

interface Props {
  variant?: Variant;
  className?: string;
  draw?: boolean;
  style?: React.CSSProperties;
}

export function Botanical({ variant = 'sprig', className = '', draw = false, style }: Props) {
  const cls = `botanical botanical--${variant} ${draw ? 'botanical--draw' : ''} ${className}`.trim();

  if (variant === 'divider') {
    return (
      <svg className={cls} style={style} viewBox="0 0 240 24" fill="none" aria-hidden="true" focusable="false">
        <path className="b-stroke" d="M8 12h78" strokeWidth="1" />
        <path className="b-stroke" d="M154 12h78" strokeWidth="1" />
        <path className="b-stroke" d="M120 4c-6 3-9 6-9 8s3 5 9 8c6-3 9-6 9-8s-3-5-9-8Z" strokeWidth="1" />
        <path className="b-stroke" d="M120 2v20" strokeWidth="0.8" />
        <circle className="b-fill" cx="97" cy="12" r="1.6" />
        <circle className="b-fill" cx="143" cy="12" r="1.6" />
      </svg>
    );
  }

  if (variant === 'wreath') {
    return (
      <svg className={cls} style={style} viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
        <g className="b-stroke" strokeWidth="1.1">
          <path d="M100 24c-30 10-46 40-46 76s16 66 46 76" />
          <path d="M100 24c30 10 46 40 46 76s-16 66-46 76" />
          <path d="M70 60c-10 4-16 10-18 18M74 96c-12 2-20 8-24 18M78 132c-12 4-18 10-20 20" />
          <path d="M130 60c10 4 16 10 18 18M126 96c12 2 20 8 24 18M122 132c12 4 18 10 20 20" />
        </g>
        <g className="b-fill">
          <circle cx="100" cy="30" r="3" />
          <circle cx="93" cy="26" r="2.2" />
          <circle cx="107" cy="26" r="2.2" />
        </g>
      </svg>
    );
  }

  if (variant === 'corner') {
    return (
      <svg className={cls} style={style} viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
        <g className="b-stroke" strokeWidth="1.1">
          <path d="M8 8c34 6 64 24 86 54s34 62 40 96" />
          <path d="M30 22c8 0 15 4 19 12M52 34c8 1 14 6 17 14M74 52c7 2 12 8 14 16" />
          <path d="M22 40c-2 8 0 15 6 20M34 64c-3 8-1 15 4 21" />
        </g>
        <g className="b-fill">
          <circle cx="18" cy="12" r="2.6" />
          <circle cx="12" cy="20" r="2" />
          <circle cx="26" cy="10" r="1.8" />
        </g>
      </svg>
    );
  }

  return (
    <svg className={cls} style={style} viewBox="0 0 120 200" fill="none" aria-hidden="true" focusable="false">
      <g className="b-stroke" strokeWidth="1.2">
        <path d="M60 196c0-40 2-78 6-110 3-24 8-46 14-66" />
        <path d="M66 150c-14-2-26-10-32-24M64 118c14-2 26-10 30-26M62 88c-12-3-22-11-26-24M72 60c12-3 20-11 22-24" />
        <path d="M58 176c-10 0-18-4-24-12" />
      </g>
      <g className="b-stroke" strokeWidth="1">
        <circle cx="82" cy="30" r="12" />
        <path d="M82 18v24M70 30h24M73 21l18 18M91 21 73 39" />
      </g>
      <g className="b-fill">
        <circle cx="82" cy="30" r="3.2" />
        <circle cx="40" cy="118" r="2.4" />
        <circle cx="34" cy="126" r="2" />
        <circle cx="94" cy="86" r="2.2" />
      </g>
    </svg>
  );
}
