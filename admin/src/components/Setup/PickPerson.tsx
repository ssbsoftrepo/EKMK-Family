import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyMember } from '../../types/family';
import { birthYear } from '../../lib/treeQuestions';
import { Face, btnSecondary } from './ui';

/** A full-screen "tap a photo" chooser, used to add a parent, husband or wife, or child. */
export const PickPerson: React.FC<{
  title: string;
  people: FamilyMember[];
  onPick: (m: FamilyMember) => void;
  onClose: () => void;
}> = ({ title, people, onPick, onClose }) => {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return people.filter((m) => !s || m.fullName.toLowerCase().includes(s)).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [people, q]);

  return (
    <div className="fixed inset-0 z-[9000] bg-album-leaf/50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="bg-album-paper w-full sm:max-w-[760px] max-h-[88vh] rounded-t-[26px] sm:rounded-[26px] flex flex-col font-album text-album-leaf">
        <div className="p-4 sm:p-5 flex flex-col gap-3 border-b-2 border-album-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 font-album text-[1.5rem] font-extrabold" style={{ letterSpacing: 0 }}>{title}</h2>
            <button type="button" className={`${btnSecondary} min-h-[48px]`} onClick={onClose}>Cancel</button>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[15px] font-bold">Find by name</span>
            <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name…"
              className="min-h-[52px] rounded-2xl border-2 border-album-leaf bg-white px-4 text-lg text-album-leaf" />
          </label>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">
          {list.length === 0 && <p className="m-0 text-lg">No one found. Add them on the “Add people” step first.</p>}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {list.map((m) => (
              <button key={m.id} type="button" onClick={() => onPick(m)}
                className="text-left bg-white rounded-[18px] p-1.5 pb-2.5 flex flex-col gap-1 border-2 border-album-line hover:border-album-leaf">
                <Face member={m} className="w-full aspect-square" rounded="rounded-[13px]" />
                <span className="text-base font-extrabold leading-tight px-1">{m.fullName}</span>
                {birthYear(m) && <span className="text-sm px-1">born {birthYear(m)}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
