import React, { useEffect, useRef, useState } from 'react';
import { FamilyMember } from '../../types/family';

/** Shared look for the 3-step setup ("family album": leaf green, turmeric, terracotta). */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[56px] px-6 rounded-2xl bg-album-terracotta text-white font-album font-extrabold text-lg shadow-pop hover:brightness-105 active:translate-y-[2px] active:shadow-pop-pressed disabled:opacity-50 disabled:pointer-events-none transition';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl border-2 border-album-leaf bg-white text-album-leaf font-album font-bold text-base hover:bg-album-paper disabled:opacity-50 disabled:pointer-events-none transition';
export const btnDark =
  'inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl bg-album-leaf text-white font-album font-extrabold text-base hover:brightness-110 disabled:opacity-50 transition';
export const card = 'bg-white rounded-[24px] p-5 sm:p-6';

const tones = ['rgb(var(--c-sage))', 'rgb(var(--c-blush))', 'rgb(var(--c-sun))', 'rgb(var(--c-peach))'];
const toneFor = (id?: string) => tones[Array.from(id || '').reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];

/*
 * A jasmine garland (malli poo), as draped over the photo of an elder who has passed away,
 * with a few orange kanakambaram flowers. Buds are placed along one drooping curve.
 */
const GARLAND_BUDS = Array.from({ length: 23 }, (_, i) => {
  const t = i / 22;
  const x = (1 - t) ** 2 * 3 + 2 * (1 - t) * t * 50 + t ** 2 * 97;
  const y = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 50 + t ** 2 * 4;
  return { x, y, orange: i % 6 === 3 };
});

export const JasmineGarland: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg viewBox="0 0 100 34" className={className} aria-hidden="true">
    <path d="M3 4 Q50 50 97 4" fill="none" stroke="#5C8A4A" strokeWidth="1.2" />
    {GARLAND_BUDS.map((b, i) => (
      <g key={i}>
        {i % 4 === 0 && <ellipse cx={b.x + 2.2} cy={b.y + 1.2} rx="2.2" ry="1" fill="#5C8A4A" transform={`rotate(30 ${b.x + 2.2} ${b.y + 1.2})`} />}
        <circle cx={b.x} cy={b.y} r={b.orange ? 3 : 3.3} fill={b.orange ? '#F28C28' : '#FFFFFF'} stroke={b.orange ? '#C4502F' : '#D8D2C2'} strokeWidth="0.6" />
        {!b.orange && <circle cx={b.x - 0.9} cy={b.y - 0.9} r="0.9" fill="#F3F7EC" />}
      </g>
    ))}
    <circle cx="50" cy="29.5" r="3.6" fill="#F28C28" stroke="#C4502F" strokeWidth="0.6" />
  </svg>
);

/** A person's photo, or a friendly coloured silhouette when there is none yet. */
export const Face: React.FC<{ member: FamilyMember; className?: string; rounded?: string }> = ({ member, className = 'w-14 h-14', rounded = 'rounded-2xl' }) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
    const img = imgRef.current;
    setLoaded(!!(img && img.complete && img.naturalWidth > 0));
  }, [member.photoUrl]);

  const showImg = !!member.photoUrl && !errored;

  return (
    <span className={`${className} ${rounded} overflow-hidden flex-shrink-0 flex items-end justify-center relative`} style={{ background: toneFor(member.id) }}>
      {showImg ? (
        <>
          {!loaded && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-white/25 animate-pulse">
              <span className="w-5 h-5 rounded-full border-2 border-album-leaf/25 border-t-album-leaf/75 animate-spin" />
            </span>
          )}
          <img
            ref={imgRef}
            src={member.photoUrl}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`w-full h-full object-cover transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 100 100" className="w-[85%] h-[85%]">
          <g fill="#FFFFFF" fillOpacity="0.65">
            <circle cx="50" cy="38" r="18" />
            <path d="M14 100c4-24 18-36 36-36s32 12 36 36z" />
          </g>
        </svg>
      )}
      {member.isDeceased && (
        <span
          role="img"
          aria-label="in loving memory"
          className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-black/35 via-black/5 to-transparent pt-2.5 pb-0.5"
        >
          <JasmineGarland className="w-full h-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
        </span>
      )}
    </span>
  );
};

export const Check: React.FC<{ className?: string; color?: string }> = ({ className = 'w-6 h-6', color = 'currentColor' }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const StepTitle: React.FC<{ step: string; title: string; children?: React.ReactNode }> = ({ step, title, children }) => (
  <div className="flex flex-col gap-1">
    <span className="font-hand text-[22px] leading-none text-album-terracotta">{step}</span>
    <h1 className="font-album font-extrabold text-[2.25rem] sm:text-[2.5rem] leading-[1.05] text-album-leaf" style={{ letterSpacing: 0 }}>{title}</h1>
    {children && <p className="font-album text-lg leading-relaxed text-album-leaf max-w-[680px]">{children}</p>}
  </div>
);
