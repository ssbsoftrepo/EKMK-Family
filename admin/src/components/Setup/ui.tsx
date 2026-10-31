import React from 'react';
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
const toneFor = (id: string) => tones[Array.from(id).reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];

/** A person's photo, or a friendly coloured silhouette when there is none yet. */
export const Face: React.FC<{ member: FamilyMember; className?: string; rounded?: string }> = ({ member, className = 'w-14 h-14', rounded = 'rounded-2xl' }) => (
  <span className={`${className} ${rounded} overflow-hidden flex-shrink-0 flex items-end justify-center`} style={{ background: toneFor(member.id) }}>
    {member.photoUrl ? (
      <img src={member.photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <svg aria-hidden="true" viewBox="0 0 100 100" className="w-[85%] h-[85%]">
        <g fill="#FFFFFF" fillOpacity="0.65">
          <circle cx="50" cy="38" r="18" />
          <path d="M14 100c4-24 18-36 36-36s32 12 36 36z" />
        </g>
      </svg>
    )}
  </span>
);

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
