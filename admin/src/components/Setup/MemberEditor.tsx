import React, { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { familyApi } from '../../api/familyApi';
import { FamilyMember } from '../../types/family';
import { firstName } from '../../lib/treeQuestions';
import { PickPerson } from './PickPerson';
import { Check, Face, btnDark, btnPrimary, btnSecondary, card } from './ui';

type TextKey = 'fullName' | 'tamilName' | 'birthDate' | 'deathDate' | 'currentCity' | 'profession' | 'phone' | 'email' | 'address' | 'biography' | 'notes';
type Picking = 'father' | 'mother' | 'spouse' | 'child' | null;

const FIELDS: { key: TextKey; label: string; hint?: string; type?: string; wide?: boolean; long?: boolean }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'tamilName', label: 'Name in Tamil', hint: 'Optional' },
  { key: 'birthDate', label: 'Birthday', type: 'date', hint: 'Only the day and month are shown on the website' },
  { key: 'currentCity', label: 'Lives in' },
  { key: 'profession', label: 'Job' },
  { key: 'phone', label: 'Phone', type: 'tel', hint: 'Used for the Call and WhatsApp buttons' },
  { key: 'email', label: 'Email', type: 'email', hint: 'Admin only, never on the website' },
  { key: 'address', label: 'Address', hint: 'Admin only, never on the website', wide: true },
  { key: 'biography', label: 'About them', hint: 'Shown on their page', wide: true, long: true },
  { key: 'notes', label: 'In their words', hint: 'From the form’s comments, shown if “About them” is empty', wide: true, long: true },
];

const longestWord = (name: string) => {
  const words = name.split(' ');
  return words.reduce((a, b) => (b.replace(/\./g, '').length > a.replace(/\./g, '').length ? b : a), words[0]);
};

