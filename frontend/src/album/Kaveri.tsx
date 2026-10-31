import React, { useRef, useState } from 'react';
import { FamilyMember } from '../types/family';
import { Family, firstName, whoLine } from './family';
import { href } from './router';
import { Face, Icon, JasmineGarland, Svg } from './ui';

/*
 * The pieces only the Kaveri look shows. Family Album shows the same people and facts its own way
 * (a photo grid, and "In their words"), so no information exists in one look only.
 */

/**
 * Tamil month (solar calendar) for a date. The months start on fixed days, give or take one day
 * from year to year, so only the month is shown, never a Tamil day number.
 */
const TAMIL_MONTHS: [month: number, day: number, en: string, ta: string][] = [
  [1, 14, 'Thai', 'தை'], [2, 13, 'Maasi', 'மாசி'], [3, 15, 'Panguni', 'பங்குனி'], [4, 14, 'Chithirai', 'சித்திரை'],
  [5, 15, 'Vaikasi', 'வைகாசி'], [6, 15, 'Aani', 'ஆனி'], [7, 17, 'Aadi', 'ஆடி'], [8, 17, 'Aavani', 'ஆவணி'],
  [9, 17, 'Purattasi', 'புரட்டாசி'], [10, 18, 'Aippasi', 'ஐப்பசி'], [11, 17, 'Karthigai', 'கார்த்திகை'], [12, 16, 'Margazhi', 'மார்கழி'],
];

export function tamilMonth(d: Date): { en: string; ta: string } {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let found = TAMIL_MONTHS[TAMIL_MONTHS.length - 1]; // early January is still Margazhi
  for (const t of TAMIL_MONTHS) if (m > t[0] || (m === t[0] && day >= t[1])) found = t;
  return { en: found[2], ta: found[3] };
}

/** "Meet your family": big cards to swipe through one by one. Arrow buttons do the same for those who don't swipe. */
export const FamilyDeck: React.FC<{ family: Family; people: FamilyMember[] }> = ({ family, people }) => {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  const onScroll = () => {
    const el = strip.current;
    if (!el || !el.firstElementChild) return;
    const step = (el.firstElementChild as HTMLElement).offsetWidth + 14;
    setAt(Math.min(people.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };
  const go = (i: number) => {
    const el = strip.current;
    const card = el?.children[Math.max(0, Math.min(people.length - 1, i))] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={strip} onScroll={onScroll} className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((m, i) => (
          <a key={m.id} href={href.person(m.id)} aria-label={`${m.fullName}, ${whoLine(family, m)}`}
            className={`no-underline text-album-leaf snap-center flex-shrink-0 w-[78%] max-w-[300px] bg-white rounded-[28px] p-2.5 pb-3.5 flex flex-col gap-2 transition-transform duration-300 ${i === at ? 'shadow-pop-lg' : 'shadow-soft scale-[0.96]'}`}>
            <Face member={m} className="w-full aspect-[4/4.4]" rounded="rounded-[21px]" />
            <span className="flex flex-col leading-tight px-1.5">
              <span className="text-[22px] font-extrabold">{m.fullName}</span>
              {m.tamilName && <span lang="ta" className="text-[15px]">{m.tamilName}</span>}
              <span className="text-[15px] text-album-terracotta font-semibold pt-0.5">{whoLine(family, m)}</span>
            </span>
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous person"
          className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center disabled:opacity-40">
          <Svg icon={Icon.back} className="w-6 h-6" stroke={2.4} />
        </button>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {people.map((m, i) => (
            <span key={m.id} className={`h-2 rounded-full transition-all ${i === at ? 'w-6 bg-album-terracotta' : 'w-2 bg-album-line'}`} />
          ))}
        </span>
        <span className="text-[15px] flex-1">Swipe to meet the next one</span>
        <button type="button" onClick={() => go(at + 1)} disabled={at === people.length - 1} aria-label="Next person"
          className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center disabled:opacity-40">
          <Svg icon={Icon.next} className="w-6 h-6" stroke={2.4} />
        </button>
      </div>
    </div>
  );
};

/**
 * A person's life in a few lines, from what the family filled in. No years: ages stay secret on this site.
 */
export const LifeStory: React.FC<{ family: Family; m: FamilyMember }> = ({ family, m }) => {
  const pronoun = m.gender === 'male' ? 'His' : m.gender === 'female' ? 'Her' : 'Their';
  const spouses = family.spouses(m);
  const children = family.children(m);
  const grandchildren = new Set(children.flatMap((c) => family.children(c).map((g) => g.id))).size;
  const born = m.birthDate ? new Date(m.birthDate + 'T00:00:00') : null;
  const month = born && !Number.isNaN(born.getTime()) ? tamilMonth(born) : null;

  const steps: { label: string; text: React.ReactNode }[] = [];
  if (m.birthPlace || month) {
    steps.push({
      label: 'Born',
      text: <>{m.birthPlace ? `in ${m.birthPlace}` : ''}{m.birthPlace && month ? ', ' : ''}{month && <>in {month.en} <span lang="ta">({month.ta})</span></>}</>,
    });
  }
  if (spouses.length) {
    steps.push({
      label: 'Married',
      text: <>{spouses.map((s, i) => <React.Fragment key={s.id}>{i > 0 && ' and '}<a href={href.person(s.id)} className="font-bold text-album-terracotta">{firstName(s)}</a></React.Fragment>)}</>,
    });
  }
  const work = [m.profession, m.business].filter(Boolean).join(' · ');
  if (work) steps.push({ label: 'Work', text: work });
  if (m.currentCity && !m.isDeceased) steps.push({ label: 'Lives in', text: m.currentCity });
  if (children.length) {
    steps.push({
      label: 'Family',
      text: `${children.length} ${children.length === 1 ? 'child' : 'children'}${grandchildren ? ` · ${grandchildren} ${grandchildren === 1 ? 'grandchild' : 'grandchildren'}` : ''}`,
    });
  }
  if (m.isDeceased) steps.push({ label: 'Remembered', text: <span className="inline-flex items-center gap-2">with love by all of us <JasmineGarland className="w-12 h-auto" /></span> });
  if (steps.length < 2) return null;

  return (
    <section aria-label={`${pronoun} life`} className="bg-white/75 rounded-[24px] p-4 shadow-soft">
      <h2 className="m-0 mb-2.5 text-lg font-extrabold">{pronoun} life</h2>
      <ol className="m-0 p-0 pl-5 list-none border-l-2 border-album-line flex flex-col gap-2.5">
        {steps.map((s) => (
          <li key={s.label} className="relative text-[17px] leading-snug">
            <span aria-hidden="true" className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-album-terracotta border-2 border-white" />
            <span className="font-extrabold mr-2">{s.label}</span>{s.text}
          </li>
        ))}
      </ol>
    </section>
  );
};
