import React, { useMemo, useRef, useState } from 'react';
import { FamilyMember } from '../types/family';
import { Family, firstName, placedIds, whoLine } from './family';
import { relate } from './kinship';
import { rangoliBurst, originOf } from './magic';
import { href, rememberMe } from './router';
import { Face, Hand, Print, btnPrimary, btnSecondary } from './ui';

/**
 * "Surprise me": introduces a random relative. When this phone knows who you are
 * (from "How are we related?"), it says how they are related to you.
 */
export const SurpriseMe: React.FC<{ family: Family; compact?: boolean }> = ({ family, compact = false }) => {
  const [pick, setPick] = useState<FamilyMember | null>(null);
  const recent = useRef<string[]>([]);
  const button = useRef<HTMLButtonElement>(null);
  const meId = rememberMe.get();
  const me = family.get(meId);

  const pool = useMemo(() => {
    const placed = placedIds(family.members);
    const onTree = family.members.filter((m) => placed.has(m.id));
    return (onTree.length ? onTree : family.members).filter((m) => !m.isDeceased && m.id !== meId);
  }, [family, meId]);

  const surprise = () => {
    if (pool.length === 0) return;
    // Don't show the same few people again and again.
    const fresh = pool.filter((m) => !recent.current.includes(m.id));
    const from = fresh.length ? fresh : pool;
    const next = from[Math.floor(Math.random() * from.length)];
    recent.current = [next.id, ...recent.current].slice(0, Math.min(5, Math.max(0, pool.length - 1)));
    setPick(next);
    const o = originOf(button.current);
    rangoliBurst(o.x, o.y);
  };

  const r = pick && me ? relate(family, me, pick) : null;
  const term = r?.term?.split(' / ')[0];
  // Close family (parents, children, husband or wife, brothers and sisters) are greeted, not "met".
  const close = !!r && r.path.length <= 3 && !/^(Thatha|Paati|Peran|Pethi)$/.test(term ?? '');
  const headline = !pick ? '' : term ? (close ? `Say hello to your ${term}, ${firstName(pick)}!` : `Have you met your ${term}, ${firstName(pick)}?`) : `Have you met ${firstName(pick)}?`;
  const detail = !pick ? '' : r && r.path.length > 1 ? r.description : [whoLine(family, pick), pick.currentCity && `lives in ${pick.currentCity}`].filter(Boolean).join(' · ');

  if (pool.length === 0) return null;

  return (
    <section aria-label="Surprise me" className="flex flex-col gap-3">
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-[1.4rem] sm:text-[1.6rem] font-extrabold">Not sure where to start?</span>
          <span lang="ta" className="text-base">எங்கே தொடங்குவது?</span>
        </div>
      )}
      <button ref={button} type="button" onClick={surprise} className={`${pick ? btnSecondary : btnPrimary} self-start`}>
        <span aria-hidden="true">🎁</span> {pick ? 'Surprise me again' : 'Surprise me'}
      </button>
      {pick && (
        <div key={pick.id} className="magic-pop max-w-[560px]" aria-live="polite">
          <Print tilt={-1} tape="turmeric">
            <div className="flex flex-wrap items-center gap-4 p-1.5">
              <Face member={pick} className="w-28 h-28" rounded="rounded-2xl" />
              <div className="flex-[1_1_200px] min-w-0 flex flex-col gap-1">
                <span className="text-[1.35rem] font-extrabold leading-tight">{headline}</span>
                {term && r?.tamil && <span lang="ta" className="text-lg font-bold text-album-terracotta">{r.tamil}</span>}
                {detail && <span className="text-base">{detail}</span>}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <a href={href.person(pick.id)} className={`${btnPrimary} min-h-[48px] text-base`}>Say hello</a>
                  {!me && <a href={href.related(pick.id)} className={`${btnSecondary} min-h-[48px] text-base`}>How are we related?</a>}
                </div>
              </div>
            </div>
          </Print>
          {!me && <Hand className="text-base block pt-2">tip: tell the site who you are in “Related?” and it will say how you’re related</Hand>}
        </div>
      )}
    </section>
  );
};
