import { useEffect, useState } from 'react';

/**
 * Tiny hash router, so links work on any static host and can be shared on WhatsApp:
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
  | { page: 'family'; id?: string }
  | { page: 'tree'; id?: string }
  | { page: 'related'; id?: string };

export function parseRoute(hash: string): Route {
  const [page, raw] = hash.replace(/^#\/?/, '').split('/');
  const id = raw ? decodeURIComponent(raw) : undefined;
  switch (page) {
    case 'find': return { page: 'find' };
    case 'person': return id ? { page: 'person', id } : { page: 'find' };
    case 'family': return { page: 'family', id };
    case 'tree': return { page: 'tree', id };
    case 'related': return { page: 'related', id };
    default: return { page: 'home' };
  }
}

export const href = {
  home: () => '#/',
  find: () => '#/find',
  person: (id: string) => `#/person/${encodeURIComponent(id)}`,
  family: (id?: string) => (id ? `#/family/${encodeURIComponent(id)}` : '#/family'),
  tree: (id?: string) => (id ? `#/tree/${encodeURIComponent(id)}` : '#/tree'),
  related: (id?: string) => (id ? `#/related/${encodeURIComponent(id)}` : '#/related'),
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
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
