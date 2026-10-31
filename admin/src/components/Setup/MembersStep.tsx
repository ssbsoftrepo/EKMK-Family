import React, { useMemo, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { familyApi } from '../../api/familyApi';
import { FamilyMember } from '../../types/family';
import { birthYear, placedIds } from '../../lib/treeQuestions';
import { MemberEditor } from './MemberEditor';
import { Face, StepTitle, btnPrimary, btnSecondary } from './ui';

type Filter = 'all' | 'photo' | 'tree' | 'details' | 'memory';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'photo', label: 'No photo yet' },
  { id: 'tree', label: 'Not on the tree yet' },
  { id: 'details', label: 'Missing birthday' },
  { id: 'memory', label: 'In loving memory' },
];

/** Everyone in the family as photos. Tap a person to change their details, photo or family links. */
export const MembersStep: React.FC = () => {
  const { members, refreshData } = useAdmin();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const placed = useMemo(() => placedIds(members), [members]);
  const counts = useMemo(() => ({
    all: members.length,
    photo: members.filter((m) => !m.photoUrl).length,
    tree: members.filter((m) => !placed.has(m.id)).length,
    details: members.filter((m) => !m.birthDate).length,
    memory: members.filter((m) => m.isDeceased).length,
  }), [members, placed]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return members
      .filter((m) => filter !== 'photo' || !m.photoUrl)
      .filter((m) => filter !== 'tree' || !placed.has(m.id))
      .filter((m) => filter !== 'details' || !m.birthDate)
      .filter((m) => filter !== 'memory' || m.isDeceased)
      .filter((m) => !s || [m.fullName, m.tamilName, m.currentCity, m.phone].some((v) => v?.toLowerCase().includes(s)))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, placed, q, filter]);

  const open = members.find((m) => m.id === openId);
  if (open) return <MemberEditor member={open} onBack={() => setOpenId(null)} onOpen={(id) => { setOpenId(id); window.scrollTo({ top: 0 }); }} />;

  const add = async () => {
    const fullName = newName.trim().replace(/\s+/g, ' ');
    if (!fullName) return;
    try {
      const words = fullName.split(' ');
      const created = await familyApi.createMember({
        fullName, firstName: words.reduce((a, b) => (b.replace(/\./g, '').length > a.replace(/\./g, '').length ? b : a), words[0]),
        lastName: '', tamilName: '', generation: 0, source: 'manual', childIds: [], spouseIds: [], tags: [],
      } as Partial<FamilyMember>);
      await refreshData();
      setAdding(false);
      setNewName('');
      setOpenId(created.id);
    } catch (e) {
      toast.error('Could not add', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <StepTitle step="everyone in one place" title="All members">Tap a person to change their details, photo or family links.</StepTitle>
        {!adding && <button type="button" className={btnPrimary} onClick={() => setAdding(true)}>+ Add a person</button>}
      </div>

      {adding && (
        <div className="bg-white rounded-[22px] p-4 flex flex-wrap items-end gap-3 border-[3px] border-album-turmeric">
          <label className="flex flex-col gap-1 flex-[1_1_260px] min-w-0">
            <span className="text-[15px] font-bold">Their full name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && add()}
              className="min-h-[52px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-lg text-album-leaf" />
          </label>
          <button type="button" className={btnPrimary} disabled={!newName.trim()} onClick={add}>Add and fill in details</button>
          <button type="button" className={btnSecondary} onClick={() => { setAdding(false); setNewName(''); }}>Cancel</button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 max-w-[520px]">
          <span className="text-[15px] font-bold">Find by name, town or phone</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type here…"
            className="min-h-[56px] rounded-[18px] border-2 border-album-leaf bg-white px-4 text-lg text-album-leaf" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 min-h-[46px] px-4 rounded-full border-2 border-album-leaf text-base font-bold ${filter === f.id ? 'bg-album-leaf text-white' : 'bg-white text-album-leaf'}`}>
              {f.label} <span className="opacity-80">({counts[f.id]})</span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="m-0 text-lg py-6">{members.length === 0 ? 'No one yet. Start with “Add people”.' : 'No one matches. Try another name or filter.'}</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {list.map((m) => (
            <button key={m.id} type="button" onClick={() => { setOpenId(m.id); window.scrollTo({ top: 0 }); }}
              className="text-left bg-white rounded-[20px] p-1.5 pb-2.5 flex flex-col gap-1 shadow-soft hover:shadow-pop-sm transition">
              <Face member={m} className="w-full aspect-square" rounded="rounded-[14px]" />
              <span className="text-[17px] font-extrabold leading-tight px-1">{m.fullName}</span>
              <span className="text-sm leading-tight px-1">
                {[birthYear(m) && `born ${birthYear(m)}`, m.isDeceased && 'in loving memory'].filter(Boolean).join(' · ') || m.currentCity || ' '}
              </span>
              {!placed.has(m.id) && <span className="font-hand text-[15px] text-album-terracotta px-1 leading-tight">not on the tree yet</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
