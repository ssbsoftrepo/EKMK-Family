import { useEffect, useState } from 'react';
import { familyFetch } from './familyAuth';

export interface SiteSettings {
  siteUrl: string;
  homePhotoUrl: string;
  secretNote: string;
  secretPhotoUrl: string;
  /** The look everyone sees unless they pick their own: 'album' or 'kaveri'. */
  siteTheme: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const FALLBACK: SiteSettings = {
  siteUrl: '',
  homePhotoUrl: '',
  secretNote: '',
  secretPhotoUrl: '',
  siteTheme: 'album',
};

const fetchSettings = () =>
  familyFetch(`${API_BASE_URL}/api/settings`)
    .then((r) => (r.ok ? r.json() : FALLBACK))
    .then((s) => ({ ...FALLBACK, ...s }))
    .catch(() => FALLBACK);

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  useEffect(() => {
    let alive = true;
    fetchSettings().then((s) => alive && setSettings(s));
    return () => { alive = false; };
  }, []);
  return settings;
}

export const callLink = (phone?: string) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? `tel:+91${digits}` : `tel:+${digits}`;
};
