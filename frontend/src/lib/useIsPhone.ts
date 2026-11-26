import { useEffect, useState } from 'react';

/**
 * Phone layout: screens narrower than 768px, where the site shows the bottom menu
 * (Tailwind's `md` breakpoint). Phone-only changes use `max-md:` classes; this hook is
 * for the few that CSS can't switch (like an input's placeholder text).
 */
const QUERY = '(max-width: 767.98px)';

export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return phone;
}

/** Column count matching the album's `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` grid. */
export function useGridCols(): number {
  const getCols = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return 5;
    if (window.matchMedia('(min-width: 768px)').matches) return 5;
    if (window.matchMedia('(min-width: 640px)').matches) return 3;
    return 2;
  };
  const [cols, setCols] = useState(getCols);
  useEffect(() => {
    const md = window.matchMedia?.('(min-width: 768px)');
    const sm = window.matchMedia?.('(min-width: 640px)');
    if (!md || !sm) return;
    const update = () => setCols(getCols());
    update();
    md.addEventListener('change', update);
    sm.addEventListener('change', update);
    return () => {
      md.removeEventListener('change', update);
      sm.removeEventListener('change', update);
    };
  }, []);
  return cols;
}
