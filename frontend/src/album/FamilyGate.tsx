import React, { useEffect, useRef, useState } from 'react';
import { FAMILY_SIGNED_OUT, familySession, familySignIn } from '../lib/familyAuth';
import { KolamLoader } from './Magic';
import { btnPrimary } from './ui';

/**
 * Asks for the family password before anything else loads, when the server has one set.
 * Nothing about the family (names, photos, settings) is fetched until the password is accepted.
 */
export const FamilyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');

  useEffect(() => {
    let alive = true;
    familySession().then((s) => alive && setState(!s.required || s.signedIn ? 'open' : 'locked'));
    // The password was changed on the server: ask again, starting from a clean page.
    const onSignedOut = () => window.location.reload();
    window.addEventListener(FAMILY_SIGNED_OUT, onSignedOut);
    return () => { alive = false; window.removeEventListener(FAMILY_SIGNED_OUT, onSignedOut); };
  }, []);

  if (state === 'checking') {
    return <div className="min-h-screen flex items-center justify-center text-album-leaf font-album"><KolamLoader text="Opening the family album" /></div>;
  }
  if (state === 'locked') return <FamilySignIn onDone={() => setState('open')} />;
  return <>{children}</>;
};

const FamilySignIn: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please type the family password.');
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await familySignIn(password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That password isn’t right. Please try again.');
      setBusy(false);
      input.current?.select();
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-album-leaf font-album">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} noValidate
          className="w-full max-w-[440px] bg-white rounded-[28px] p-6 sm:p-7 flex flex-col gap-4 shadow-pop-lg border-[3px] border-album-edge">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="site-logo w-14 h-14 rounded-full bg-album-leaf text-album-turmeric flex items-center justify-center text-lg font-extrabold flex-shrink-0">KMK</span>
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-extrabold">Our Family</span>
              <span lang="ta" className="text-base">எங்கள் குடும்பம்</span>
            </span>
          </div>
          <p className="m-0 text-lg leading-snug">
            This website is just for our family. Please type the family password to come in.
            <span lang="ta" className="block text-base pt-1">இந்த இணையதளம் நம் குடும்பத்திற்கு மட்டும். குடும்பக் கடவுச்சொல்லை உள்ளிடவும்.</span>
          </p>
          <label htmlFor="family-password" className="flex flex-col gap-1.5">
            <span className="text-lg font-extrabold">Family password <span lang="ta" className="font-semibold text-base">· குடும்பக் கடவுச்சொல்</span></span>
            <span className="flex gap-2">
              <input id="family-password" ref={input} type={show ? 'text' : 'password'} value={password} autoFocus
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                aria-invalid={!!error} aria-describedby={error ? 'family-password-error' : 'family-password-hint'}
                className="flex-1 min-w-0 min-h-[60px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-xl" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
                className="min-h-[60px] px-3.5 rounded-2xl border-2 border-album-line bg-white text-base font-bold flex-shrink-0">
                {show ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {error
            ? <span id="family-password-error" role="alert" className="text-[17px] font-bold text-album-terracotta">{error}</span>
            : <span id="family-password-hint" className="text-[15px]">Don’t know it? Ask the family admin, or look in the family WhatsApp group.</span>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full disabled:opacity-70`}>
            {busy ? 'Opening…' : 'Open the family album'}
          </button>
          <span className="text-[15px] text-center">This phone will remember you, so you only do this once.</span>
        </form>
      </main>
      <footer className="py-5 px-4 text-center font-hand text-lg">
        Made with <span role="img" aria-label="love">❤️</span> by <a href="https://www.ssbsoft.com" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-album-terracotta">SSB Software Solutions Pvt. Ltd.</a>
      </footer>
    </div>
  );
};
