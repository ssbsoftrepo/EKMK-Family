import { FamilyMember } from '../types/family';

/** Small helpers over the member list. Relations are read from both sides, so one-sided links still count. */

export const firstName = (m: FamilyMember) => {
  return m.fullName || m.firstName || 'Someone';
};

export const birthYear = (m: FamilyMember): number | null => {
  const y = m.birthDate ? parseInt(m.birthDate.slice(0, 4), 10) : NaN;
  return Number.isFinite(y) && y > 1800 ? y : null;
};

export class Family {
  readonly byId: Map<string, FamilyMember>;

  constructor(readonly members: FamilyMember[]) {
    this.byId = new Map(members.map((m) => [m.id, m]));
  }

  get(id?: string | null) {
    return id ? this.byId.get(id) : undefined;
  }

  parents(m: FamilyMember): FamilyMember[] {
    return [this.get(m.fatherId), this.get(m.motherId)].filter((x): x is FamilyMember => !!x);
  }

  spouses(m: FamilyMember): FamilyMember[] {
    const ids = new Set([...(m.spouseIds ?? []), ...(m.spouseId ? [m.spouseId] : [])]);
    for (const o of this.members) {
      if (o.spouseId === m.id || o.spouseIds?.includes(m.id)) ids.add(o.id);
    }
    ids.delete(m.id);
    return Array.from(ids).map((id) => this.get(id)).filter((x): x is FamilyMember => !!x);
  }

  children(m: FamilyMember): FamilyMember[] {
    const ids = new Set(m.childIds ?? []);
    for (const o of this.members) if (o.fatherId === m.id || o.motherId === m.id) ids.add(o.id);
    return byAge(Array.from(ids).map((id) => this.get(id)).filter((x): x is FamilyMember => !!x));
  }

  /** Children of a couple (or of one parent when alone). */
  childrenOfCouple(a: FamilyMember, b?: FamilyMember): FamilyMember[] {
    const kids = this.children(a);
    if (!b) return kids;
    const ids = new Set(kids.map((k) => k.id));
    return byAge([...kids, ...this.children(b).filter((k) => !ids.has(k.id))]);
  }

  siblings(m: FamilyMember): FamilyMember[] {
    const ids = new Set<string>();
    for (const p of this.parents(m)) for (const c of this.children(p)) if (c.id !== m.id) ids.add(c.id);
    return byAge(Array.from(ids).map((id) => this.get(id)!));
  }

  /** The elders at the top of the tree, husband first. */
  founders(): FamilyMember[] {
    const top = this.members.filter((m) => m.generation === 1);
    if (top.length === 0) return [];
    const first = top.find((m) => m.gender === 'male') ?? top[0];
    const partner = this.spouses(first).find((s) => s.generation === 1) ?? top.find((m) => m.id !== first.id);
    return partner ? [first, partner] : [first];
  }

  /** Husband first, the way families are usually named. */
  couple(m: FamilyMember): FamilyMember[] {
    const s = this.spouses(m)[0];
    if (!s) return [m];
    return m.gender === 'female' && s.gender !== 'female' ? [s, m] : [m, s];
  }

  /** Is this person a child or grandchild of the founders (rather than married into the family)? */
  isBornInto(m: FamilyMember) {
    return m.generation === 1 || this.parents(m).length > 0;
  }

  /**
   * Direct children of the 1st generation (founders/elders).
   * Dynamically collects all children of generation 1 members, excluding spouses.
   */
  firstGenChildren(): FamilyMember[] {
    const gen1 = this.members.filter((m) => m.generation === 1);
    const gen1Ids = new Set(gen1.map((m) => m.id));
    const seen = new Set<string>();
    const list: FamilyMember[] = [];

    // 1. Children linked to Gen 1 elders via this.children(elder)
    for (const elder of gen1) {
      for (const child of this.children(elder)) {
        if (!seen.has(child.id)) {
          seen.add(child.id);
          list.push(child);
        }
      }
    }

    // 2. Members whose fatherId or motherId points to a Gen 1 elder
    for (const m of this.members) {
      if (!seen.has(m.id)) {
        const isChildOfGen1 =
          (m.fatherId && gen1Ids.has(m.fatherId)) ||
          (m.motherId && gen1Ids.has(m.motherId));
        if (isChildOfGen1) {
          seen.add(m.id);
          list.push(m);
        }
      }
    }

    // 3. Fallback: generation === 2 born into the family (not a married-in spouse)
    if (list.length === 0) {
      for (const m of this.members.filter((m) => m.generation === 2)) {
        if (!seen.has(m.id)) {
          const spouseHasParents = this.spouses(m).some((s) => this.parents(s).length > 0);
          if (this.parents(m).length > 0 || !spouseHasParents || this.isBornInto(m)) {
            seen.add(m.id);
            list.push(m);
          }
        }
      }
    }

    return byAge(list);
  }
}

