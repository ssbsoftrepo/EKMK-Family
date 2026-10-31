import { FamilyMember } from '../types/family';

/**
 * Everything the "Build the tree" step asks is worked out from the saved relations,
 * so closing the browser loses nothing: the next visit continues where you left off.
 *
 * Only two kinds of links are ever set: parent → child and husband ↔ wife.
 * Every other relation (Athai, Mama, Chithappa…) is derived from those.
 */

export type Question =
  | { kind: 'founders'; key: string }
  | { kind: 'gender'; key: string; person: FamilyMember }
  | { kind: 'spouse'; key: string; person: FamilyMember }
  | { kind: 'children'; key: string; parents: FamilyMember[] }
  | { kind: 'where'; key: string; person: FamilyMember };

export interface Candidate {
  member: FamilyMember;
  score: number;
  clue?: string;
}

/** A couple (or a single parent) that new children can be added to. */
export interface Family {
  key: string;
  parents: FamilyMember[];
}

const thisYear = new Date().getFullYear();

export const firstName = (m: FamilyMember) => m.firstName || m.fullName?.split(' ')[0] || 'Someone';

export const birthYear = (m: FamilyMember): number | null => {
  const y = m.birthDate ? parseInt(m.birthDate.slice(0, 4), 10) : NaN;
  return Number.isFinite(y) && y > 1800 ? y : null;
};

/** Husband first, the way families are usually named ("Thatha & Paati"). */
export const coupleOrder = (a: FamilyMember, b: FamilyMember): FamilyMember[] =>
  a.gender === 'female' && b.gender !== 'female' ? [b, a] : [a, b];

export const familyLabel = (parents: FamilyMember[]) => parents.map(firstName).join(' & ');

/** People connected (through any link) to the elders at the top of the tree. */
export function placedIds(members: FamilyMember[]): Set<string> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const queue = members.filter((m) => m.generation === 1).map((m) => m.id);
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    const m = byId.get(id);
    if (!m) continue;
    seen.add(id);
    const links = [m.fatherId, m.motherId, ...(m.spouseIds ?? []), m.spouseId, ...(m.childIds ?? [])];
    links.forEach((l) => l && byId.has(l) && !seen.has(l) && queue.push(l));
  }
  // Children point to parents but a parent may not list the child yet: catch those too.
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of members) {
      if (seen.has(m.id)) continue;
      if ((m.fatherId && seen.has(m.fatherId)) || (m.motherId && seen.has(m.motherId))) {
        seen.add(m.id);
        grew = true;
      }
    }
  }
  return seen;
}

const spousesOf = (m: FamilyMember, byId: Map<string, FamilyMember>) =>
  Array.from(new Set([...(m.spouseIds ?? []), ...(m.spouseId ? [m.spouseId] : [])]))
    .map((id) => byId.get(id))
    .filter((x): x is FamilyMember => !!x);

const hasChildren = (m: FamilyMember, members: FamilyMember[]) =>
  (m.childIds?.length ?? 0) > 0 || members.some((c) => c.fatherId === m.id || c.motherId === m.id);

/** Young people are not asked about marriage or children. */
const isChild = (m: FamilyMember) => {
  const y = birthYear(m);
  return y !== null && thisYear - y < 18;
};

const byAge = (a: FamilyMember, b: FamilyMember) =>
  a.generation - b.generation || (a.birthDate ?? '9999').localeCompare(b.birthDate ?? '9999') || a.fullName.localeCompare(b.fullName);

/** Every question still open, in the order a person would naturally go down the tree. */
export function openQuestions(members: FamilyMember[]): Question[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  if (!members.some((m) => m.generation === 1)) return [{ kind: 'founders', key: 'founders' }];

  const placed = placedIds(members);
  const people = members.filter((m) => placed.has(m.id)).sort(byAge);
  const questions: Question[] = [];
  const askedCouples = new Set<string>();

  for (const p of people) {
    if (!p.gender) questions.push({ kind: 'gender', key: `gender:${p.id}`, person: p });
    const spouses = spousesOf(p, byId);
    if (spouses.length === 0 && !p.noSpouse && !p.isDeceased && !isChild(p)) {
      questions.push({ kind: 'spouse', key: `spouse:${p.id}`, person: p });
    }
    for (const s of spouses) {
      const coupleKey = [p.id, s.id].sort().join('+');
      if (askedCouples.has(coupleKey)) continue;
      askedCouples.add(coupleKey);
      // Father and mother can only be told apart once at least one of them is known to be a man or a woman.
      if (!p.gender && !s.gender) continue;
      if (!p.noChildren && !s.noChildren && !hasChildren(p, members) && !hasChildren(s, members)) {
        questions.push({ kind: 'children', key: `children:${coupleKey}`, parents: coupleOrder(p, s) });
      }
    }
  }
  return questions;
}

/** Families on the tree that a new person could be the child of. */
export function familiesOnTree(members: FamilyMember[]): Family[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const placed = placedIds(members);
  const out: Family[] = [];
  const seen = new Set<string>();
  for (const p of members.filter((m) => placed.has(m.id)).sort(byAge)) {
    const spouses = spousesOf(p, byId);
    if (spouses.length === 0) {
      if (!seen.has(p.id)) out.push({ key: p.id, parents: [p] });
      seen.add(p.id);
      continue;
    }
    for (const s of spouses) {
      const key = [p.id, s.id].sort().join('+');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, parents: coupleOrder(p, s) });
    }
  }
  return out;
}

