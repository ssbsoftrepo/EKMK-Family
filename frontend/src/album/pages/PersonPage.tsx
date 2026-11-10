import React, { useEffect, useState } from 'react';
import { FamilyMember } from '../../types/family';
import { Family, byAge, firstName, formatDateDMY, whoLine } from '../family';
import { href } from '../router';
import { Face, Hand, Icon, JasmineGarland, PersonTile, Print, Svg, btnSecondary } from '../ui';
import { ContactButtons } from '../../components/Common/ContactButtons';
import { useBirthdayPetals } from '../Magic';
import { birthdaysOn } from '../family';

/** Dynamic font sizing and styling to ensure long names and long words fit without separating letters */
const getDynamicNameStyle = (name: string): React.CSSProperties => {
  const clean = (name || '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const maxWord = Math.max(...words.map((w) => w.length), 0);
  const total = clean.length;

  let scale = 1.0;
  if (maxWord >= 18 || total >= 30) {
    scale = 0.72; // ~11.5px - 13px
  } else if (maxWord >= 15 || total >= 25) {
    scale = 0.8; // ~13px - 14.4px (e.g. Shanmugasundaram = 16 chars)
  } else if (maxWord >= 12 || total >= 19) {
    scale = 0.88; // ~14px - 16px
  } else if (maxWord >= 9 || total >= 14) {
    scale = 0.95; // ~15px - 17px
  }

  const minRem = Math.round(1.0 * scale * 100) / 100; // ~16px * scale
  const maxRem = Math.round(1.125 * scale * 100) / 100; // ~18px * scale

  return {
    fontSize: `clamp(${minRem}rem, 2.2vw, ${maxRem}rem)`,
    lineHeight: 1.25,
    wordBreak: 'normal',
    overflowWrap: 'normal',
    whiteSpace: 'normal',
  };
};

/** One person: photo and name on main page; click photo to turn card and reveal details & kinship button. */
export const PersonPage: React.FC<{ family: Family; id: string }> = ({ family, id }) => {
  const m = family.get(id);
  const [turnedMember, setTurnedMember] = useState<FamilyMember | null>(null);

  const isBirthday = !!m && birthdaysOn([m]).length > 0;
  useBirthdayPetals(isBirthday, `person-${id}`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTurnedMember(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!m) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <Hand className="text-2xl">hmm</Hand>
        <span className="text-xl font-bold">We couldn't find this person.</span>
        <a href={href.find()} className={btnSecondary}>Find a relative</a>
      </div>
    );
  }

  const spouses = family.spouses(m);
  const children = byAge(family.children(m));

  return (
    <div className="flex flex-col gap-6 max-w-[760px] mx-auto">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.hash = href.find()))}
        className={`${btnSecondary} self-start rounded-full min-h-[42px] px-4 py-1.5`}
      >
        <Svg icon={Icon.back} className="w-4 h-4" stroke={2.4} /> Back
      </button>

      {/* Main photo row: Center aligned, only photo and name are displayed */}
      <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-8 pt-1">
        {/* Person Photo Card */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setTurnedMember(m)}
            className="w-[150px] sm:w-[175px] flex flex-col gap-2 text-center group cursor-pointer focus:outline-none bg-transparent border-0 p-0 lift"
            title="Click photo to view details"
          >
            <div className="relative w-full">
              <Print tilt={0} tape="none">
                <Face member={m} className="w-full aspect-[4/5] group-hover:brightness-95 transition" rounded="rounded-md" />
              </Print>
            </div>
            <div className="flex flex-col items-center text-center leading-tight w-full">
              <span
                style={getDynamicNameStyle(m.fullName)}
                className="font-extrabold text-album-leaf group-hover:text-album-terracotta transition max-w-full text-center break-normal"
              >
                {m.fullName}
              </span>
              {m.tamilName && m.tamilName.trim() !== m.fullName.trim() && (
                <span lang="ta" className="text-xs text-album-leaf/75 pt-0.5 break-normal">{m.tamilName}</span>
              )}
            </div>
          </button>
        </div>

        {/* Spouse photo right next to person's photo */}
        {spouses.map((s) => (
          <div key={s.id} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setTurnedMember(s)}
              className="w-[150px] sm:w-[175px] flex flex-col gap-2 text-center group cursor-pointer focus:outline-none bg-transparent border-0 p-0 lift"
              title="Click photo to view details"
            >
              <div className="relative w-full">
                <Print tilt={0} tape="none">
                  <Face member={s} className="w-full aspect-[4/5] group-hover:brightness-95 transition" rounded="rounded-md" />
                </Print>
              </div>
              <div className="flex flex-col items-center text-center leading-tight w-full">
                <span
                  style={getDynamicNameStyle(s.fullName)}
                  className="font-extrabold text-album-leaf group-hover:text-album-terracotta transition max-w-full text-center break-normal"
                >
                  {s.fullName}
                </span>
                <span className="text-[12px] font-semibold text-album-leaf/70 pt-0.5 break-normal">
                  {s.gender === 'female' ? 'Wife · மனைவி' : s.gender === 'male' ? 'Husband · கணவர்' : 'Spouse · துணைவர்'}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Children only, displayed below */}
      {children.length > 0 && (
        <section className="flex flex-col gap-3 pt-5 border-t border-album-line/60">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-lg sm:text-xl font-extrabold text-album-leaf">
              Children <span className="text-sm font-semibold text-album-leaf/70">({children.length})</span>
            </h2>
            <span lang="ta" className="text-xs font-semibold text-album-leaf/70">
              பிள்ளைகள்
            </span>
          </div>
          <div
            className="grid gap-3.5 sm:gap-5 md:gap-6 lg:gap-8 items-stretch justify-center w-full mx-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 165px))',
              maxWidth: '1000px',
            }}
          >
            {children.map((c) => (
              <PersonTile
                key={c.id}
                member={c}
                href={href.person(c.id)}
                line={c.gender === 'female' ? 'Daughter · மகள்' : c.gender === 'male' ? 'Son · மகன்' : 'Child · பிள்ளை'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Turned Card: Comes up and turns with 3D animation on photo click */}
      {turnedMember && (
        <div
          className="fixed inset-0 z-50 bg-album-leaf/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setTurnedMember(null)}
        >
          <div
            className="animate-card-turn bg-[#fffefb] border-2 border-album-terracotta/30 rounded-2xl shadow-2xl p-5 sm:p-6 max-w-[480px] w-full relative flex flex-col gap-4 text-album-leaf my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Photo avatar, Name, Relationship, and Close button */}
            <div className="flex items-start justify-between gap-3 border-b border-album-line/60 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <Face member={turnedMember} className="w-12 h-12 flex-shrink-0" rounded="rounded-full" ring="border-2 border-album-terracotta/40" />
                <div className="flex flex-col leading-tight min-w-0">
                  <span
                    style={getDynamicNameStyle(turnedMember.fullName)}
                    className="font-extrabold text-album-leaf break-normal"
                  >
                    {turnedMember.fullName}
                  </span>
                  {turnedMember.tamilName && turnedMember.tamilName.trim() !== turnedMember.fullName.trim() && (
                    <span lang="ta" className="text-xs text-album-leaf/75 break-normal">{turnedMember.tamilName}</span>
                  )}
                  <span className="text-xs text-album-leaf/70 pt-0.5">{whoLine(family, turnedMember)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTurnedMember(null)}
                className="p-1.5 rounded-full hover:bg-album-line/40 text-album-leaf/70 hover:text-album-leaf transition cursor-pointer bg-transparent border-0"
                title="Turn card back / Close"
              >
                <Svg icon={Icon.close} className="w-5 h-5" stroke={2.4} />
              </button>
            </div>

            {/* Details List */}
            <div className="flex flex-col gap-2.5 text-sm">
              {/* Qualification */}
              {turnedMember.education && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-album-sand/50">
                  <Svg icon={Icon.academic} className="w-4 h-4 text-album-terracotta mt-0.5 shrink-0" stroke={2.2} />
                  <div className="flex flex-col leading-snug">
                    <span className="text-[11px] font-bold text-album-leaf/70 uppercase tracking-wide">
                      Qualification · கல்வி தகுதி
                    </span>
                    <span className="font-semibold text-album-leaf">{turnedMember.education}</span>
                  </div>
                </div>
              )}

              {/* Business */}
              {turnedMember.business && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-album-sand/50">
                  <Svg icon={Icon.briefcase} className="w-4 h-4 text-album-terracotta mt-0.5 shrink-0" stroke={2.2} />
                  <div className="flex flex-col leading-snug">
                    <span className="text-[11px] font-bold text-album-leaf/70 uppercase tracking-wide">
                      Business · தொழில்
                    </span>
                    <span className="font-semibold text-album-leaf">{turnedMember.business}</span>
                  </div>
                </div>
              )}

              {/* Profession (if distinct) */}
              {turnedMember.profession && turnedMember.profession !== turnedMember.business && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-album-sand/50">
                  <Svg icon={Icon.briefcase} className="w-4 h-4 text-album-terracotta mt-0.5 shrink-0" stroke={2.2} />
                  <div className="flex flex-col leading-snug">
                    <span className="text-[11px] font-bold text-album-leaf/70 uppercase tracking-wide">
                      Profession · பணி
                    </span>
                    <span className="font-semibold text-album-leaf">{turnedMember.profession}</span>
                  </div>
                </div>
              )}

              {/* Location */}
              {(turnedMember.currentCity || turnedMember.birthPlace) && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-album-sand/50">
                  <Svg icon={Icon.pin} className="w-4 h-4 text-album-terracotta mt-0.5 shrink-0" stroke={2.2} />
                  <div className="flex flex-col leading-snug">
                    <span className="text-[11px] font-bold text-album-leaf/70 uppercase tracking-wide">
                      Location · இடம்
                    </span>
                    <span className="font-semibold text-album-leaf">
                      {[turnedMember.currentCity && `Lives in ${turnedMember.currentCity}`, turnedMember.birthPlace && `From ${turnedMember.birthPlace}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
              )}

              {/* In loving memory */}
              {turnedMember.isDeceased && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 text-album-leaf/85">
                  <JasmineGarland className="w-8 h-auto shrink-0" />
                  <span className="text-xs font-semibold">In loving memory · மறைவு</span>
                  {(turnedMember.birthDate || turnedMember.deathDate) && (
                    <span className="text-xs text-album-leaf/70">
                      ({turnedMember.birthDate ? formatDateDMY(turnedMember.birthDate) : ''}
                      {turnedMember.birthDate && turnedMember.deathDate ? ' – ' : ''}
                      {turnedMember.deathDate ? formatDateDMY(turnedMember.deathDate) : ''})
                    </span>
                  )}
                </div>
              )}

              {/* Biography / Notes */}
              {(turnedMember.biography || turnedMember.coupleAbout || turnedMember.notes) && (
                <div className="p-3 rounded-xl bg-white border border-album-line/60 text-xs leading-relaxed text-album-leaf/90">
                  <span className="text-[11px] font-bold block text-album-leaf/70 mb-0.5">In their words · குறிப்பு</span>
                  {turnedMember.biography || turnedMember.coupleAbout || turnedMember.notes}
                </div>
              )}

              {/* Fallback if no specific bio/profession is entered yet */}
              {!turnedMember.education && !turnedMember.business && !turnedMember.profession && !turnedMember.currentCity && !turnedMember.biography && (
                <div className="p-3 rounded-xl bg-album-sand/40 text-center text-xs text-album-leaf/70">
                  No additional biographical details added yet.
                </div>
              )}
            </div>

            {/* How is related to me button */}
            <a
              href={href.related(turnedMember.id)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-album-terracotta/10 hover:bg-album-terracotta hover:text-white text-album-terracotta border border-album-terracotta/30 transition-all font-bold text-xs sm:text-sm no-underline shadow-xs group mt-1"
            >
              <span className="flex items-center gap-2">
                <Svg icon={Icon.link} className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" stroke={2.2} />
                <span>How is {firstName(turnedMember)} related to me?</span>
                <span lang="ta" className="text-xs font-normal opacity-85">· உறவு</span>
              </span>
              <Svg icon={Icon.next} className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" stroke={2.5} />
            </a>

            {/* Contact Buttons */}
            <ContactButtons member={turnedMember} />

            {/* Turn back footer */}
            <div className="flex items-center justify-end pt-2 border-t border-album-line/50">
              <button
                type="button"
                onClick={() => setTurnedMember(null)}
                className="text-xs font-bold text-album-leaf/70 hover:text-album-terracotta underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                <Svg icon={Icon.swap} className="w-3.5 h-3.5" /> Turn back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
