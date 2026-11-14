import { useEffect, useState } from 'react';

/**
 * Tiny hash router, so links work on any static host and can be shared:
 *   #/            home
 *   #/find        find a relative
 *   #/person/ID   one person
 *   #/family/ID   one family at a time (ID = either parent; empty = the elders)
 *   #/tree        the whole tree
 *   #/related/ID  how is ID related to me?
 */
export type Route =
  | { page: 'home' }
  | { page: 'find' }
  | { page: 'person'; id: string }
  | { page: 'related'; id?: string };

export function parseRoute(hash: string): Route {
  const [page, raw] = hash.replace(/^#\/?/, '').split('/');
  const id = raw ? decodeURIComponent(raw) : undefined;
  switch (page) {
    case 'find': return { page: 'find' };
    case 'person': return id ? { page: 'person', id } : { page: 'find' };
    case 'related': return { page: 'related', id };
    case 'family':
    case 'tree':
      if (typeof window !== 'undefined') {
        window.location.hash = '#/';
      }
      return { page: 'home' };
    default: return { page: 'home' };
  }
}

export const href = {
  home: () => '#/',
  find: () => '#/find',
  person: (id: string) => `#/person/${encodeURIComponent(id)}`,
  family: () => '#/',
  tree: () => '#/',
  related: (id?: string) => (id ? `#/related/${encodeURIComponent(id)}` : '#/related'),
};

const NAV_STACK_KEY = 'kmk_nav_history_stack';

function getNavStack(): string[] {
  try {
    const raw = sessionStorage.getItem(NAV_STACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushNavStack(hash: string) {
  try {
    const cleanHash = hash || '#/';
    const stack = getNavStack();
    if (stack[stack.length - 1] !== cleanHash) {
      stack.push(cleanHash);
      if (stack.length > 30) stack.shift();
      sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack));
    }
  } catch {}
}

/**
 * Robust in-app back navigation for mobiles and desktops.
 * Takes the user back to their previous internal page in this session,
 * or gracefully falls back to the find/home page.
 */
export function navigateBack(fallback = '#/find') {
  if (typeof window === 'undefined') return;
  try {
    const stack = getNavStack();
    if (stack.length > 1) {
      stack.pop(); // remove current page
      const prev = stack.pop(); // previous page to return to
      sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack));
      if (prev && prev !== window.location.hash) {
        window.location.hash = prev;
        return;
      }
    }
  } catch {}
  window.location.hash = fallback;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    pushNavStack(window.location.hash);
    const onChange = () => {
      pushNavStack(window.location.hash);
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** Remembers who is using this phone, for "How are we related?". Only stored on this device. */
const ME_KEY = 'kmk-family-me';
export const rememberMe = {
  get(): string | null {
    try { return window.localStorage.getItem(ME_KEY); } catch { return null; }
  },
  set(id: string | null) {
    try {
      if (id) window.localStorage.setItem(ME_KEY, id);
      else window.localStorage.removeItem(ME_KEY);
    } catch { /* private mode: just not remembered */ }
  },
};
