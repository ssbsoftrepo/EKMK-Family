import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildFamilyTreeLayout } from '../../utils/treeLayout';
import { Family, firstName, placedIds } from '../family';
import { reducedMotion } from '../magic';
import { href } from '../router';
import { Face, Hand, Icon, Svg } from '../ui';
import { TreeSwitch } from './FamilyPage';

const BRANCH_COLOURS = ['#C4502F', '#D99A00', '#5C8A4A', '#1E4636', '#B5652B', '#7A8F2C'];
const MIN = 0.3;
const TOP = 56; // room above the elders for their marigold
const MAX = 1.2;

/** The whole tree, elders at the top. Big "Bigger / Smaller" buttons instead of pinch gestures. */
export const TreePage: React.FC<{ family: Family; focusId?: string }> = ({ family, focusId }) => {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<string | undefined>(focusId);
  const [notFound, setNotFound] = useState(false);

  const onTree = useMemo(() => {
    const placed = placedIds(family.members);
    return family.members.filter((m) => placed.has(m.id));
  }, [family]);
  const layout = useMemo(() => buildFamilyTreeLayout(onTree, new Set(), null, null, focus ?? null), [onTree, focus]);
  const { bounds } = layout;

  // One colour per child of the elders, so you can see at a glance whose side of the family someone is on.
  const branchColour = useMemo(() => {
    const founders = family.founders();
    const heads = founders.length ? family.childrenOfCouple(founders[0], founders[1]) : [];
    const headOf = new Map<string, number>();
    heads.forEach((h, i) => {
      const queue = [h];
      while (queue.length) {
        const m = queue.pop()!;
        if (headOf.has(m.id)) continue;
        headOf.set(m.id, i);
        family.spouses(m).forEach((sp) => !headOf.has(sp.id) && headOf.set(sp.id, i));
        queue.push(...family.children(m));
      }
    });
    return (personId: string) => {
      const i = headOf.get(personId);
      return i === undefined ? '#1E4636' : BRANCH_COLOURS[i % BRANCH_COLOURS.length];
    };
  }, [family]);
  // Marigolds bloom, one generation at a time, from the elders down to the person you looked for.
  const trailPath = useMemo(() => {
    const onTreeIds = new Set(onTree.map((m) => m.id));
    const path: string[] = [];
    let cur = family.get(focus);
    while (cur && onTreeIds.has(cur.id) && path.length < 12 && !path.includes(cur.id)) {
      path.unshift(cur.id);
      const parents = family.parents(cur).filter((p) => onTreeIds.has(p.id));
      cur = parents.find((p) => p.gender === 'male') ?? parents[0];
    }
    return path;
  }, [family, onTree, focus]);
  const [litCount, setLitCount] = useState(0);
  useEffect(() => {
    if (reducedMotion()) { setLitCount(trailPath.length); return; }
    setLitCount(0);
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setLitCount(n);
      if (n >= trailPath.length) clearInterval(timer);
    }, 420);
    return () => clearInterval(timer);
  }, [trailPath]);
  const lit = new Set(trailPath.slice(0, litCount));
  const focusPerson = family.get(focus);

  const childAt = (x: number, y: number) =>
    layout.nodes.find((n) => Math.abs(n.x + n.width / 2 - x) < 2 && Math.abs(n.y - y) < 2)?.primary.id ?? '';

  // Start zoomed so the whole width fits the screen.
  useLayoutEffect(() => {
    if (scale !== null || !box.current || bounds.width <= 0) return;
    const fit = (box.current.clientWidth - 16) / bounds.width;
    setScale(Math.min(1, Math.max(MIN, fit)));
  }, [bounds.width, scale]);

  // Scroll the chosen person into the middle of the view.
  useEffect(() => {
    if (!focus || !box.current || scale === null) return;
    const node = layout.nodes.find((n) => n.primary.id === focus || n.spouse?.id === focus);
    if (!node) return;
    const cx = (node.x - bounds.minX + node.width / 2) * scale;
    const cy = (node.y - bounds.minY + TOP + node.height / 2) * scale;
    box.current.scrollTo({ left: cx - box.current.clientWidth / 2, top: cy - box.current.clientHeight / 2, behavior: 'smooth' });
  }, [focus, scale, layout, bounds]);

  const find = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const m = onTree.find((p) => p.fullName.toLowerCase().includes(q));
    setNotFound(!m);
    if (m) setFocus(m.id);
  };

  if (onTree.length === 0) {
    return (
      <div className="flex flex-col gap-5 max-w-[760px] mx-auto">
        <TreeSwitch current="tree" />
        <div className="py-12 text-center flex flex-col gap-2">
          <Hand className="text-2xl">coming soon</Hand>
          <span className="text-xl font-bold">The family tree is being put together. Please check back soon!</span>
        </div>
      </div>
    );
  }

  const s = scale ?? 0.6;
  const zoom = (by: number) => setScale((v) => Math.min(MAX, Math.max(MIN, Math.round(((v ?? 0.6) * by) * 100) / 100)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col leading-tight">
        <Hand className="text-xl">everyone, all together</Hand>
        <h1 className="m-0 text-[1.9rem] sm:text-[2.2rem] font-extrabold">Our whole family tree</h1>
      </div>
      <TreeSwitch current="tree" familyId={focusId} />

      <div className="flex flex-wrap gap-2.5 items-center">
        <button type="button" onClick={() => zoom(1.25)} className="min-h-[56px] px-5 rounded-2xl border-2 border-album-leaf bg-white font-extrabold text-[17px] flex items-center gap-1.5">
          <Svg icon={Icon.plus} className="w-5 h-5" stroke={2.6} /> Bigger
        </button>
        <button type="button" onClick={() => zoom(0.8)} className="min-h-[56px] px-5 rounded-2xl border-2 border-album-leaf bg-white font-extrabold text-[17px] flex items-center gap-1.5">
          <Svg icon={Icon.minus} className="w-5 h-5" stroke={2.6} /> Smaller
        </button>
        <form onSubmit={find} className="flex gap-2 flex-[1_1_260px] min-w-0">
          <label className="sr-only" htmlFor="tree-find">Find a name on the tree</label>
          <input id="tree-find" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setNotFound(false); }} placeholder="Find a name"
            className="flex-1 min-w-0 min-h-[56px] rounded-2xl border-2 border-album-leaf bg-white px-4 text-lg" />
          <button type="submit" className="min-h-[56px] px-5 rounded-2xl bg-album-terracotta text-white font-extrabold text-[17px]">Find</button>
        </form>
      </div>
      {notFound && <span className="text-lg font-bold" role="status">No one called “{query}” on the tree yet.</span>}

      <div ref={box} className="relative overflow-auto bg-white rounded-[22px] shadow-[0_8px_20px_rgba(30,70,54,0.14)] h-[68vh] min-h-[420px] overscroll-contain"
        aria-label="Family tree. Scroll to move around.">
        <div style={{ width: bounds.width * s, height: (bounds.height + TOP) * s }} className="relative">
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: bounds.width, height: bounds.height + TOP, transform: `scale(${s})` }}>
            <svg aria-hidden="true" className="absolute left-0 top-0" width={bounds.width} height={bounds.height + TOP}>
              {layout.edges.map((e) => {
                const fx = e.fromX - bounds.minX, fy = e.fromY - bounds.minY + TOP, tx = e.toX - bounds.minX, ty = e.toY - bounds.minY + TOP;
                const mid = (fy + ty) / 2;
                return <path key={e.id} d={`M${fx} ${fy} V${mid} H${tx} V${ty}`} fill="none" stroke={lit.has(childAt(e.toX, e.toY)) ? '#F2B705' : branchColour(childAt(e.toX, e.toY))} strokeWidth={lit.has(childAt(e.toX, e.toY)) ? 8 : e.isHighlighted ? 6 : 4} strokeLinejoin="round" />;
              })}
            </svg>
            {layout.nodes.map((n) => {
              const people = [n.primary, n.spouse].filter((p): p is NonNullable<typeof p> => !!p);
              const hit = people.some((p) => p.id === focus);
              const glowing = people.some((p) => lit.has(p.id));
              return (
                <div key={n.id} className={`absolute bg-white rounded-2xl p-2 flex gap-2 justify-center ${hit ? 'ring-[5px] ring-album-terracotta' : ''} ${glowing ? 'trail-glow' : ''}`}
                  style={{ left: n.x - bounds.minX, top: n.y - bounds.minY + TOP, width: n.width, height: n.height, border: `3px solid ${branchColour(n.primary.id)}` }}>
                  {glowing && <span aria-hidden="true" className="bloom absolute -top-10 left-1/2 -ml-6 text-[44px] leading-none">🌼</span>}
                  {people.map((p) => (
                    <a key={p.id} href={href.person(p.id)} className="no-underline text-album-leaf flex flex-col items-center gap-1 w-[136px]">
                      <Face member={p} className="w-[118px] h-[118px]" rounded="rounded-xl" />
                      <span className="text-[17px] font-extrabold leading-tight text-center line-clamp-2">{p.fullName}</span>
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {focusPerson && trailPath.length > 1 && litCount >= trailPath.length && (
        <Hand className="text-xl text-center magic-pop">🌼 a marigold trail from the elders to {firstName(focusPerson)}</Hand>
      )}
      <Hand className="text-lg text-center">tap any photo to open that person · scroll to move around</Hand>
    </div>
  );
};
