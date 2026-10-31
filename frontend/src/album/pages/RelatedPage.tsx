import React, { useEffect, useMemo, useState } from 'react';
import { FamilyMember } from '../../types/family';
import { Family, firstName, whoLine } from '../family';
import { relate } from '../kinship';
import { href, rememberMe } from '../router';
import { Face, Hand, Icon, Print, Svg, Title, btnPrimary, btnSecondary } from '../ui';
import { ScratchReveal, WelcomeHome } from '../Magic';
import { onceOnThisPhone, reducedMotion } from '../magic';

/**
 * "How are we related?" No login: the visitor taps their own photo once
 * (remembered on this phone only), then anyone else.
 */
export const RelatedPage: React.FC<{ family: Family; id?: string }> = (props) => {
  // "Welcome home!" plays the first time someone tells this phone who they are.
  const [welcome, setWelcome] = useState<FamilyMember | null>(null);
  return (
    <>
      <Related {...props} onFirstVisit={setWelcome} />
      {welcome && <WelcomeHome person={welcome} onClose={() => setWelcome(null)} />}
    </>
  );
};

const Related: React.FC<{ family: Family; id?: string; onFirstVisit: (m: FamilyMember) => void }> = ({ family, id, onFirstVisit }) => {
  const [meId, setMeId] = useState<string | null>(() => rememberMe.get());
  const me = family.get(meId);
  const them = family.get(id);
  const [revealed, setRevealed] = useState(() => reducedMotion());
  useEffect(() => setRevealed(reducedMotion()), [id, meId]);

  const chooseMe = (m: FamilyMember) => {
    rememberMe.set(m.id);
    setMeId(m.id);
    if (onceOnThisPhone(`welcome-${m.id}`)) onFirstVisit(m);
  };
  const notMe = () => { rememberMe.set(null); setMeId(null); };

  if (!me) {
    return <Picker family={family} title="First, who are you?" ta="முதலில், நீங்கள் யார்?" hint="Tap your own photo. This phone will remember it." onPick={chooseMe}
      note={them ? `then we'll show how ${firstName(them)} is related to you` : 'the family puzzle'} />;
  }
  if (!them) {
    return (
      <Picker family={family} title="Who do you want to know about?" ta="யாரைப் பற்றி தெரிந்து கொள்ள வேண்டும்?" hint="Tap their photo." exclude={me.id}
        onPick={(m) => { window.location.hash = href.related(m.id); }} note={`hello ${firstName(me)}!`}
        footer={<button type="button" onClick={notMe} className="underline text-base min-h-[44px] self-start">Not {firstName(me)}? Change</button>} />
    );
  }

  const r = relate(family, me, them);
  return (
    <div className="flex flex-col gap-5 max-w-[640px] mx-auto">
      <Title note="the family puzzle" en="How are we related?" ta="நமக்குள் என்ன உறவு?" />

      <div className="flex items-center gap-2">
        <PersonChip person={me} label={`You, ${firstName(me)}`} />
        <span aria-hidden="true" className="text-2xl">↔</span>
        <PersonChip person={them} label={firstName(them)} />
      </div>

      <Print tilt={-1.2} tape="terracotta">
        <div className="flex flex-col items-center text-center gap-1 px-3 py-4">
          {!r ? (
            <>
              <Hand className="text-2xl">not linked yet</Hand>
              <span className="text-xl font-bold">We can't find the link between you and {firstName(them)} yet.</span>
              <span className="text-base">The family tree is still being filled in. Please try again later.</span>
            </>
          ) : (
            <>
              <span className="text-lg">{firstName(them)} is your</span>
              <ScratchReveal key={them.id} label="Who could it be?" onReveal={() => setRevealed(true)}>
                <div className="flex flex-col items-center gap-1 px-2">
                  {r.tamil && <span lang="ta" className="text-[3rem] sm:text-[3.5rem] font-extrabold leading-tight text-album-terracotta">{r.tamil}</span>}
                  {r.term && <span className="font-hand font-bold text-[1.9rem] leading-tight">{r.term}</span>}
                  <span className={`${r.tamil ? 'text-lg pt-1' : 'text-[1.7rem] font-extrabold leading-tight'}`}>{r.description}</span>
                  {(r.term?.startsWith('Kollu') || r.path.length >= 5) && (
                    <span className="mt-1.5 bg-album-turmeric rounded-full px-3.5 py-0.5 text-base font-extrabold">🌟 Rare find! A far branch of the tree</span>
                  )}
                </div>
              </ScratchReveal>
              <div className="flex flex-wrap justify-center items-start gap-x-1 gap-y-3 pt-4 w-full">
                {r.path.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <span aria-hidden="true" className="w-6 sm:w-8 mt-7 border-t-[3px] border-dotted border-album-leaf" />}
                    <a href={href.person(p.id)} className="no-underline text-album-leaf flex flex-col items-center gap-0.5 w-[76px]">
                      <Face member={p} className="w-14 h-14" rounded="rounded-full" ring={i === r.path.length - 1 ? 'outline outline-[3px] outline-album-terracotta outline-offset-2' : ''} />
                      <span className="text-sm font-bold leading-tight">{i === 0 ? 'you' : firstName(p)}</span>
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </Print>

      {r?.term && revealed && <Hand className="text-[1.6rem] text-center">next time you meet, call {them.gender === 'female' ? 'her' : them.gender === 'male' ? 'him' : 'them'} {r.term.split(' / ')[0]}!</Hand>}

      <div className="grid grid-cols-2 gap-2.5">
        <a href={href.related()} className={btnPrimary}>Try another</a>
        <a href={href.person(them.id)} className={btnSecondary}>See {firstName(them)}</a>
      </div>
      <button type="button" onClick={notMe} className="underline text-base min-h-[44px] self-start">Not {firstName(me)}? Change</button>
    </div>
  );
};

const PersonChip: React.FC<{ person: FamilyMember; label: string }> = ({ person, label }) => (
  <span className="flex-1 min-w-0 bg-white rounded-full p-1.5 pr-4 flex items-center gap-2 border-2 border-album-line">
    <Face member={person} className="w-11 h-11" rounded="rounded-full" />
    <span className="text-[17px] font-bold truncate">{label}</span>
  </span>
);

const Picker: React.FC<{
  family: Family; title: string; ta: string; hint: string; note: string;
  onPick: (m: FamilyMember) => void; exclude?: string; footer?: React.ReactNode;
}> = ({ family, title, ta, hint, note, onPick, exclude, footer }) => {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(36);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return family.members
      .filter((m) => m.id !== exclude && !m.isDeceased)
      .filter((m) => !s || m.fullName.toLowerCase().includes(s))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [family, q, exclude]);
  return (
    <div className="flex flex-col gap-4">
      <Title note={note} en={title} ta={ta} />
      <span className="text-lg">{hint}</span>
      <div className="relative max-w-[560px]">
        <span className="absolute left-4 top-1/2 -translate-y-1/2"><Svg icon={Icon.search} className="w-6 h-6" /></span>
        <label className="sr-only" htmlFor="pick-name">Type a name</label>
        <input id="pick-name" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name"
          className="w-full min-h-[60px] rounded-[18px] border-2 border-album-leaf bg-white pl-[52px] pr-4 text-[19px]" />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 30%), 1fr))' }}>
        {list.slice(0, limit).map((m) => (
          <button key={m.id} type="button" onClick={() => onPick(m)}
            className="text-left text-album-leaf bg-white rounded-[18px] p-1.5 pb-2.5 flex flex-col gap-1 shadow-[0_3px_0_#DCE6D2] hover:shadow-[0_3px_0_#1E4636] lift">
            <Face member={m} className="w-full aspect-square" rounded="rounded-[13px]" />
            <span className="text-[17px] font-extrabold leading-tight px-1">{m.fullName}</span>
            <span className="text-sm leading-tight px-1">{whoLine(family, m)}</span>
          </button>
        ))}
      </div>
      {list.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 36)} className={`${btnSecondary} self-center`}>Show more ({list.length - limit} left)</button>
      )}
      {footer}
    </div>
  );
};