/** Helper to parse a date into comparable YYYY-MM-DD format. */
export function parseBirthComparable(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  if (s.length < 4) return null;
  if (/^\d{4}/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

/** Sort in age order: eldest first (earliest birth date), youngest last. Members with unknown birth dates follow. */
export const byAge = (list: FamilyMember[]) =>
  [...list].sort((a, b) => {
    const da = parseBirthComparable(a.birthDate);
    const db = parseBirthComparable(b.birthDate);
    if (da && db) {
      const cmp = da.localeCompare(db);
      if (cmp !== 0) return cmp;
    } else if (da && !db) {
      return -1;
    } else if (!da && db) {
      return 1;
    }
    return a.fullName.localeCompare(b.fullName);
  });

export const coupleLabel = (people: FamilyMember[]) => people.map(firstName).join(' & ');

/** Today's birthdays (day and month only; ages are never shown). */
export const birthdaysOn = (members: FamilyMember[], date = new Date()) => {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return members.filter((m) => !m.isDeceased && m.birthDate?.slice(5, 10) === mmdd);
};

/** Birthdays in the next `days` days, soonest first, with the date they fall on. */
export const upcomingBirthdays = (members: FamilyMember[], days = 31, from = new Date()) => {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const out: { member: FamilyMember; date: Date; inDays: number }[] = [];
  for (const m of members) {
    if (m.isDeceased || !m.birthDate || m.birthDate.length < 10) continue;
    const month = parseInt(m.birthDate.slice(5, 7), 10) - 1;
    const day = parseInt(m.birthDate.slice(8, 10), 10);
    if (!Number.isFinite(month) || !Number.isFinite(day)) continue;
    let next = new Date(start.getFullYear(), month, day);
    if (next < start) next = new Date(start.getFullYear() + 1, month, day);
    const inDays = Math.round((next.getTime() - start.getTime()) / 86400000);
    if (inDays <= days) out.push({ member: m, date: next, inDays });
  }
  return out.sort((a, b) => a.inDays - b.inDays || a.member.fullName.localeCompare(b.member.fullName));
};

/** People connected (through any link) to the elders at the top of the tree. Others are still waiting for the admin. */
export function placedIds(members: FamilyMember[]): Set<string> {
  const family = new Family(members);
  const seen = new Set<string>();
  const queue = members.filter((m) => m.generation === 1).map((m) => m.id);
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    const m = family.get(id);
    if (!m) continue;
    seen.add(id);
    for (const n of [...family.parents(m), ...family.spouses(m), ...family.children(m)]) if (!seen.has(n.id)) queue.push(n.id);
  }
  return seen;
}

/** A short line saying who someone is, showing full names, e.g. "Ravi Kumar's son" or "Mani's wife". */
export function whoLine(family: Family, m: FamilyMember): string {
  const parent = family.parents(m).find((p) => p.gender === 'male') ?? family.parents(m)[0];
  if (parent) return `${parent.fullName}’s ${m.gender === 'female' ? 'daughter' : m.gender === 'male' ? 'son' : 'child'}`;
  const spouse = family.spouses(m)[0];
  if (spouse) return `${spouse.fullName}’s ${m.gender === 'female' ? 'wife' : m.gender === 'male' ? 'husband' : 'spouse'}`;
  if (m.generation === 1) return 'Family elder';
  return m.currentCity ?? '';
}
