import React, { useEffect, useState } from 'react';
import { familyApi, FamilyPasswordStatus } from '../../api/familyApi';
import { useToast } from '../../context/ToastContext';
import { btnPrimary, btnSecondary, card, Check } from './ui';

/*
 * "Family website password" in Share the link. Made for a non-technical admin:
 * type a new password (or tap "Suggest one"), tap Save, then share it with one tap.
 * The password is kept locked (hashed) on the server and never shown again,
 * so to "see" it later the admin simply sets a new one.
 */

/** Easy to type on a phone, easy for elders to remember: a family word and two numbers. */
const WORDS = ['malligai', 'murukku', 'kolam', 'manjal', 'kaveri', 'thinnai', 'payasam', 'jasmine', 'marigold', 'vadai', 'thatha', 'paati', 'pongal'];
const suggest = () => {
  const n = new Uint32Array(2);
  crypto.getRandomValues(n);
  return `${WORDS[n[0] % WORDS.length]}${10 + (n[1] % 90)}`;
};

const when = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

type Mode = 'view' | 'edit' | 'confirm-change' | 'confirm-off' | 'saved';

export const FamilyPassword: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const toast = useToast();
  const [status, setStatus] = useState<FamilyPasswordStatus | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    familyApi.getFamilyPassword().then(setStatus).catch((e) => setProblem(e instanceof Error ? e.message : 'Could not load the family password.'));
  }, []);

  const min = status?.minLength ?? 6;
  const clean = password.trim();

  const startEdit = () => { setPassword(''); setProblem(''); setShow(true); setMode('edit'); };

  const save = async () => {
    setBusy(true);
    setProblem('');
    try {
      setStatus(await familyApi.setFamilyPassword(clean));
      setMode('saved');
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Could not save the new password.');
      setMode('edit');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      setStatus(await familyApi.turnOffFamilyPassword());
      setMode('view');
      toast.success('Password turned off', 'Anyone with the link can open the family website now');
    } catch (e) {
      toast.error('Could not turn it off', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (clean.length < min) {
      setProblem(`Please use at least ${min} letters or numbers.`);
      return;
    }
    // Changing a password that is in use signs everyone out: say so first. Setting the first one needs no warning.
    if (status?.on) setMode('confirm-change');
    else save();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clean);
      toast.success('Password copied', 'Paste it anywhere');
    } catch {
      toast.info('Select the password and copy it', clean);
    }
  };

  return (
    <section className={`${card} shadow-pop flex flex-col gap-3`} aria-labelledby="family-password-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="family-password-title" className="m-0 text-xl font-extrabold" style={{ letterSpacing: 0 }}>
          Family website password <span lang="ta" className="text-base font-semibold">· குடும்பக் கடவுச்சொல்</span>
        </h2>
        {status && (
          <span className={`rounded-full px-3 py-1 text-[15px] font-extrabold ${status.on ? 'bg-album-sage' : 'bg-album-sun'}`}>
            {status.on ? '🔒 On' : '🔓 Off'}
          </span>
        )}
      </div>

      {!status ? (
        <span className="text-base">{problem || 'Loading…'}</span>
      ) : mode === 'saved' ? (
        <div className="flex flex-col gap-3 magic-pop" role="status">
          <span className="flex items-center gap-2 text-lg font-extrabold"><Check className="w-6 h-6" color="#5C8A4A" /> Saved! The new family password is:</span>
          <span className="self-start rounded-2xl bg-album-paper border-2 border-dashed border-album-leaf px-5 py-3 text-[1.7rem] font-extrabold tracking-wide select-all">{clean}</span>
          <span className="text-[17px]">Now tell the family. Phones that were signed in will ask for this new password the next time they open the website.</span>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className={btnPrimary} onClick={copy}>Copy password</button>
            <button type="button" className={btnSecondary} onClick={() => { setPassword(''); setMode('view'); }}>Done</button>
          </div>
          <span className="text-[15px]">Write it down somewhere safe: for safety, this page won’t show it again. If it’s ever forgotten, just set a new one here.</span>
        </div>
      ) : mode === 'view' || mode === 'confirm-off' ? (
        <div className="flex flex-col gap-3">
          <span className="text-[17px]">
            {status.on
              ? 'The family must type this password once on each phone before they can see the family website.'
              : 'Anyone with the link can open the family website. Set a password to keep it just for the family.'}
            {status.on && status.source === 'admin' && when(status.changedAt) && <span className="block text-[15px] pt-1">Last changed on {when(status.changedAt)}.</span>}
            {status.on && status.source === 'server' && <span className="block text-[15px] pt-1">It was set on the server. Saving a new one here replaces it.</span>}
          </span>
          {mode === 'confirm-off' ? (
            <div className="rounded-2xl bg-album-sun/60 p-3.5 flex flex-col gap-2.5" role="alertdialog" aria-label="Turn the password off?">
              <span className="text-[17px] font-bold">Turn the password off? Anyone who has the link will be able to see the family website.</span>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" className={btnSecondary} disabled={busy} onClick={turnOff}>Yes, turn it off</button>
                <button type="button" className={btnPrimary} onClick={() => setMode('view')}>Keep it on</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className={btnPrimary} onClick={startEdit}>{status.on ? 'Change the password' : 'Set a password'}</button>
              {status.on && (
                <button type="button" onClick={() => setMode('confirm-off')} className="min-h-[44px] px-2 underline underline-offset-4 font-bold">
                  Turn the password off
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor="new-family-password" className="flex flex-col gap-1.5">
            <span className="text-lg font-extrabold">New password</span>
            <span className="text-[15px]">Easy to type on a phone: small letters and a few numbers, at least {min}. Not the admin password.</span>
            <span className="flex flex-wrap gap-2">
              <input id="new-family-password" type={show ? 'text' : 'password'} value={password} autoFocus
                onChange={(e) => { setPassword(e.target.value); setProblem(''); if (mode === 'confirm-change') setMode('edit'); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }}
                autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                aria-invalid={!!problem} aria-describedby={problem ? 'new-family-password-problem' : undefined}
                className="flex-[1_1_220px] min-w-0 min-h-[56px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-xl font-album text-album-leaf" />
              <button type="button" className={btnSecondary} onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
              <button type="button" className={btnSecondary} onClick={() => { setPassword(suggest()); setShow(true); setProblem(''); setMode('edit'); }}>Suggest one</button>
            </span>
          </label>
          {problem && <span id="new-family-password-problem" role="alert" className="text-[17px] font-bold text-album-terracotta">{problem}</span>}

          {mode === 'confirm-change' ? (
            <div className="rounded-2xl bg-album-sun/60 p-3.5 flex flex-col gap-2.5" role="alertdialog" aria-label="Change the family password?">
              <span className="text-[17px] font-bold">Change it to “{clean}”? Everyone will need the new password, and phones already signed in will be asked for it.</span>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" className={btnPrimary} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Yes, change it'}</button>
                <button type="button" className={btnSecondary} onClick={() => setMode('edit')}>Not now</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={btnPrimary} disabled={busy} onClick={next}>{busy ? 'Saving…' : 'Save the new password'}</button>
              <button type="button" className={btnSecondary} onClick={() => { setPassword(''); setProblem(''); setMode('view'); }}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
