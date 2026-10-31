import React, { useEffect, useRef, useState } from 'react';
import { FamilyMember } from '../types/family';
import { firstName } from './family';
import { petalShower, rangoliBurst, reducedMotion } from './magic';
import { Face, Hand } from './ui';

/** A kolam that draws itself while the album opens. */
export const KolamLoader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center text-center gap-3 py-16" role="status">
    <svg viewBox="0 0 120 120" className="w-32 h-32 kolam-draw" aria-hidden="true">
      <g className="fill-album-leaf">
        {[20, 40, 60, 80, 100].flatMap((x) => [20, 40, 60, 80, 100].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" className="kolam-dot" />))}
      </g>
      <g fill="none" className="stroke-album-terracotta" strokeWidth="3" strokeLinecap="round">
        <path className="kolam-line" pathLength={1} d="M60 6 C90 30 90 30 114 60 C90 90 90 90 60 114 C30 90 30 90 6 60 C30 30 30 30 60 6Z" />
        <circle className="kolam-line" pathLength={1} cx="60" cy="60" r="24" style={{ animationDelay: '0.35s' }} />
        <circle className="kolam-line" pathLength={1} cx="40" cy="40" r="13" style={{ animationDelay: '0.6s', stroke: 'rgb(var(--c-turmeric))' }} />
        <circle className="kolam-line" pathLength={1} cx="80" cy="40" r="13" style={{ animationDelay: '0.7s', stroke: 'rgb(var(--c-turmeric))' }} />
        <circle className="kolam-line" pathLength={1} cx="40" cy="80" r="13" style={{ animationDelay: '0.8s', stroke: 'rgb(var(--c-turmeric))' }} />
        <circle className="kolam-line" pathLength={1} cx="80" cy="80" r="13" style={{ animationDelay: '0.9s', stroke: 'rgb(var(--c-turmeric))' }} />
      </g>
    </svg>
    <Hand className="text-2xl">drawing the kolam…</Hand>
    <span className="text-xl font-bold">{text}</span>
  </div>
);

/** "Welcome home!" the first time someone tells the site who they are. Tap anywhere to close. */
export const WelcomeHome: React.FC<{ person: FamilyMember; onClose: () => void }> = ({ person, onClose }) => {
  useEffect(() => {
    petalShower();
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <button type="button" onClick={onClose} aria-label="Close"
      className="fixed inset-0 z-50 bg-album-leaf/80 flex items-center justify-center p-6 magic-fade-in cursor-pointer">
      <span className="bg-white rounded-[28px] p-6 pb-7 flex flex-col items-center gap-2 text-center max-w-[340px] magic-pop -rotate-1 shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
        <Face member={person} className="w-28 h-28" rounded="rounded-full" ring="border-4 border-album-turmeric" />
        <Hand className="text-2xl pt-1">vanakkam!</Hand>
        <span className="text-[1.8rem] font-extrabold leading-tight text-album-leaf">Welcome home, {firstName(person)}!</span>
        <span lang="ta" className="text-base text-album-leaf">வீட்டுக்கு வருக!</span>
        <span className="text-base text-album-leaf pt-1">Your whole family is waiting inside.</span>
      </span>
    </button>
  );
};

/**
 * Covers its children like a scratch card. Tap (or rub) to reveal, with a rangoli burst.
 * Shown open straight away when the phone asks for less motion.
 */
export const ScratchReveal: React.FC<{ label: string; children: React.ReactNode; onReveal?: () => void }> = ({ label, children, onReveal }) => {
  const [open, setOpen] = useState(() => reducedMotion());
  const box = useRef<HTMLDivElement>(null);
  const reveal = () => {
    if (open) return;
    setOpen(true);
    const r = box.current?.getBoundingClientRect();
    if (r) rangoliBurst((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
    onReveal?.();
  };
  return (
    <div ref={box} className="relative">
      <div className={open ? 'magic-reveal' : 'invisible'} aria-hidden={!open}>{children}</div>
      {!open && (
        <button type="button" onClick={reveal} onPointerMove={(e) => e.buttons === 1 && reveal()}
          className="absolute inset-0 rounded-[14px] scratch-cover flex flex-col items-center justify-center gap-1 text-album-leaf">
          <span className="text-[2.2rem]" aria-hidden="true">✨</span>
          <span className="text-xl font-extrabold">{label}</span>
          <span className="font-hand text-lg">tap to scratch</span>
        </button>
      )}
    </div>
  );
};

/** The secret family drawer, opened by tapping the KMK logo five times. */
export const SecretDrawer: React.FC<{ note: string; photoUrl: string; onClose: () => void }> = ({ note, photoUrl, onClose }) => {
  useEffect(() => {
    rangoliBurst(0.5, 0.35);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-album-leaf/70 flex items-end sm:items-center justify-center p-0 sm:p-6 magic-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="The secret family drawer" onClick={(e) => e.stopPropagation()}
        className="bg-album-paper w-full sm:max-w-[520px] max-h-[88vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] p-5 pb-7 flex flex-col gap-4 drawer-slide">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <Hand className="text-xl">shh… you found it!</Hand>
            <span className="text-[1.7rem] font-extrabold text-album-leaf">The secret family drawer</span>
          </div>
          <button type="button" onClick={onClose} className="min-h-[48px] px-4 rounded-2xl border-2 border-album-leaf bg-white font-bold text-album-leaf">Close</button>
        </div>
        {photoUrl && (
          <figure className="m-0 bg-white p-2.5 rounded-[10px] shadow-[0_10px_24px_rgb(var(--c-leaf)/0.2)] rotate-1">
            <img src={photoUrl} alt="From the family archive" className="w-full rounded-md" />
          </figure>
        )}
        <p className="m-0 text-[18px] leading-relaxed text-album-leaf whitespace-pre-line bg-white rounded-2xl p-4">
          {note || 'This drawer is empty for now. The family admin can tuck an old photo, Paati’s recipe or a story from the elders in here.'}
        </p>
        <Hand className="text-lg text-center">tell your cousins how to find it… or don’t!</Hand>
      </div>
    </div>
  );
};

/** Plays the birthday petals once per visit when it's this person's birthday. */
export function useBirthdayPetals(isBirthday: boolean, key: string) {
  useEffect(() => {
    if (!isBirthday) return;
    const k = `kmk-magic-bday-${key}`;
    const seen = () => { try { return !!window.sessionStorage.getItem(k); } catch { return false; } };
    if (seen()) return;
    // Marked as shown only when the petals actually play, so a quick re-render can't swallow them.
    const t = setTimeout(() => {
      if (seen()) return;
      try { window.sessionStorage.setItem(k, '1'); } catch { /* storage blocked: still play */ }
      petalShower();
    }, 350);
    return () => clearTimeout(t);
  }, [isBirthday, key]);
}
