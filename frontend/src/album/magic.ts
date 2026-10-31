import confetti from 'canvas-confetti';

/**
 * Small surprises for the family website. Every effect is short, never blocks a tap,
 * and is skipped when the phone asks for less motion.
 */

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** True the first time in this visit (per key); big moments stay special. */
export function oncePerVisit(key: string): boolean {
  try {
    const k = `kmk-magic-${key}`;
    if (window.sessionStorage.getItem(k)) return false;
    window.sessionStorage.setItem(k, '1');
    return true;
  } catch {
    return true;
  }
}

/** True the first time ever on this phone (per key). */
export function onceOnThisPhone(key: string): boolean {
  try {
    const k = `kmk-magic-${key}`;
    if (window.localStorage.getItem(k)) return false;
    window.localStorage.setItem(k, '1');
    return true;
  } catch {
    return true;
  }
}

const MARIGOLD = ['#F2B705', '#F6A21B', '#E8790C', '#C4502F', '#FFD54A'];

let flowerShapes: confetti.Shape[] | null = null;
const flowers = () => {
  if (!flowerShapes) {
    try {
      flowerShapes = [confetti.shapeFromText({ text: '🌼', scalar: 2 }), confetti.shapeFromText({ text: '🎈', scalar: 2.2 })];
    } catch {
      flowerShapes = [];
    }
  }
  return flowerShapes;
};

/** A shower of marigold petals with a few flowers and balloons, for birthdays. */
export function petalShower() {
  if (reducedMotion()) return;
  const end = Date.now() + 1400;
  const shapes = flowers();
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: MARIGOLD, shapes: ['circle'], scalar: 1.1, ticks: 220, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: MARIGOLD, shapes: ['circle'], scalar: 1.1, ticks: 220, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  if (shapes.length) {
    confetti({ particleCount: 14, spread: 100, startVelocity: 30, origin: { y: 0.6 }, shapes, scalar: 2, ticks: 260, flat: true, disableForReducedMotion: true });
  }
}

/** A round rangoli-coloured burst from one point (x, y between 0 and 1). */
export function rangoliBurst(x = 0.5, y = 0.45) {
  if (reducedMotion()) return;
  const colors = ['#C4502F', '#F2B705', '#5C8A4A', '#E0457B', '#1E4636'];
  [0, 1, 2].forEach((ring) =>
    setTimeout(() => confetti({
      particleCount: 36, spread: 360, startVelocity: 14 + ring * 7, gravity: 0.6, decay: 0.9, ticks: 120,
      origin: { x, y }, colors, shapes: ['circle'], scalar: 0.9, disableForReducedMotion: true,
    }), ring * 140),
  );
}

/** Centre of an element as a confetti origin. */
export function originOf(el: Element | null): { x: number; y: number } {
  if (!el) return { x: 0.5, y: 0.45 };
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
}
