import React from 'react';
import { FamilyMember } from '../types/family';

/** Shared pieces of the "family album" look. Text sizes start at 15px and tap targets at 44px. */

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[56px] px-6 rounded-2xl bg-album-terracotta text-white font-extrabold text-lg no-underline shadow-pop active:translate-y-[2px] active:shadow-pop-pressed transition';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl border-2 border-album-leaf bg-white text-album-leaf font-bold text-[17px] no-underline hover:bg-album-paper transition';
export const btnDark =
  'inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl bg-album-leaf text-white font-extrabold text-[17px] no-underline hover:brightness-110 transition';

const tones = ['rgb(var(--c-sage))', 'rgb(var(--c-blush))', 'rgb(var(--c-sun))', 'rgb(var(--c-peach))'];
export const toneFor = (id: string) => tones[Array.from(id).reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];

/** A person's photo, or a friendly coloured silhouette while there is none. */
export const Face: React.FC<{ member: FamilyMember; className?: string; rounded?: string; ring?: string }> = ({
  member, className = 'w-14 h-14', rounded = 'rounded-2xl', ring = '',
}) => (
  <span className={`${className} ${rounded} ${ring} overflow-hidden flex-shrink-0 flex items-end justify-center relative`} style={{ background: toneFor(member.id) }}>
    {member.photoUrl ? (
      <img src={member.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    ) : (
      <svg aria-hidden="true" viewBox="0 0 100 100" className="w-[85%] h-[85%]">
        <g fill="#FFFFFF" fillOpacity="0.65">
          <circle cx="50" cy="38" r="18" />
          <path d="M14 100c4-24 18-36 36-36s32 12 36 36z" />
        </g>
      </svg>
    )}
    {member.isDeceased && (
      <span role="img" aria-label="in loving memory" className="absolute inset-x-0 top-0 pointer-events-none">
        <JasmineGarland className="w-full h-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
      </span>
    )}
  </span>
);

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

/** A printed photo: white border, a strip of tape, slightly tilted (in Kaveri: a floating rounded card, see themes.css). */
export const Print: React.FC<{ children: React.ReactNode; tilt?: number; tape?: 'turmeric' | 'terracotta' | 'none'; className?: string }> = ({
  children, tilt = -1.2, tape = 'turmeric', className = '',
}) => (
  <figure className={`print relative m-0 bg-white p-2.5 pb-3 rounded-[10px] shadow-[0_10px_24px_rgb(var(--c-leaf)/0.18)] ${className}`} style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}>
    {tape !== 'none' && (
      <span aria-hidden="true" className="print-tape absolute left-1/2 -top-3 -ml-12 w-24 h-7 rotate-3"
        style={{ background: tape === 'turmeric' ? 'rgba(242,183,5,0.75)' : 'rgba(196,80,47,0.55)' }} />
    )}
    {children}
  </figure>
);

export const Hand: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`font-hand text-album-terracotta leading-tight ${className}`}>{children}</span>
);

/** English heading with its Tamil line underneath. */
export const Title: React.FC<{ en: string; ta?: string; note?: string; as?: 'h1' | 'h2'; size?: string }> = ({ en, ta, note, as = 'h1', size }) => {
  const H = as;
  return (
    <div className="flex flex-col leading-tight">
      {note && <Hand className="text-xl">{note}</Hand>}
      <H className={`m-0 font-extrabold ${size ?? (as === 'h1' ? 'text-[1.9rem] sm:text-[2.4rem]' : 'text-[1.4rem] sm:text-[1.6rem]')}`}>{en}</H>
      {ta && <span lang="ta" className="text-base">{ta}</span>}
    </div>
  );
};

export const Icon = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  tree: <><circle cx="12" cy="8" r="5" /><path d="M12 13v8M8 21h8M12 16l-3-2M12 15l3-2" /></>,
  link: <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M9.5 9.5l5 5" strokeDasharray="2 2.5" /></>,
  cake: <><path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" /><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 2.7 1 4 0" /><path d="M12 11V7" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  chat: <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  swap: <path d="M4 8h14l-4-4M20 16H6l4 4" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
};

export const Svg: React.FC<{ icon: React.ReactNode; className?: string; stroke?: number }> = ({ icon, className = 'w-6 h-6', stroke = 2.2 }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {icon}
  </svg>
);

/** A photo tile used in grids: photo, name, one line under it. */
export const PersonTile: React.FC<{ member: FamilyMember; line?: string; href: string }> = ({ member, line, href }) => (
  <a href={href} className="no-underline text-album-leaf bg-white rounded-[18px] p-1.5 pb-2.5 flex flex-col gap-1 shadow-soft hover:shadow-pop-sm lift">
    <Face member={member} className="w-full aspect-square" rounded="rounded-[13px]" />
    <span className="text-[17px] font-extrabold leading-tight px-1">{member.fullName}</span>
    {line && <span className="text-sm leading-tight px-1">{line}</span>}
  </a>
);
