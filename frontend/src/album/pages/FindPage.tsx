import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyMember } from '../../types/family';
import { Family, byAge, whoLine } from '../family';
import { href } from '../router';
import { Hand, Icon, PersonTile, Svg, Title } from '../ui';
import { emojiRain, funWord } from '../magic';
import { useGridCols, useIsPhone } from '../../lib/useIsPhone';

const ROWS_PER_PAGE = 5;

/** Everyone, as photos, sorted by age. Search by name, place or job. */
export const FindPage: React.FC<{ family: Family }> = ({ family }) => {
  const [query, setQuery] = useState('');
  const [batches, setBatches] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const phone = useIsPhone();
  const cols = useGridCols();
  const limit = batches * ROWS_PER_PAGE * cols;

  const handleShowMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setBatches((b) => b + 1);
      setLoadingMore(false);
    }, 120);
  };

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const filtered = family.members.filter((m) =>
      words.length === 0 ||
      words.every((w) =>
        [m.fullName, m.tamilName, m.currentCity, m.profession].some(
          (v) => v && v.toLowerCase().includes(w)
        )
      )
    );
    return byAge(filtered);
  }, [family, query]);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="find-name" className="block">
        <Title en="Find a relative" ta="உறவினரைத் தேடு" />
      </label>
      <div className="relative max-w-[560px]">
        <span className="absolute left-4 top-1/2 -translate-y-1/2"><Svg icon={Icon.search} className="w-6 h-6" /></span>
        <input id="find-name" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setBatches(1); }}
          placeholder={phone ? 'Name, town or job' : 'Type a name, a town or a job'} autoComplete="off"
          className="w-full min-h-[60px] rounded-[18px] border-2 border-album-leaf bg-white pl-[52px] pr-4 text-[19px] text-album-leaf" />
      </div>

      {fun && <Hand className="text-xl magic-pop">{fun.say}</Hand>}

      {results.length === 0 ? (
        <div className="py-10 text-center flex flex-col gap-1">
          <Hand className="text-2xl">no one found</Hand>
          <span className="text-lg">Try fewer letters, or check the spelling.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-[880px] mx-auto w-full">
          {results.slice(0, limit).map((m: FamilyMember) => <PersonTile key={m.id} member={m} href={href.person(m.id)} line={whoLine(family, m)} />)}
        </div>
      )}
      {results.length > limit && (
        <button
          type="button"
          onClick={handleShowMore}
          disabled={loadingMore}
          className="self-center min-h-[56px] px-6 rounded-2xl border-2 border-album-leaf bg-white font-bold text-lg inline-flex items-center gap-2.5 disabled:opacity-75"
        >
          {loadingMore ? (
            <>
              <span aria-hidden="true" className="w-5 h-5 rounded-full border-2 border-album-leaf/25 border-t-album-leaf animate-spin" />
              Loading...
            </>
          ) : (
            `Show more (${results.length - limit} left)`
          )}
        </button>
      )}
    </div>
  );
};
