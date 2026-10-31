import { useEffect, useState } from 'react';

/**
 * The look of the site. Only colours, fonts, corners and a few Kaveri touches change;
 * every page and feature is the same in both looks.
 *
 * Which look shows:
 * 1. the one this visitor picked with the theme switch (remembered on this phone), else
 * 2. the one the admin chose for everyone (site setting `siteTheme`), else
 * 3. Family Album.
 *
 * index.html runs the same steps before the page draws, so there is no flash of the wrong look.
 * Keep THEME_FONTS in step with the copy in index.html (and in admin/).
 */

export type ThemeId = 'album' | 'kaveri';

export const THEMES: { id: ThemeId; en: string; ta: string; swatch: string[] }[] = [
  { id: 'album', en: 'Family Album', ta: 'குடும்ப ஆல்பம்', swatch: ['#FFF1C9', '#1E4636', '#F2B705', '#B8452A'] },
  { id: 'kaveri', en: 'Kaveri', ta: 'காவேரி', swatch: ['#D9F6EF', '#0F3B45', '#F4A51C', '#0B6E77'] },
];

/** Google Fonts per look. Each look loads only its own fonts; Google serves the Tamil letters as a separate file, used only when Tamil text is on the page. */
export const THEME_FONTS: Record<ThemeId, string> = {
  album: 'https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@400;500;600;700;800&family=Kalam:wght@400;700&display=swap',
  kaveri: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap',
};

const THEME_COLOR: Record<ThemeId, string> = { album: '#1E4636', kaveri: '#0F3B45' };

const PICKED_KEY = 'kmk-admin-theme';  // the admin's own look for the admin site (the family site has its own)
const SITE_KEY = 'kmk-theme-site';     // the admin's choice, cached so the next visit starts right

export const isTheme = (v: unknown): v is ThemeId => v === 'album' || v === 'kaveri';

const read = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* private mode: the choice lasts for this visit only */ }
};

const listeners = new Set<(id: ThemeId) => void>();

export const currentTheme = (): ThemeId => {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : 'album';
};

function loadFonts(id: ThemeId) {
  const linkId = `theme-fonts-${id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = THEME_FONTS[id];
  document.head.appendChild(link);
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  loadFonts(id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[id]);
  listeners.forEach((l) => l(id));
}

/** The visitor picks a look with the theme switch. */
export function pickTheme(id: ThemeId) {
  write(PICKED_KEY, id);
  applyTheme(id);
}

/** The admin's choice for everyone arrived from the server: use it unless this visitor picked their own. */
export function useSiteTheme(siteTheme: string | undefined) {
  useEffect(() => {
    if (!isTheme(siteTheme)) return;
    write(SITE_KEY, siteTheme);
    if (!isTheme(read(PICKED_KEY))) applyTheme(siteTheme);
  }, [siteTheme]);
}

export function useTheme(): ThemeId {
  const [theme, setTheme] = useState<ThemeId>(currentTheme);
  useEffect(() => {
    listeners.add(setTheme);
    setTheme(currentTheme());
    return () => { listeners.delete(setTheme); };
  }, []);
  return theme;
}
