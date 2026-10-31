import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyMember } from '../../types/family';
import { Family, coupleLabel, firstName, whoLine } from '../family';
import { href } from '../router';
import { Hand, Icon, PersonTile, Svg, Title } from '../ui';
import { emojiRain, funWord } from '../magic';
import { SurpriseMe } from '../SurpriseMe';

const STEP = 48;

/** Everyone, as photos. Search by name, place or job, or narrow down to one branch of the family. */
export const FindPage: React.FC<{ family: Family }> = ({ family }) => {
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState<string | null>(null);
  const [limit, setLimit] = useState(STEP);

  // Easter egg: some family words make something rain down ("paati" brings jasmine).
  const fun = funWord(query);
  const lastFun = useRef<string | null>(null);
  useEffect(() => {
    if (!fun) { lastFun.current = null; return; }
    if (lastFun.current === fun.say) return;
    lastFun.current = fun.say;
    const t = setTimeout(() => emojiRain(fun.emojis), 250);
    return () => clearTimeout(t);
  }, [fun]);

  // One chip per child of the elders: "Ravi's family" = Ravi, his wife, their children and grandchildren.
  const branches = useMemo(() => {
    const founders = family.founders();
    if (founders.length === 0) return [];
    const kids = family.childrenOfCouple(founders[0], founders[1]);
    return kids.map((k) => {
      const ids = new Set<string>();
      const queue = [k];
      while (queue.length) {
        const m = queue.pop()!;
        if (ids.has(m.id)) continue;
        ids.add(m.id);
        family.spouses(m).forEach((s) => ids.add(s.id));
        queue.push(...family.children(m));
      }
      return { id: k.id, label: `${firstName(k)}'s family`, ids };
    });
  }, [family]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chosen = branches.find((b) => b.id === branch);
    return [...family.members]
      .filter((m) => !chosen || chosen.ids.has(m.id))
      .filter((m) => !q || [m.fullName, m.tamilName, m.currentCity, m.profession].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [family, query, branch, branches]);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="find-name" className="block">
        <Title en="Find a relative" ta="உறவினரைத் தேடு" />
      </label>
      <div className="relative max-w-[560px]">
        <span className="absolute left-4 top-1/2 -translate-y-1/2"><Svg icon={Icon.search} className="w-6 h-6" /></span>
        <input id="find-name" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(STEP); }}
          placeholder="Type a name, a town or a job" autoComplete="off"
          className="w-full min-h-[60px] rounded-[18px] border-2 border-album-leaf bg-white pl-[52px] pr-4 text-[19px] text-album-leaf" />
      </div>

      {branches.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" role="group" aria-label="Choose a branch of the family">
          <Chip on={!branch} onClick={() => setBranch(null)}>Everyone</Chip>
          {branches.map((b) => <Chip key={b.id} on={branch === b.id} onClick={() => { setBranch(b.id); setLimit(STEP); }}>{b.label}</Chip>)}
        </div>
      )}

      {fun && <Hand className="text-xl magic-pop">{fun.say}</Hand>}
      <span className="text-[17px]" aria-live="polite">{results.length === 1 ? '1 person' : `${results.length} people`}</span>

      {results.length === 0 ? (
        <div className="py-10 text-center flex flex-col gap-1">
          <Hand className="text-2xl">no one found</Hand>
          <span className="text-lg">Try fewer letters, or check the spelling.</span>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 30%), 1fr))' }}>
          {results.slice(0, limit).map((m: FamilyMember) => <PersonTile key={m.id} member={m} href={href.person(m.id)} line={whoLine(family, m)} />)}
        </div>
      )}
      {results.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + STEP)} className="self-center min-h-[56px] px-6 rounded-2xl border-2 border-album-leaf bg-white font-bold text-lg">
          Show more ({results.length - limit} left)
        </button>
      )}
      <div className="pt-4"><SurpriseMe family={family} /></div>
      {branch && (
        <a href={href.family(branch)} className="self-start text-lg font-extrabold text-album-terracotta min-h-[44px] flex items-center">
          See {coupleLabel(family.couple(family.get(branch)!))}'s family as a tree ›
        </a>
      )}
    </div>
  );
};

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`flex-shrink-0 min-h-[46px] px-4 rounded-full text-base font-bold border-2 border-album-leaf ${on ? 'bg-album-leaf text-white' : 'bg-white text-album-leaf'}`}>
    {children}
  </button>
);
