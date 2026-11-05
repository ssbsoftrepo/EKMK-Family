/**
 * The family password (bare minimum): one shared password for the whole family, set on the
 * server as FAMILY_PASSWORD. After signing in, this phone keeps a token for 180 days.
 * Without FAMILY_PASSWORD on the server the website is open and no password is asked.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const KEY = 'kmk-family-pass';

/** Fired when the server no longer accepts this phone's token (for example, the password was changed). */
export const FAMILY_SIGNED_OUT = 'kmk-family-signed-out';

export const familyToken = (): string | null => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};

const saveToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch { /* private mode: signed in for this visit only */ }
  memoryToken = token;
};

// Used when the browser refuses storage (private mode).
let memoryToken: string | null = null;
const currentToken = () => familyToken() ?? memoryToken;

/** fetch() with the family token. A 401 means the token is no longer good: sign this phone out. */
export async function familyFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = currentToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !url.includes('/api/family/')) {
    saveToken(null);
    window.dispatchEvent(new Event(FAMILY_SIGNED_OUT));
  }
  return res;
}

/** Does the website ask for the password, and is this phone signed in? */
export async function familySession(): Promise<{ required: boolean; signedIn: boolean }> {
  try {
    const res = await familyFetch(`${API_BASE_URL}/api/family/session`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    // Server unreachable or an older server without the family password: let the site
    // open and show its own "could not be opened" message if the data can't load.
    return { required: false, signedIn: true };
  }
}

/** Why signing in failed: 'wrong' password, 'paused' after too many tries, or 'offline'. */
export class FamilySignInError extends Error {
  readonly reason: 'wrong' | 'paused' | 'offline';
  constructor(message: string, reason: 'wrong' | 'paused' | 'offline') {
    super(message);
    this.reason = reason;
  }
}

export async function familySignIn(password: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/family/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new FamilySignInError('Could not reach the family website. Please check your internet and try again.', 'offline');
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 429) throw new FamilySignInError(body.error || 'Too many wrong tries. Please wait a few minutes and try again.', 'paused');
  if (!res.ok) throw new FamilySignInError(body.error || 'That password isn’t right. Please try again.', res.status === 401 ? 'wrong' : 'offline');
  saveToken(body.token || null);
}

export function familySignOut() {
  saveToken(null);
  window.dispatchEvent(new Event(FAMILY_SIGNED_OUT));
}
