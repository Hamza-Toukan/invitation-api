import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  to?: string;
  href?: string;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}

export function Btn({
  variant = 'primary',
  size = 'md',
  icon,
  to,
  href,
  children,
  className = '',
  target,
  rel,
  ...rest
}: BtnProps) {
  const cls = `brand-btn brand-btn--${variant} brand-btn--${size} ${className}`.trim();
  const inner = (
    <>
      <span className="brand-btn__label">{children}</span>
      {icon && <span className="brand-btn__icon" aria-hidden="true">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <a className={cls} href={href} target={target} rel={rel}>
        {inner}
      </a>
    );
  }
  if (to) {
    return (
      <Link className={cls} to={to}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}
