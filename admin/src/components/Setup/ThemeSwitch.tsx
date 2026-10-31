import React, { useEffect, useRef, useState } from 'react';
import { pickTheme, THEMES, useTheme } from '../../lib/theme';

/** A small "Look" button in the admin header: shows both looks with their colours, one tap to change. Only changes the admin site on this computer. */
export const ThemeSwitch: React.FC<{ night?: boolean }> = ({ night = false }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
        className={`min-h-[48px] pl-2 pr-3 rounded-full flex items-center gap-2 text-[15px] font-bold border-2 ${night ? 'border-white/40 text-white' : 'border-album-line bg-white/70 text-album-leaf'}`}>
        <Swatch colours={current.swatch} />
        <span className="flex flex-col items-start leading-none">
          <span>Look</span>
          <span lang="ta" className="text-[11px] font-semibold opacity-80">தோற்றம்</span>
        </span>
      </button>
      {open && (
        <div role="group" aria-label="Choose the look of the website"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[250px] bg-white rounded-[22px] p-2 flex flex-col gap-1.5 shadow-pop-lg border-2 border-album-line magic-pop text-album-leaf">
          {THEMES.map((t) => {
            const on = t.id === theme;
            return (
              <button key={t.id} type="button" aria-pressed={on} onClick={() => { pickTheme(t.id); setOpen(false); }}
                className={`min-h-[60px] px-3 rounded-2xl flex items-center gap-3 text-left ${on ? 'bg-album-paper ring-2 ring-album-terracotta' : 'hover:bg-album-paper/60'}`}>
                <Swatch colours={t.swatch} big />
                <span className="flex flex-col leading-tight flex-1">
                  <span className="text-[17px] font-extrabold">{t.en}</span>
                  <span lang="ta" className="text-sm">{t.ta}</span>
                </span>
                {on && <span aria-hidden="true" className="text-album-terracotta text-xl font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Swatch: React.FC<{ colours: string[]; big?: boolean }> = ({ colours, big = false }) => (
  <span aria-hidden="true" className={`${big ? 'w-11 h-11' : 'w-8 h-8'} rounded-full overflow-hidden grid grid-cols-2 border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex-shrink-0`}>
    {colours.map((c) => <span key={c} style={{ background: c }} />)}
  </span>
);