/** One person: every detail, their photo and their family links, saved as soon as you change them. */
export const MemberEditor: React.FC<{ member: FamilyMember; onBack: () => void; onOpen: (id: string) => void }> = ({ member: m, onBack, onOpen }) => {
  const { members, refreshData, deleteMember } = useAdmin();
  const toast = useToast();
  const [draft, setDraft] = useState<Record<TextKey, string>>(() => toDraft(m));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [picking, setPicking] = useState<Picking>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  // Opening someone else (e.g. tapping a family link) starts from their saved details.
  useEffect(() => { setDraft(toDraft(m)); setConfirmDelete(false); setStatus('idle'); }, [m.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (changes: Partial<FamilyMember>, others: [string, Partial<FamilyMember>][] = []) => {
    setStatus('saving');
    try {
      await familyApi.updateMember(m.id, changes);
      for (const [id, c] of others) await familyApi.updateMember(id, c);
      await refreshData();
      setStatus('saved');
    } catch (e) {
      setStatus('idle');
      toast.error('That did not save', e instanceof Error ? e.message : undefined);
      await refreshData();
      setDraft(toDraft(m));
    }
  };

  const saveField = (key: TextKey) => {
    const value = draft[key].trim();
    if (value === (m[key] ?? '')) return;
    if (key === 'fullName') {
      if (!value) { setDraft((d) => ({ ...d, fullName: m.fullName })); return; }
      return save({ fullName: value.replace(/\s+/g, ' '), firstName: longestWord(value) });
    }
    return save({ [key]: value } as Partial<FamilyMember>);
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    setStatus('saving');
    try {
      const res = await familyApi.uploadPhoto(file);
      await save({ photoUrl: res.url });
    } catch (e) {
      setStatus('idle');
      toast.error('Could not upload the photo', e instanceof Error ? e.message : undefined);
    } finally {
      if (photoInput.current) photoInput.current.value = '';
    }
  };

  const byId = (id?: string | null) => (id ? members.find((x) => x.id === id) : undefined);
  const father = byId(m.fatherId);
  const mother = byId(m.motherId);
  const spouses = members.filter((x) => x.id !== m.id && ((m.spouseIds ?? []).includes(x.id) || m.spouseId === x.id || x.spouseIds?.includes(m.id) || x.spouseId === m.id));
  const children = members.filter((x) => x.fatherId === m.id || x.motherId === m.id);
  const spouseWord = m.gender === 'male' ? 'wife' : m.gender === 'female' ? 'husband' : 'husband or wife';

  const linkedIds = new Set([m.id, father?.id, mother?.id, ...spouses.map((s) => s.id), ...children.map((c) => c.id)].filter(Boolean) as string[]);
  // A woman can have only one husband: married women are not offered as someone's wife.
  const isMarried = (x: FamilyMember) =>
    (x.spouseIds?.length ?? 0) > 0 || !!x.spouseId || members.some((o) => o.spouseIds?.includes(x.id) || o.spouseId === x.id);
  const candidates = members.filter((x) => !linkedIds.has(x.id)).filter((x) =>
    picking === 'father' ? x.gender !== 'female'
      : picking === 'mother' ? x.gender !== 'male'
      : picking === 'spouse' ? !(x.gender === 'female' && isMarried(x))
      : true);
  const hasHusband = m.gender === 'female' && spouses.length > 0;

  const pick = async (p: FamilyMember) => {
    const kind = picking;
    setPicking(null);
    if (kind === 'father') return save({ fatherId: p.id });
    if (kind === 'mother') return save({ motherId: p.id });
    if (kind === 'spouse') {
      const others: [string, Partial<FamilyMember>][] = !(p.generation > 0) && m.generation > 0 ? [[p.id, { generation: m.generation }]] : [];
      return save({ spouseIds: [...spouses.map((s) => s.id), p.id] }, others);
    }
    if (kind === 'child') {
      // The other parent is filled in too when this person has exactly one husband or wife.
      const other = spouses.length === 1 ? spouses[0] : undefined;
      const link: Partial<FamilyMember> = m.gender === 'male' ? { fatherId: m.id } : { motherId: m.id };
      if (other?.gender === 'male' && m.gender === 'female') link.fatherId = other.id;
      if (other?.gender === 'female' && m.gender === 'male') link.motherId = other.id;
      setStatus('saving');
      try {
        await familyApi.updateMember(p.id, link);
        await refreshData();
        setStatus('saved');
      } catch (e) {
        setStatus('idle');
        toast.error('That did not save', e instanceof Error ? e.message : undefined);
      }
    }
  };

  const unlinkChild = async (c: FamilyMember) => {
    setStatus('saving');
    try {
      await familyApi.updateMember(c.id, c.fatherId === m.id ? { fatherId: '' } : { motherId: '' });
      await refreshData();
      setStatus('saved');
    } catch (e) {
      setStatus('idle');
      toast.error('That did not save', e instanceof Error ? e.message : undefined);
    }
  };

  const remove = async () => {
    try {
      await deleteMember(m.id);
      toast.success(`${m.fullName} was deleted`);
      onBack();
    } catch (e) {
      toast.error('Could not delete', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={`${btnSecondary} rounded-full min-h-[48px] pl-3`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          All members
        </button>
        <span className="flex items-center gap-1.5 text-[15px] font-bold min-h-[24px]" aria-live="polite">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && <><Check className="w-5 h-5" color="#5C8A4A" /> Saved</>}
        </span>
      </div>

      <section className={`${card} flex flex-wrap gap-6 items-center`}>
        <div className="flex flex-col items-center gap-2.5 flex-[0_0_auto]">
          <div className="bg-white p-2 rounded-[10px] shadow-[0_8px_20px_rgb(var(--c-leaf)/0.16)] -rotate-1">
            <Face member={m} className="w-[180px] h-[200px]" rounded="rounded-md" />
          </div>
          <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
          <div className="flex gap-2">
            <button type="button" className={btnDark} onClick={() => photoInput.current?.click()}>{m.photoUrl ? 'Change photo' : 'Add a photo'}</button>
            {m.photoUrl && <button type="button" className={`${btnSecondary} min-h-[52px]`} onClick={() => save({ photoUrl: '' })}>Remove</button>}
          </div>
        </div>
        <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-3">
          <h1 className="m-0 font-album font-extrabold text-[2rem] leading-tight" style={{ letterSpacing: 0 }}>{m.fullName}</h1>
          <div className="flex flex-col gap-1.5">
            <span className="text-[15px] font-bold">Man or woman</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Man or woman">
              {(['male', 'female'] as const).map((g) => (
                <button key={g} type="button" aria-pressed={m.gender === g} onClick={() => m.gender !== g && save({ gender: g })}
                  className={`min-h-[48px] px-6 rounded-full border-2 border-album-leaf text-[17px] font-bold ${m.gender === g ? 'bg-album-leaf text-white' : 'bg-white text-album-leaf'}`}>
                  {g === 'male' ? 'Man' : 'Woman'}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 min-h-[48px] text-[17px] font-bold cursor-pointer self-start">
            <input type="checkbox" checked={!!m.isDeceased} onChange={(e) => save({ isDeceased: e.target.checked })} className="w-6 h-6 accent-album-leaf" />
            Has passed away (shown “in loving memory”)
          </label>
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4`}>
        <h2 className="m-0 font-album text-[1.5rem] font-extrabold" style={{ letterSpacing: 0 }}>Details</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
          {FIELDS.filter((f) => f.key !== 'deathDate').map((f) => (
            <label key={f.key} className="flex flex-col gap-1 min-w-0" style={f.wide ? { gridColumn: '1 / -1' } : undefined}>
              <span className="text-[16px] font-bold">{f.label}</span>
              {f.hint && <span className="text-sm -mt-1">{f.hint}</span>}
              {f.long ? (
                <textarea value={draft[f.key]} rows={3} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} onBlur={() => saveField(f.key)}
                  className="rounded-2xl border-2 border-album-leaf bg-album-paper p-3 text-[17px] text-album-leaf leading-snug" />
              ) : (
                <input type={f.type ?? 'text'} value={draft[f.key]} inputMode={f.type === 'tel' ? 'tel' : undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} onBlur={() => saveField(f.key)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="min-h-[52px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-[17px] text-album-leaf" />
              )}
            </label>
          ))}
          {m.isDeceased && (
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-[16px] font-bold">Date they passed away</span>
              <span className="text-sm -mt-1">Optional</span>
              <input type="date" value={draft.deathDate} onChange={(e) => setDraft((d) => ({ ...d, deathDate: e.target.value }))} onBlur={() => saveField('deathDate')}
                className="min-h-[52px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-[17px] text-album-leaf" />
            </label>
          )}
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4`}>
        <div className="flex flex-col">
          <h2 className="m-0 font-album text-[1.5rem] font-extrabold" style={{ letterSpacing: 0 }}>Family links</h2>
          <span className="text-[15px]">Only parents, husband or wife, and children are linked. Every other relation is worked out from these.</span>
        </div>
        <LinkRow title="Father" people={father ? [father] : []} onOpen={onOpen} onRemove={() => save({ fatherId: '' })}
          addLabel={father ? 'Change father' : '+ Add father'} onAdd={() => setPicking('father')} />
        <LinkRow title="Mother" people={mother ? [mother] : []} onOpen={onOpen} onRemove={() => save({ motherId: '' })}
          addLabel={mother ? 'Change mother' : '+ Add mother'} onAdd={() => setPicking('mother')} />
        <LinkRow title={spouseWord[0].toUpperCase() + spouseWord.slice(1)} people={spouses} onOpen={onOpen}
          onRemove={(s) => save({ spouseIds: spouses.filter((x) => x.id !== s.id).map((x) => x.id) })}
          addLabel={`+ Add ${spouseWord}`} onAdd={() => setPicking('spouse')}
          disabledHint={hasHusband ? 'A woman can have only one husband. To change him, unlink him first (×).' : undefined} />
        <LinkRow title="Children" people={children} onOpen={onOpen} onRemove={unlinkChild}
          addLabel="+ Add a child" onAdd={() => setPicking('child')}
          disabledHint={!m.gender ? 'First choose Man or Woman above, so we know if they are the father or the mother.' : undefined} />
      </section>

      <section className={`${card} border-[3px] border-album-terracotta flex flex-col gap-3`}>
        <h2 className="m-0 font-album text-[1.3rem] font-extrabold" style={{ letterSpacing: 0 }}>Delete {firstName(m)}</h2>
        <span className="text-[16px]">Removes {firstName(m)} from the website and unlinks their family. This cannot be undone.</span>
        {confirmDelete ? (
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="text-[17px] font-bold">Are you sure?</span>
            <button type="button" className={btnPrimary} onClick={remove}>Yes, delete {firstName(m)}</button>
            <button type="button" className={btnSecondary} onClick={() => setConfirmDelete(false)}>No, keep</button>
          </div>
        ) : (
          <button type="button" className={`${btnSecondary} self-start border-album-terracotta text-album-terracotta`} onClick={() => setConfirmDelete(true)}>Delete this person</button>
        )}
      </section>

      {picking && (
        <PickPerson
          title={picking === 'father' ? `Who is ${firstName(m)}'s father?` : picking === 'mother' ? `Who is ${firstName(m)}'s mother?` : picking === 'spouse' ? `Who is ${firstName(m)}'s ${spouseWord}?` : `Which child of ${firstName(m)}?`}
          people={candidates}
          onPick={pick}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
};

const toDraft = (m: FamilyMember): Record<TextKey, string> => ({
  fullName: m.fullName ?? '', tamilName: m.tamilName ?? '', birthDate: (m.birthDate ?? '').slice(0, 10), deathDate: (m.deathDate ?? '').slice(0, 10),
  currentCity: m.currentCity ?? '', profession: m.profession ?? '', phone: m.phone ?? '', email: m.email ?? '', address: m.address ?? '',
  biography: m.biography ?? '', notes: m.notes ?? '',
});

const LinkRow: React.FC<{
  title: string; people: FamilyMember[]; addLabel: string; disabledHint?: string;
  onAdd: () => void; onRemove: (p: FamilyMember) => void; onOpen: (id: string) => void;
}> = ({ title, people, addLabel, disabledHint, onAdd, onRemove, onOpen }) => (
  <div className="flex flex-col gap-2 border-t-2 border-dotted border-album-moss/60 pt-3">
    <span className="text-[17px] font-extrabold">{title}</span>
    <div className="flex flex-wrap gap-2.5 items-center">
      {people.map((p) => (
        <span key={p.id} className="bg-album-paper rounded-full p-1.5 pr-2 flex items-center gap-2">
          <button type="button" onClick={() => onOpen(p.id)} className="flex items-center gap-2 text-left" aria-label={`Open ${p.fullName}`}>
            <Face member={p} className="w-11 h-11" rounded="rounded-full" />
            <span className="text-[17px] font-bold">{p.fullName}</span>
          </button>
          <button type="button" onClick={() => onRemove(p)} aria-label={`Unlink ${p.fullName}`} title="Unlink"
            className="w-10 h-10 rounded-full bg-white border-2 border-album-line flex items-center justify-center hover:border-album-terracotta">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </span>
      ))}
      {disabledHint ? <span className="text-[15px]">{disabledHint}</span> : (
        <button type="button" className={`${btnSecondary} min-h-[48px]`} onClick={onAdd}>{addLabel}</button>
      )}
    </div>
  </div>
);
