import { useEffect, useState } from 'react';

/**
 * The look of the site: Family Album theme with Plus Jakarta Sans and Noto Sans Tamil typography.
 */

export type ThemeId = 'album';

export const THEMES: { id: ThemeId; en: string; ta: string; swatch: string[] }[] = [
  { id: 'album', en: 'Family Album', ta: 'குடும்ப ஆல்பம்', swatch: ['#FFF1C9', '#1E4636', '#F2B705', '#B8452A'] },
];

export const THEME_FONTS: Record<ThemeId, string> = {
  album: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap',
};

const THEME_COLOR: Record<ThemeId, string> = { album: '#1E4636' };

const PICKED_KEY = 'kmk-theme';
const SITE_KEY = 'kmk-theme-site';

export const isTheme = (v: unknown): v is ThemeId => v === 'album';

const read = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* private mode */ }
};

const listeners = new Set<(id: ThemeId) => void>();

export const currentTheme = (): ThemeId => 'album';

function loadFonts(id: ThemeId = 'album') {
  const linkId = `theme-fonts-${id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = THEME_FONTS[id];
  document.head.appendChild(link);
}

export function applyTheme(_id: ThemeId = 'album') {
  document.documentElement.dataset.theme = 'album';
  loadFonts('album');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR.album);
  listeners.forEach((l) => l('album'));
}

export function pickTheme(_id: ThemeId) {
  write(PICKED_KEY, 'album');
  applyTheme('album');
}

export function useSiteTheme(_siteTheme?: string) {
  useEffect(() => {
    // If a visitor previously had kaveri stored, reset it to album
    if (read(PICKED_KEY) && read(PICKED_KEY) !== 'album') {
      write(PICKED_KEY, 'album');
    }
    write(SITE_KEY, 'album');
    applyTheme('album');
  }, []);
}

export function useTheme(): ThemeId {
  const [theme, setTheme] = useState<ThemeId>('album');
  useEffect(() => {
    listeners.add(setTheme);
    setTheme('album');
    return () => { listeners.delete(setTheme); };
  }, []);
  return theme;
}
