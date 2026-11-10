import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FAMILY_SIGNED_OUT, familySession, familySignIn, FamilySignInError } from '../lib/familyAuth';
import { KolamLoader } from './Magic';
import { btnPrimary } from './ui';
import { firstTimeOnThisPhone, WelcomeIn } from './WelcomeIn';

/**
 * Asks for the family password before anything else loads, when the server has one set.
 * Nothing about the family (names, photos, settings) is fetched until the password is accepted.
 */
export const FamilyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  // After typing the right password: the welcome plays first, then the album opens.
  const [welcome, setWelcome] = useState<null | 'door' | 'vaanga'>(null);
  const endWelcome = useCallback(() => setWelcome(null), []);

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
  if (state === 'locked') {
    return <FamilySignIn onDone={() => { setWelcome(firstTimeOnThisPhone() ? 'door' : 'vaanga'); setState('open'); }} />;
  }
  // The album starts once the welcome is over, so its own surprises (birthday petals) come after it.
  if (welcome) return <WelcomeIn door={welcome === 'door'} onEnd={endWelcome} />;
  return <>{children}</>;
};

/**
 * Friendly banter for a wrong password, a different one each time (English, then Tamil).
 * Gentle on purpose: the person typing may well be Paati herself.
 */
const BANTER: { face: string; en: string; ta: string }[] = [
  { face: '🙈', en: 'Aiyo! That’s not the password. Try once more?', ta: 'ஐயோ! இது இல்லை. இன்னொரு முறை முயலுங்கள்?' },
  { face: '👵', en: 'Paati says: “Slowly, kanna. Type it slowly.”', ta: 'பாட்டி சொல்றாங்க: “மெதுவா டைப் பண்ணு கண்ணா.”' },
  { face: '🤔', en: 'Hmm… did Chithappa change it again? Ask the family elders.', ta: 'சித்தப்பா மறுபடி மாத்திட்டாரா? குடும்பப் பெரியவர்களிடம் கேளுங்கள்.' },
  { face: '😄', en: 'So close! But this door opens only for the right password.', ta: 'கிட்ட வந்தாச்சு! சரியான கடவுச்சொல்லுக்கு மட்டும் தான் கதவு திறக்கும்.' },
  { face: '☕', en: 'Take a sip of filter coffee, then try again.', ta: 'ஒரு வாய் ஃபில்டர் காபி குடிச்சிட்டு மறுபடி முயலுங்கள்.' },
  { face: '😉', en: 'You are one of us, right? Only the family knows this one!', ta: 'நம்ம குடும்பம் தானே? இது குடும்பத்துக்கு மட்டும் தெரியும்!' },
  { face: '🙏', en: 'Paravaillai, everyone forgets! Ask the family admin. No scolding, promise.', ta: 'பரவாயில்லை, எல்லோரும் மறப்பார்கள்! அட்மினிடம் கேளுங்கள், திட்ட மாட்டாங்க.' },
];

/** The server pauses signing in after this many wrong tries (FamilyAuthService.MAX_FAILURES). */
const MAX_TRIES = 10;

const FamilySignIn: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wrong, setWrong] = useState(0);
  const [paused, setPaused] = useState(false);
  const [caps, setCaps] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const card = useRef<HTMLFormElement>(null);

  // The card shakes its head "no" (the animation restarts on every wrong try).
  const shake = () => {
    const el = card.current;
    if (!el) return;
    el.classList.remove('head-shake');
    void el.offsetWidth;
    el.classList.add('head-shake');
  };

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
      const reason = err instanceof FamilySignInError ? err.reason : 'offline';
      if (reason === 'wrong') {
        setWrong((w) => w + 1);
        shake();
      } else {
        setPaused(reason === 'paused');
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
      setBusy(false);
      input.current?.select();
    }
  };

  const banter = wrong > 0 ? BANTER[(wrong - 1) % BANTER.length] : null;
  const triesLeft = MAX_TRIES - wrong;
  const describedBy = error ? 'family-password-error' : banter ? 'family-password-banter' : 'family-password-hint';

  return (
    <div className="min-h-screen flex flex-col text-album-leaf font-album">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <form ref={card} onSubmit={submit} noValidate
          className="w-full max-w-[440px] bg-white rounded-[28px] p-6 sm:p-7 flex flex-col gap-4 shadow-pop-lg border-[3px] border-album-edge">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" key={wrong} className={`site-logo w-14 h-14 rounded-full bg-album-leaf text-album-turmeric flex items-center justify-center text-lg font-extrabold flex-shrink-0 ${wrong ? 'logo-wobble' : ''}`}>KMK</span>
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-extrabold">KMK Family Tree</span>
              <span lang="ta" className="text-base">இது எங்கள் குடும்பம்</span>
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
                onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
                autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                aria-invalid={wrong > 0 || !!error} aria-describedby={describedBy}
                className="flex-1 min-w-0 min-h-[60px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-xl" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
                className="min-h-[60px] px-3.5 rounded-2xl border-2 border-album-line bg-white text-base font-bold flex-shrink-0">
                {show ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {caps && <span className="text-[15px] font-bold -mt-2">Caps Lock is on: the password is case-sensitive.</span>}

          {error ? (
            <span id="family-password-error" role="alert" className={`rounded-2xl px-4 py-3 text-[17px] font-bold ${paused ? 'bg-album-sun' : 'text-album-terracotta'}`}>
              {paused && <span className="block text-xl pb-0.5"><span aria-hidden="true">☕ </span>Chai break!</span>}
              {error}
            </span>
          ) : banter ? (
            <div id="family-password-banter" role="alert" className="flex gap-3 items-start bg-album-paper rounded-2xl px-3.5 py-3">
              <span key={wrong} aria-hidden="true" className="peek text-[34px] leading-none flex-shrink-0">{banter.face}</span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[17px] font-extrabold leading-snug">{banter.en}</span>
                <span lang="ta" className="text-[15px] leading-snug">{banter.ta}</span>
                {triesLeft <= 3 && triesLeft > 0 && (
                  <span className="text-sm font-bold text-album-terracotta pt-1">
                    {triesLeft === 1 ? 'One more wrong try' : `${triesLeft} more wrong tries`} and it’s a 5-minute chai break ☕
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span id="family-password-hint" className="text-[15px]">Don’t know it? Ask the family admin or elders.</span>
          )}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full disabled:opacity-70`}>
            {busy ? 'Opening…' : wrong ? 'Try again' : 'Open the family album'}
          </button>
          <span className="text-[15px] text-center">This phone will remember you, so you only do this once.</span>
        </form>
      </main>
      <footer className="py-4 px-4 text-center font-hand text-sm">
        Made with <span role="img" aria-label="love">❤️</span> by <a href="https://www.ssbsoft.com" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-album-terracotta">SSB Soft</a>
      </footer>
    </div>
  );
};