const norm = (s?: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9஀-௿]/g, '');
const nameMatches = (typed: string | undefined, m: FamilyMember) => {
  const t = norm(typed);
  const f = norm(firstName(m));
  return t.length > 1 && f.length > 1 && (t.includes(f) || f.includes(t));
};

interface Reason { points: number; text: string }

function sharedDetails(x: FamilyMember, other: FamilyMember): Reason[] {
  const reasons: Reason[] = [];
  if (x.address && other.address && norm(x.address) === norm(other.address)) reasons.push({ points: 3, text: `same address as ${firstName(other)}` });
  if (x.phone && other.phone && x.phone === other.phone) reasons.push({ points: 3, text: `same phone as ${firstName(other)}` });
  if (x.currentCity && other.currentCity && norm(x.currentCity) === norm(other.currentCity)) reasons.push({ points: 1, text: `also lives in ${x.currentCity}` });
  return reasons;
}

function best(reasons: Reason[]): { score: number; clue?: string } {
  const score = reasons.reduce((n, r) => n + r.points, 0);
  const top = reasons.filter((r) => r.points > 0).sort((a, b) => b.points - a.points)[0];
  return { score, clue: top?.text };
}

/** How likely x is a child of these parents, with the reason to show the admin. */
export function childClue(x: FamilyMember, parents: FamilyMember[]): { score: number; clue?: string } {
  const reasons: Reason[] = [];
  for (const p of parents) {
    if (nameMatches(x.formFatherName, p) || nameMatches(x.formMotherName, p)) reasons.push({ points: 6, text: `the form names ${firstName(p)} as a parent` });
    reasons.push(...sharedDetails(x, p));
    const initials = x.fullName.split(' ').filter((w) => w.replace(/\./g, '').length <= 2).join('').replace(/\./g, '');
    if (p.gender === 'male' && initials.toUpperCase().includes(firstName(p)[0]?.toUpperCase())) {
      reasons.push({ points: 1, text: `initial ${firstName(p)[0].toUpperCase()}, like ${firstName(p)}` });
    }
    const xy = birthYear(x);
    const py = birthYear(p);
    if (xy && py && (xy - py < 14 || xy - py > 60)) reasons.push({ points: -8, text: '' });
  }
  return best(reasons);
}

/** How likely x is married to p. */
export function spouseClue(x: FamilyMember, p: FamilyMember): { score: number; clue?: string } {
  const reasons: Reason[] = [];
  if (nameMatches(x.formSpouseName, p) || nameMatches(p.formSpouseName, x)) reasons.push({ points: 6, text: `the form names ${firstName(p)} as spouse` });
  reasons.push(...sharedDetails(x, p));
  const xy = birthYear(x);
  const py = birthYear(p);
  if (xy && py && Math.abs(xy - py) > 20) reasons.push({ points: -8, text: '' });
  if (x.gender && p.gender && x.gender === p.gender) reasons.push({ points: -2, text: '' });
  return best(reasons);
}

export function rankCandidates(pool: FamilyMember[], scoreOf: (x: FamilyMember) => { score: number; clue?: string }): Candidate[] {
  return pool
    .map((member) => ({ member, ...scoreOf(member) }))
    .sort((a, b) => b.score - a.score || a.member.fullName.localeCompare(b.member.fullName));
}

export function questionText(q: Question): string {
  switch (q.kind) {
    case 'founders': return 'Who is at the very top of the tree?';
    case 'gender': return `Is ${firstName(q.person)} a man or a woman?`;
    case 'spouse': return `Who is ${firstName(q.person)} married to?`;
    case 'children': return `Who are the children of ${familyLabel(q.parents)}?`;
    case 'where': return `Where does ${firstName(q.person)} fit in the family?`;
  }
}

/** Short wording for the reminder list. */
export function reminderText(q: Question): string {
  switch (q.kind) {
    case 'founders': return 'Add the elders at the top of the tree';
    case 'gender': return `Is ${firstName(q.person)} a man or a woman?`;
    case 'spouse': return `Is ${firstName(q.person)} married?`;
    case 'children': return `Does ${familyLabel(q.parents)} have children?`;
    case 'where': return `Where does ${firstName(q.person)} fit?`;
  }
}

/** Father and mother ids for children of these parents (works out a missing gender from the spouse). */
export function parentIds(parents: FamilyMember[]): { fatherId?: string; motherId?: string } {
  const [a, b] = parents;
  const genderOf = (m: FamilyMember, other?: FamilyMember) =>
    m.gender === 'male' || m.gender === 'female'
      ? m.gender
      : other && (other.gender === 'male' || other.gender === 'female')
        ? (other.gender === 'male' ? 'female' : 'male')
        : undefined;
  const out: { fatherId?: string; motherId?: string } = {};
  for (const [m, other] of [[a, b], [b, a]] as [FamilyMember | undefined, FamilyMember | undefined][]) {
    if (!m) continue;
    const g = genderOf(m, other);
    if (g === 'male' && !out.fatherId) out.fatherId = m.id;
    else if (g === 'female' && !out.motherId) out.motherId = m.id;
  }
  return out;
}
