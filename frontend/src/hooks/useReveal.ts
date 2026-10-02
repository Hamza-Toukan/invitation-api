import { useRef, useEffect } from 'react';

export function useReveal(options: { group?: boolean; threshold?: number } = {}) {
  const { group = false, threshold = 0.15 } = options;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const getTargets = () => (group ? Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]')) : [el]);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const markVisible = () => getTargets().forEach(t => t.classList.add('is-visible'));

    if (reduced || !('IntersectionObserver' in window)) {
      markVisible();
      return;
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    const observe = () =>
      getTargets().forEach(t => {
        if (!t.classList.contains('is-visible')) io.observe(t);
      });

    observe();

    let mo: MutationObserver | undefined;
    if (group) {
      mo = new MutationObserver(muts => {
        if (
          muts.some(m =>
            Array.from(m.addedNodes).some(
              n => n instanceof Element && (n.matches('[data-reveal]') || n.querySelector('[data-reveal]'))
            )
          )
        ) {
          observe();
        }
      });
      mo.observe(el, { childList: true, subtree: true });
    }

    return () => {
      io.disconnect();
      mo?.disconnect();
    };
  }, [group, threshold]);

  return ref;
}
