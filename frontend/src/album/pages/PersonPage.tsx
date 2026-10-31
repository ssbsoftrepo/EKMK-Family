import React from 'react';
import { FamilyMember } from '../../types/family';
import { Family, firstName, whoLine } from '../family';
import { href } from '../router';
import { Face, Hand, Icon, JasmineGarland, Print, Svg, btnSecondary } from '../ui';
import { ContactButtons } from '../../components/Common/ContactButtons';
import { useBirthdayPetals } from '../Magic';
import { birthdaysOn } from '../family';

/** One person: a big photo, who they are, their close family as photos, and Call / WhatsApp. */
export const PersonPage: React.FC<{ family: Family; id: string }> = ({ family, id }) => {
  const m = family.get(id);
  const isBirthday = !!m && birthdaysOn([m]).length > 0;
  useBirthdayPetals(isBirthday, `person-${id}`);
  if (!m) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <Hand className="text-2xl">hmm</Hand>
        <span className="text-xl font-bold">We couldn't find this person.</span>
        <a href={href.find()} className={btnSecondary}>Find a relative</a>
      </div>
    );
  }

  const g = (male: string, female: string, other: string) => (p: FamilyMember) => (p.gender === 'male' ? male : p.gender === 'female' ? female : other);
  const close: { person: FamilyMember; label: string }[] = [
    ...family.parents(m).map((p) => ({ person: p, label: g('father', 'mother', 'parent')(p) })),
    ...family.spouses(m).map((p) => ({ person: p, label: g('husband', 'wife', 'spouse')(p) })),
    ...family.siblings(m).map((p) => {
      const older = p.birthDate && m.birthDate ? p.birthDate < m.birthDate : null;
      return { person: p, label: (older === null ? '' : older ? 'elder ' : 'younger ') + g('brother', 'sister', 'sibling')(p) };
    }),
    ...family.children(m).map((p) => ({ person: p, label: g('son', 'daughter', 'child')(p) })),
  ];
  const about = m.biography || m.coupleAbout || m.notes;
  const facts = [m.currentCity && `Lives in ${m.currentCity}`, m.profession].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-5 max-w-[760px] mx-auto">
      <button type="button" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.hash = href.find()))}
        className={`${btnSecondary} self-start rounded-full min-h-[48px] pl-3`}>
        <Svg icon={Icon.back} className="w-5 h-5" stroke={2.4} /> Back
      </button>

      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-[1_1_280px] min-w-0 max-w-[420px]">
          <Print tilt={1.2} tape="terracotta">
            <Face member={m} className="w-full aspect-[4/5]" rounded="rounded-md" />
          </Print>
        </div>
        <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-3">
          <div className="flex flex-col leading-tight">
            <h1 className="m-0 text-[2.2rem] font-extrabold">{m.fullName}</h1>
            {m.tamilName && <span lang="ta" className="text-xl">{m.tamilName}</span>}
            <span className="text-lg pt-1">{whoLine(family, m)}</span>
            {facts && <span className="text-lg">{facts}</span>}
            {m.isDeceased && (
              <span className="flex items-center gap-2 text-lg pt-1">
                <JasmineGarland className="w-14 h-auto" /> In loving memory
              </span>
            )}
            {isBirthday && <span className="mt-2 self-start bg-album-turmeric rounded-full px-4 py-1 text-lg font-extrabold magic-pop">🎂 Happy birthday, {firstName(m)}!</span>}
          </div>
          {about && (
            <p className="m-0 bg-white rounded-2xl p-3.5 text-[17px] leading-relaxed">
              <span className="text-sm font-bold block">In their words</span>
              {about}
            </p>
          )}
          <a href={href.related(m.id)} className="no-underline bg-album-terracotta text-white rounded-[20px] min-h-[64px] px-4.5 py-2 px-5 flex items-center justify-between gap-2.5 shadow-[0_4px_0_#1E4636]">
            <span className="flex flex-col leading-tight">
              <span className="text-[19px] font-extrabold">How is {firstName(m)} related to me?</span>
              <span lang="ta" className="text-sm">இவர் எனக்கு என்ன உறவு?</span>
            </span>
            <Svg icon={Icon.next} className="w-6 h-6" stroke={2.4} />
          </a>
          <ContactButtons member={m} />
        </div>
      </div>

      {close.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-[1.4rem] font-extrabold">{firstName(m)}'s family</h2>
            <a href={href.family(m.id)} className="text-lg font-extrabold text-album-terracotta min-h-[44px] flex items-center">See the family ›</a>
          </div>
          <div className="grid gap-x-2 gap-y-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))' }}>
            {close.map(({ person, label }) => (
              <a key={person.id + label} href={href.person(person.id)} className="no-underline text-album-leaf flex flex-col items-center gap-1 text-center lift">
                <Face member={person} className="w-[78px] h-[78px]" rounded="rounded-full" ring="border-[3px] border-white shadow-[0_2px_6px_rgba(30,70,54,0.18)]" />
                <span className="text-base font-bold leading-tight">{firstName(person)}</span>
                <span className="text-[13px] leading-tight">{label}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
