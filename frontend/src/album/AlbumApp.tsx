import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Family } from './family';
import { href, Route, useRoute } from './router';
import { Icon, Svg } from './ui';
import { HomePage } from './pages/HomePage';
import { FindPage } from './pages/FindPage';
import { PersonPage } from './pages/PersonPage';
import { FamilyPage } from './pages/FamilyPage';
import { TreePage } from './pages/TreePage';
import { RelatedPage } from './pages/RelatedPage';

const NAV: { id: Route['page'][]; to: string; en: string; ta: string; icon: React.ReactNode }[] = [
  { id: ['home'], to: href.home(), en: 'Home', ta: 'முகப்பு', icon: Icon.home },
  { id: ['find', 'person'], to: href.find(), en: 'Find', ta: 'தேடு', icon: Icon.search },
  { id: ['family', 'tree'], to: href.family(), en: 'Family', ta: 'குடும்பம்', icon: Icon.tree },
  { id: ['related'], to: href.related(), en: 'Related?', ta: 'உறவு', icon: Icon.link },
];

/** The family website: a photo album first, phone first. */
export const AlbumApp: React.FC = () => {
  const { members, isLoading, isBackendConnected, refreshData } = useFamily();
  const route = useRoute();
  const family = useMemo(() => new Family(members), [members]);

  return (
    <div className="min-h-screen flex flex-col bg-album-paper text-album-leaf font-album">
      <header className="bg-white border-b-2 border-album-line sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <a href={href.home()} className="no-underline text-album-leaf flex items-center gap-2.5">
            <span className="w-12 h-12 rounded-full bg-album-leaf text-album-turmeric flex items-center justify-center text-base font-extrabold">KMK</span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold">Our Family</span>
              <span lang="ta" className="text-[15px]">எங்கள் குடும்பம்</span>
            </span>
          </a>
          <nav aria-label="Main" className="hidden md:flex gap-1.5">
            {NAV.map((n) => {
              const on = n.id.includes(route.page);
              return (
                <a key={n.to} href={n.to} aria-current={on ? 'page' : undefined}
                  className={`no-underline min-h-[48px] px-4 rounded-full flex items-center gap-2 text-[17px] font-bold ${on ? 'bg-album-leaf text-white' : 'text-album-leaf hover:bg-album-paper'}`}>
                  <Svg icon={n.icon} className="w-5 h-5" />{n.en}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 pt-5 pb-28 md:pb-12">
        {isLoading && members.length === 0 ? (
          <Message hand="just a moment…" text="Opening the family album" />
        ) : !isBackendConnected && members.length === 0 ? (
          <Message hand="oops" text="The family album could not be opened. Please check your internet and try again.">
            <button type="button" onClick={() => refreshData()} className="mt-3 min-h-[56px] px-6 rounded-2xl bg-album-terracotta text-white font-extrabold text-lg">Try again</button>
          </Message>
        ) : (
          <>
            {route.page === 'home' && <HomePage family={family} />}
            {route.page === 'find' && <FindPage family={family} />}
            {route.page === 'person' && <PersonPage family={family} id={route.id} />}
            {route.page === 'family' && <FamilyPage family={family} id={route.id} />}
            {route.page === 'tree' && <TreePage family={family} focusId={route.id} />}
            {route.page === 'related' && <RelatedPage family={family} id={route.id} />}
          </>
        )}
      </main>

      <footer className="border-t-2 border-album-line py-5 px-4 pb-28 md:pb-6 text-center font-hand text-lg">
        Made with <span role="img" aria-label="love">❤️</span> by <a href="https://www.ssbsoft.com" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-album-terracotta">SSB Software Solutions Pvt. Ltd.</a>
      </footer>

      <nav aria-label="Main" className="md:hidden fixed left-0 right-0 bottom-0 z-30 bg-white border-t-2 border-album-line flex justify-around items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((n) => {
          const on = n.id.includes(route.page);
          return (
            <a key={n.to} href={n.to} aria-current={on ? 'page' : undefined}
              className={`no-underline flex-1 min-h-[68px] flex flex-col items-center justify-center leading-tight ${on ? 'text-album-terracotta font-extrabold' : 'text-album-leaf font-semibold'}`}>
              <Svg icon={n.icon} className="w-7 h-7" />
              <span className="text-[15px]">{n.en}</span>
              <span lang="ta" className="text-xs">{n.ta}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};

const Message: React.FC<{ hand: string; text: string; children?: React.ReactNode }> = ({ hand, text, children }) => (
  <div className="flex flex-col items-center text-center gap-1 py-20">
    <span className="font-hand text-3xl text-album-terracotta">{hand}</span>
    <span className="text-xl font-bold max-w-[420px]">{text}</span>
    {children}
  </div>
);
