import React, { useRef, useState, useEffect, useMemo } from 'react';

interface Props {
  text: string;
  as?: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TypingTitle({ text, as = 'h2', speed = 55, className = '', style, ...rest }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const chars = useMemo(() => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const seg = new (Intl as unknown as { Segmenter: new (loc: undefined, opt: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(text), s => s.segment);
    }
    return Array.from(text);
  }, [text]);

  const done = started && count >= chars.length;

  useEffect(() => {
    setCount(0);
    setStarted(false);
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setStarted(true);
      setCount(chars.length);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setStarted(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [chars.length]);

  useEffect(() => {
    if (!started || count >= chars.length) return;
    const t = window.setTimeout(() => setCount(c => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, count, chars.length, speed]);

  const displayed = chars.slice(0, count).join('');

  return React.createElement(
    as,
    {
      ref,
      className: `typing ${className}`.trim(),
      'data-typing-done': done ? '' : undefined,
      'aria-label': done ? undefined : text,
      style,
      ...rest,
    },
    done
      ? text
      : (
        <>
          <span className="typing__sizer" aria-hidden="true">{text}</span>
          <span className="typing__reveal" aria-hidden="true">
            {displayed}
            {started && <span className="typing__cursor" aria-hidden="true" />}
          </span>
        </>
      )
  );
}
