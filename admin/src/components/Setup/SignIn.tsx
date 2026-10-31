import React, { useState } from 'react';
import { signIn } from '../../api/familyApi';
import { btnPrimary } from './ui';

/** The admin site's front door: one shared family password. */
export const SignIn: React.FC<{ notice?: string; onSignedIn: () => void }> = ({ notice, onSignedIn }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    const problem = await signIn(password);
    setBusy(false);
    if (problem) {
      setError(problem);
      setPassword('');
    } else {
      onSignedIn();
    }
  };

  return (
    <div className="min-h-screen bg-album-paper text-album-leaf font-album flex flex-col items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-[420px] bg-white rounded-[28px] p-6 sm:p-7 flex flex-col gap-4 shadow-[0_6px_0_#1E4636] border-[3px] border-album-leaf">
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-album-turmeric text-album-leaf flex items-center justify-center text-lg font-extrabold flex-shrink-0">KMK</span>
          <div className="flex flex-col leading-tight">
            <span className="font-hand text-xl text-album-terracotta">family eyes only</span>
            <h1 className="m-0 font-album text-[1.8rem] font-extrabold" style={{ letterSpacing: 0 }}>Family admin</h1>
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[17px] font-bold">Admin password</span>
          <div className="flex gap-2">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="current-password" autoFocus
              className="flex-1 min-w-0 min-h-[56px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-lg text-album-leaf" />
            <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}
              className="min-h-[56px] px-4 rounded-2xl border-2 border-album-leaf bg-white font-bold text-base">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        {error && <p role="alert" className="m-0 bg-album-blush rounded-2xl px-4 py-3 text-[16px] font-semibold">{error}</p>}
        <button type="submit" className={btnPrimary} disabled={busy || !password}>{busy ? 'Opening…' : 'Open the admin'}</button>
        <p className="m-0 text-[15px]">This device stays signed in for 30 days. The family website doesn't need a password.</p>
      </form>
      <p className="font-hand text-lg pt-5 text-center">
        Made with <span role="img" aria-label="love">❤️</span> by{' '}
        <a href="https://www.ssbsoft.com" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4">SSB Software Solutions Pvt. Ltd.</a>
      </p>
    </div>
  );
};
