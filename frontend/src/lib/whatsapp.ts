import { useEffect, useState } from 'react';

/**
 * WhatsApp without any setup: https://wa.me links open WhatsApp on the visitor's
 * own phone with the message already typed. Nothing is sent by the website.
 * The messages are edited by the admin (admin site → Share the link).
 */

export interface SiteSettings {
  siteUrl: string;
  homePhotoUrl: string;
  secretNote: string;
  secretPhotoUrl: string;
  whatsappBirthday: string;
  whatsappHello: string;
  whatsappShare: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const FALLBACK: SiteSettings = {
  siteUrl: '',
  homePhotoUrl: '',
  secretNote: '',
  secretPhotoUrl: '',
  whatsappBirthday: 'Happy birthday {name}! Wishing you a wonderful year ahead. With love, from the KMK family',
  whatsappHello: 'Hi {name}, I found you on our KMK family website! {site}',
  whatsappShare: 'Hello everyone! Our KMK family website is ready. Find yourself on the family tree: {site}',
};

let cached: Promise<SiteSettings> | null = null;

const loadSettings = () => {
  if (!cached) {
    cached = fetch(`${API_BASE_URL}/api/settings`)
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .then((s) => ({ ...FALLBACK, ...s }))
      .catch(() => FALLBACK);
  }
  return cached;
};

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => alive && setSettings(s));
    return () => { alive = false; };
  }, []);
  return settings;
}

export const fillMessage = (template: string, name: string, settings: SiteSettings) =>
  template
    .split('{name}').join(name)
    .split('{site}').join(settings.siteUrl || window.location.origin)
    .trim();

/** Digits WhatsApp understands: Indian 10-digit numbers get the 91 country code. */
export const whatsappNumber = (phone?: string) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
};

export const whatsappLink = (phone: string | undefined, text: string) => {
  const n = whatsappNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
};

export const callLink = (phone?: string) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? `tel:+91${digits}` : `tel:+${digits}`;
};
