import { FamilyMember } from '../types/family';
import { Family, firstName } from './family';

/**
 * "How are we related?" — works out what `me` calls `them`.
 *
 * The shortest chain of links (parent, child, spouse) between the two is found
 * first. Common chains get their Tamil name (Chithappa, Athai, Mama, Anni…);
 * every answer also gets a plain description ("your appa's younger brother"),
 * so even unusual relations are explained.
 */

type Step = 'up' | 'down' | 'spouse';

export interface Relation {
  tamil?: string;      // e.g. சித்தப்பா
  term?: string;       // e.g. Chithappa
  description: string; // e.g. your appa's younger brother
  path: FamilyMember[]; // me … them
}

const male = (m: FamilyMember) => m.gender === 'male';
const female = (m: FamilyMember) => m.gender === 'female';

/** -1: a is older, 1: a is younger, 0: unknown. */
const ageOrder = (a: FamilyMember, b: FamilyMember) => {
  if (!a.birthDate || !b.birthDate || a.birthDate === b.birthDate) return 0;
  return a.birthDate < b.birthDate ? -1 : 1;
};

const T = (tamil: string, term: string) => ({ tamil, term });

/** Shortest chain of links; blood links are preferred over marriage links. */
function findPath(family: Family, from: FamilyMember, to: FamilyMember): { nodes: FamilyMember[]; steps: Step[] } | null {
  const dist = new Map<string, number>([[from.id, 0]]);
  const prev = new Map<string, { id: string; step: Step }>();
  const queue: { id: string; d: number }[] = [{ id: from.id, d: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.d - b.d);
    const { id, d } = queue.shift()!;
    if (id === to.id) break;
    if (d > (dist.get(id) ?? Infinity)) continue;
    const m = family.get(id)!;
    const next: [FamilyMember, Step, number][] = [
      ...family.parents(m).map((p) => [p, 'up', 1] as [FamilyMember, Step, number]),
      ...family.children(m).map((c) => [c, 'down', 1] as [FamilyMember, Step, number]),
      ...family.spouses(m).map((s) => [s, 'spouse', 1.5] as [FamilyMember, Step, number]),
    ];
    for (const [n, step, w] of next) {
      const nd = d + w;
      if (nd < (dist.get(n.id) ?? Infinity)) {
        dist.set(n.id, nd);
        prev.set(n.id, { id, step });
        queue.push({ id: n.id, d: nd });
      }
    }
  }
  if (!dist.has(to.id)) return null;
  const nodes: FamilyMember[] = [to];
  const steps: Step[] = [];
  let cur = to.id;
  while (cur !== from.id) {
    const p = prev.get(cur)!;
    steps.unshift(p.step);
    cur = p.id;
    nodes.unshift(family.get(cur)!);
  }
  return { nodes, steps };
}

