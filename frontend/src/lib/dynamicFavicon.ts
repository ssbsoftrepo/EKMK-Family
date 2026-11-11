import { useEffect } from 'react';

/**
 * Dynamically updates the browser favicon to a circular avatar of the family photo.
 * When a photo is provided, it crops the center into a circle, decorates with a turmeric ring,
 * and updates <link rel="icon"> and <link rel="apple-touch-icon">.
 * Falls back to /favicon.svg if no photo is available or if clearing.
 */
export function setDynamicFavicon(photoUrl?: string) {
  if (typeof document === 'undefined') return;

  const ensureLink = (rel: string): HTMLLinkElement => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel~='${rel}']`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    return link;
  };

  if (!photoUrl) {
    const iconLink = ensureLink('icon');
    iconLink.type = 'image/svg+xml';
    iconLink.href = '/favicon.svg';
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    try {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      ctx.clearRect(0, 0, size, size);

      // Outer gold/turmeric badge ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#E8A338';
      ctx.fill();

      // Inner white boundary
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Clip circle for image
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image with cover aspect ratio
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const minSide = Math.min(w, h);
      const sx = (w - minSide) / 2;
      const sy = (h - minSide) / 2;
      const drawSize = size - 8;
      ctx.drawImage(img, sx, sy, minSide, minSide, 4, 4, drawSize, drawSize);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      const icon = ensureLink('icon');
      icon.type = 'image/png';
      icon.href = dataUrl;

      const appleIcon = ensureLink('apple-touch-icon');
      appleIcon.href = dataUrl;
    } catch {
      // If canvas export is tainted by CORS, fallback to direct URL
      const icon = ensureLink('icon');
      icon.type = 'image/jpeg';
      icon.href = photoUrl;
    }
  };

  img.onerror = () => {
    const icon = ensureLink('icon');
    icon.href = photoUrl;
  };

  img.src = photoUrl;
}

/** React hook that synchronizes the dynamic favicon with the current photo */
export function useDynamicFavicon(photoUrl?: string) {
  useEffect(() => {
    setDynamicFavicon(photoUrl);
  }, [photoUrl]);
}

