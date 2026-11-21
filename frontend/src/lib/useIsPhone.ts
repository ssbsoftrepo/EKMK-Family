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