/** Name for a blood relative `u` generations up and `d` down from me, through the chain `nodes`. */
function bloodTerm(nodes: FamilyMember[], u: number, d: number): { tamil: string; term: string } | null {
  const me = nodes[0];
  const them = nodes[nodes.length - 1];
  const m = male(them);
  const f = female(them);
  if (!m && !f) return null;

  if (d === 0) {
    if (u === 1) return m ? T('அப்பா', 'Appa') : T('அம்மா', 'Amma');
    if (u === 2) return m ? T('தாத்தா', 'Thatha') : T('பாட்டி', 'Paati');
    if (u === 3) return m ? T('கொள்ளுத் தாத்தா', 'Kollu Thatha') : T('கொள்ளுப் பாட்டி', 'Kollu Paati');
    return null;
  }
  if (u === 0) {
    if (d === 1) return m ? T('மகன்', 'Magan') : T('மகள்', 'Magal');
    if (d === 2) return m ? T('பேரன்', 'Peran') : T('பேத்தி', 'Pethi');
    if (d === 3) return m ? T('கொள்ளுப் பேரன்', 'Kollu Peran') : T('கொள்ளுப் பேத்தி', 'Kollu Pethi');
    return null;
  }
  const sibling = (person: FamilyMember, other: FamilyMember) => {
    const o = ageOrder(person, other); // person compared to other
    if (male(person)) return o === -1 ? T('அண்ணன்', 'Annan') : o === 1 ? T('தம்பி', 'Thambi') : T('சகோதரன்', 'Sagodharan');
    return o === -1 ? T('அக்கா', 'Akka') : o === 1 ? T('தங்கை', 'Thangai') : T('சகோதரி', 'Sagodhari');
  };
  if (u === 1 && d === 1) return sibling(them, me);
  if (u === 2 && d === 1) {
    const parent = nodes[1];
    const o = ageOrder(them, parent);
    if (male(parent)) {
      if (f) return T('அத்தை', 'Athai');
      return o === -1 ? T('பெரியப்பா', 'Periyappa') : o === 1 ? T('சித்தப்பா', 'Chithappa') : T('பெரியப்பா / சித்தப்பா', 'Periyappa / Chithappa');
    }
    if (female(parent)) {
      if (m) return T('மாமா', 'Mama');
      return o === -1 ? T('பெரியம்மா', 'Periyamma') : o === 1 ? T('சித்தி', 'Chithi') : T('பெரியம்மா / சித்தி', 'Periyamma / Chithi');
    }
    return null;
  }
  if (u === 1 && d === 2) {
    const sib = nodes[2];
    const sameAsMe = sib.gender && me.gender && sib.gender === me.gender;
    if (!sib.gender || !me.gender) return null;
    return sameAsMe ? (m ? T('மகன்', 'Magan') : T('மகள்', 'Magal')) : (m ? T('மருமகன்', 'Marumagan') : T('மருமகள்', 'Marumagal'));
  }
  if (u === 2 && d === 2) {
    const parent = nodes[1];
    const parentsSibling = nodes[3];
    if (!parent.gender || !parentsSibling.gender) return null;
    // Children of appa's brother or amma's sister are like brothers and sisters.
    if (parent.gender === parentsSibling.gender) return sibling(them, me);
    return m ? T('மச்சான்', 'Machan') : T('மச்சினி', 'Machini');
  }
  if (u === 3 && d === 1) return m ? T('தாத்தா', 'Thatha') : T('பாட்டி', 'Paati');
  return null;
}

/** Name for the husband or wife of a relative whose own name is `rel`. */
function spouseOfTerm(rel: string | undefined, them: FamilyMember, me: FamilyMember): { tamil: string; term: string } | null {
  if (!rel) return null;
  const m = male(them);
  switch (rel) {
    case 'Magan': return T('மருமகள்', 'Marumagal');
    case 'Magal': return T('மருமகன்', 'Marumagan');
    case 'Annan': return T('அண்ணி', 'Anni');
    case 'Thambi': return T('தம்பி மனைவி', 'Thambi’s wife');
    case 'Akka': return T('அத்திம்பேர்', 'Athimber');
    case 'Thangai': return me.gender === 'male' ? T('மச்சான்', 'Machan') : T('தங்கை கணவர்', 'Thangai’s husband');
    case 'Periyappa': return T('பெரியம்மா', 'Periyamma');
    case 'Chithappa': return T('சித்தி', 'Chithi');
    case 'Athai': return T('மாமா', 'Mama');
    case 'Mama': return T('அத்தை', 'Athai');
    case 'Periyamma': return T('பெரியப்பா', 'Periyappa');
    case 'Chithi': return T('சித்தப்பா', 'Chithappa');
    case 'Appa': return female(them) ? T('சித்தி', 'Chithi') : null;
    case 'Amma': return m ? T('சித்தப்பா', 'Chithappa') : null;
    default: return null;
  }
}

