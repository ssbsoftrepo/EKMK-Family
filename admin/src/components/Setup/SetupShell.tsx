import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ImportStep } from './ImportStep';
import { BuildTreeStep } from './BuildTreeStep';
import { ShareStep } from './ShareStep';
import { MembersStep } from './MembersStep';
import { Check } from './ui';
import { familyApi, signOut } from '../../api/familyApi';
import { ThemeSwitch } from './ThemeSwitch';
import { useSiteTheme } from '../../lib/theme';

type StepId = 'import' | 'build' | 'share' | 'members';

const STEPS: { id: StepId; number?: number; label: string }[] = [
  { id: 'import', number: 1, label: 'Add people' },
  { id: 'build', number: 2, label: 'Build the tree' },
  { id: 'share', number: 3, label: 'Share the link' },
  { id: 'members', label: 'All members' },
];

const readHash = (): StepId | null => {
  const h = window.location.hash.replace('#', '');
  return STEPS.some((s) => s.id === h) ? (h as StepId) : null;
};

/** The admin site: three simple steps, plus the full member list for detailed edits. */
export const SetupShell: React.FC = () => {
  const { members } = useAdmin();
  const [step, setStep] = useState<StepId>(() => readHash() ?? (members.length === 0 ? 'import' : 'build'));

  useEffect(() => {
    const onHash = () => setStep(readHash() ?? 'build');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // The admin site follows the family website's look, unless the admin picked their own with the Look button.
  const [siteTheme, setSiteTheme] = useState<string>();
  useEffect(() => { familyApi.getSettings().then((s) => setSiteTheme(s.siteTheme)).catch(() => undefined); }, []);
  useSiteTheme(siteTheme);

  // Bumped on every menu tap, so tapping "All members" while editing someone goes back to the list.
  const [visit, setVisit] = useState(0);

  const go = (id: StepId) => {
    window.location.hash = id;
    setStep(id);
    setVisit((v) => v + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doneBefore = (id: StepId) => STEPS.findIndex((s) => s.id === id) < STEPS.findIndex((s) => s.id === step) && id !== 'members';

  return (
    <div className="admin-shell min-h-screen bg-album-paper text-album-leaf font-album flex flex-col">
      <header className="admin-header bg-album-leaf text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="w-[46px] h-[46px] rounded-full bg-album-turmeric text-album-leaf flex items-center justify-center text-[15px] font-extrabold">KMK</span>
            <span className="text-xl font-extrabold">Family admin</span>
          </span>
          <nav aria-label="Setup steps" className="flex flex-wrap gap-2">
            {STEPS.map((s) => {
              const current = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={current ? 'step' : undefined}
                  className={`min-h-[46px] rounded-full pl-1.5 pr-4 flex items-center gap-2 text-base transition ${
                    current ? 'bg-album-turmeric text-album-leaf font-extrabold' : 'border-2 border-white text-white font-bold hover:bg-white/10'
                  } ${s.number ? '' : 'pl-4'}`}
                >
                  {s.number && (
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${current ? 'bg-album-leaf text-white' : 'bg-white text-album-leaf'}`}>
                      {doneBefore(s.id) ? <Check className="w-4 h-4" /> : s.number}
                    </span>
                  )}
                  {s.label}
                </button>
              );
            })}
          </nav>
          <span className="flex items-center gap-3 text-[15px]">
            <span className="flex items-center gap-1.5"><Check className="w-5 h-5" color="#F2B705" />Saved automatically</span>
            <ThemeSwitch night />
            <button type="button" onClick={signOut} className="min-h-[44px] px-3.5 rounded-full border-2 border-white/70 text-white font-bold hover:bg-white/10">Sign out</button>
          </span>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-5 pt-7 pb-12 flex flex-col gap-6 flex-1">
        {step === 'import' && <ImportStep onNext={() => go('build')} />}
        {step === 'build' && <BuildTreeStep onAddPeople={() => go('import')} onNext={() => go('share')} />}
        {step === 'share' && <ShareStep />}
        {step === 'members' && <MembersStep key={visit} />}
      </main>

      <footer className="border-t-2 border-album-line py-5 px-4 text-center font-hand text-lg text-album-leaf">
        Made with <span role="img" aria-label="love">❤️</span> by <a href="https://www.ssbsoft.com" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-album-terracotta">SSB Software Solutions Pvt. Ltd.</a>
      </footer>
    </div>
  );
};
