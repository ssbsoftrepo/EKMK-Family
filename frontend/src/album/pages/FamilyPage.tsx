import React from 'react';
import { Family, coupleLabel, firstName } from '../family';
import { href } from '../router';
import { Face, Hand, Icon, Print, Svg } from '../ui';

/** Tree switch shown on both tree pages. */
export const TreeSwitch: React.FC<{ current: 'family' | 'tree'; familyId?: string }> = ({ current, familyId }) => (
  <nav aria-label="How to see the tree" className="grid grid-cols-2 gap-1 bg-white border-2 border-album-leaf rounded-full p-1 max-w-[460px]">
    {([['family', href.family(familyId), 'One family', 'ஒரு குடும்பம்'], ['tree', href.tree(familyId), 'Whole tree', 'முழு மரம்']] as const).map(([id, to, en, ta]) => (
      <a key={id} href={to} aria-current={current === id ? 'page' : undefined}
        className={`no-underline rounded-full min-h-[52px] flex flex-col items-center justify-center leading-tight ${current === id ? 'bg-album-leaf text-white' : 'text-album-leaf'}`}>
        <span className="text-[17px] font-extrabold">{en}</span>
        <span lang="ta" className="text-xs">{ta}</span>
      </a>
    ))}
  </nav>
);

/** One family at a time: the couple's photos, then their children. Tap a child to go one step down. */
export const FamilyPage: React.FC<{ family: Family; id?: string }> = ({ family, id }) => {
  const person = family.get(id) ?? family.founders()[0];
  if (!person) {
    return (
      <div className="py-16 text-center flex flex-col gap-2">
        <Hand className="text-2xl">coming soon</Hand>
        <span className="text-xl font-bold">The family tree is being put together. Please check back soon!</span>
      </div>
    );
  }
  const couple = family.couple(person);
  const kids = family.childrenOfCouple(couple[0], couple[1]);
  const bornIn = couple.find((p) => family.parents(p).length > 0);
  const up = bornIn ? family.couple(family.parents(bornIn)[0]) : null;
  const isTop = couple.some((p) => p.generation === 1);

  return (
    <div className="flex flex-col gap-5 max-w-[760px] mx-auto">
      <div className="flex flex-col leading-tight">
        <Hand className="text-xl">{isTop ? 'where it all began' : 'one family at a time'}</Hand>
        <h1 className="m-0 text-[1.9rem] sm:text-[2.2rem] font-extrabold">{coupleLabel(couple)}'s family</h1>
      </div>
      <TreeSwitch current="family" familyId={id} />

      {up && (
        <a href={href.family(up[0].id)} className="no-underline self-start text-album-leaf bg-white rounded-full min-h-[48px] pl-3 pr-4 flex items-center gap-1.5 text-base font-bold border-2 border-album-leaf">
          <Svg icon={Icon.back} className="w-5 h-5" stroke={2.4} /> Up to {coupleLabel(up)}'s family
        </a>
      )}

      <Print tilt={-1} className="mt-2">
        <div className={`grid gap-2.5 relative ${couple.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[260px] mx-auto'}`}>
          {couple.map((p) => (
            <a key={p.id} href={href.person(p.id)} className="no-underline text-album-leaf flex flex-col gap-1">
              <Face member={p} className="w-full aspect-[4/5]" rounded="rounded-md" />
              <span className="text-lg font-extrabold text-center leading-tight">{p.fullName}</span>
            </a>
          ))}
          {couple.length === 2 && (
            <span aria-hidden="true" className="absolute left-1/2 top-[38%] -ml-5 w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl">❤️</span>
          )}
        </div>
      </Print>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-col leading-tight">
          <h2 className="m-0 text-[1.4rem] font-extrabold">Their children</h2>
          <span lang="ta" className="text-[15px]">அவர்களின் பிள்ளைகள்</span>
        </div>
        {kids.length === 0 && <span className="text-lg">No children on the tree yet.</span>}
        {kids.map((k) => {
          const kc = family.couple(k);
          const grandkids = family.childrenOfCouple(kc[0], kc[1]).length;
          const hasFamily = kc.length > 1 || grandkids > 0;
          return (
            <a key={k.id} href={hasFamily ? href.family(k.id) : href.person(k.id)}
              className="no-underline text-album-leaf bg-white rounded-[20px] p-2 pr-3.5 min-h-[88px] flex items-center gap-3 shadow-[0_3px_0_#DCE6D2] lift">
              <span className="flex -space-x-3 flex-shrink-0">
                {kc.map((p) => <Face key={p.id} member={p} className="w-[66px] h-[66px]" rounded="rounded-2xl" ring="border-[3px] border-white" />)}
              </span>
              <span className="flex-1 min-w-0 flex flex-col leading-tight">
                <span className="text-[19px] font-extrabold">{coupleLabel(kc)}</span>
                <span className="text-[15px]">{grandkids > 0 ? `${grandkids} ${grandkids === 1 ? 'child' : 'children'}` : kc.length > 1 ? 'married' : firstName(k) + (k.currentCity ? ` · ${k.currentCity}` : '')}</span>
              </span>
              <span className="text-[15px] font-bold text-album-terracotta flex items-center flex-shrink-0">
                {hasFamily ? 'See family' : 'See profile'}<Svg icon={Icon.next} className="w-5 h-5" stroke={2.4} />
              </span>
            </a>
          );
        })}
      </section>
      <Hand className="text-lg text-center">tap a family to go one step down the tree</Hand>
    </div>
  );
};