/** Name for a relative of my husband or wife. */
function inLawTerm(u: number, d: number, them: FamilyMember, me: FamilyMember, nodes: FamilyMember[]): { tamil: string; term: string } | null {
  const m = male(them);
  if (u === 1 && d === 0) return m ? T('மாமனார்', 'Mamanar') : T('மாமியார்', 'Mamiyar');
  if (u === 0 && d === 1) return m ? T('மகன்', 'Magan') : T('மகள்', 'Magal');
  if (u === 1 && d === 1) {
    if (me.gender === 'male') return m ? T('மச்சான்', 'Machan') : T('மச்சினி', 'Machini');
    if (me.gender === 'female') return m ? T('கொழுந்தன்', 'Kozhundhan') : T('நாத்தனார்', 'Nathanar');
  }
  if (u === 1 && d === 2) {
    // Your husband's or wife's nephew or niece: called the way your spouse calls them.
    // Children of their brother if they are a man (or of their sister if a woman) are like your own;
    // children of the other ones are Marumagan / Marumagal.
    const spouse = nodes[1];
    const spousesSibling = nodes[3];
    if (!spouse?.gender || !spousesSibling?.gender || (!m && !female(them))) return null;
    return spouse.gender === spousesSibling.gender
      ? (m ? T('மகன்', 'Magan') : T('மகள்', 'Magal'))
      : (m ? T('மருமகன்', 'Marumagan') : T('மருமகள்', 'Marumagal'));
  }
  return null;
}

/** "your appa's younger brother's wife" */
function describe(nodes: FamilyMember[], steps: Step[]): string {
  const words: string[] = [];
  let i = 0;
  while (i < steps.length) {
    const from = nodes[i];
    const to = nodes[i + 1];
    if (steps[i] === 'up' && steps[i + 1] === 'down') {
      // Up to a parent and straight down again: a brother or sister.
      const sib = nodes[i + 2];
      const o = ageOrder(sib, from);
      const age = o === -1 ? 'elder ' : o === 1 ? 'younger ' : '';
      words.push(age + (male(sib) ? 'brother' : female(sib) ? 'sister' : 'brother or sister'));
      i += 2;
      continue;
    }
    if (steps[i] === 'up') words.push(male(to) ? 'appa' : female(to) ? 'amma' : 'parent');
    if (steps[i] === 'down') words.push(male(to) ? 'son' : female(to) ? 'daughter' : 'child');
    if (steps[i] === 'spouse') words.push(male(to) ? 'husband' : female(to) ? 'wife' : 'spouse');
    i += 1;
  }
  return `your ${words.join('’s ')}`;
}

export function relate(family: Family, me: FamilyMember, them: FamilyMember): Relation | null {
  if (me.id === them.id) return { description: 'that’s you!', path: [me] };
  const found = findPath(family, me, them);
  if (!found) return null;
  const { nodes, steps } = found;
  const description = describe(nodes, steps);

  const ups = (s: Step[]) => { let n = 0; while (s[n] === 'up') n++; return n; };
  const isBlood = (s: Step[]) => {
    const u = ups(s);
    return s.slice(u).every((x) => x === 'down') ? { u, d: s.length - u } : null;
  };

  let name: { tamil: string; term: string } | null = null;
  if (steps.length === 1 && steps[0] === 'spouse') {
    name = male(them) ? T('கணவர்', 'Kanavar') : female(them) ? T('மனைவி', 'Manaivi') : null;
  } else if (isBlood(steps)) {
    const { u, d } = isBlood(steps)!;
    name = bloodTerm(nodes, u, d);
  } else if (steps[steps.length - 1] === 'spouse' && isBlood(steps.slice(0, -1))) {
    const { u, d } = isBlood(steps.slice(0, -1))!;
    const relName = bloodTerm(nodes.slice(0, -1), u, d);
    name = spouseOfTerm(relName?.term.split(' / ')[0], them, me);
  } else if (steps[0] === 'spouse' && isBlood(steps.slice(1))) {
    const { u, d } = isBlood(steps.slice(1))!;
    name = inLawTerm(u, d, them, me, nodes);
  }
  return { ...(name ?? {}), description, path: nodes };
}

export const callThem = (r: Relation, them: FamilyMember) =>
  r.term ? `Call ${firstName(them)} “${r.term.split(' / ')[0]}”` : null;
