import React, { useMemo, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { familyApi } from '../../api/familyApi';
import { FamilyMember } from '../../types/family';
import {
  Question, birthYear, childClue, familiesOnTree, familyLabel, firstName, openQuestions,
  parentIds, placedIds, questionText, rankCandidates, reminderText, spouseClue,
} from '../../lib/treeQuestions';
import { Face, StepTitle, btnDark, btnPrimary, btnSecondary, card, Check } from './ui';

const SUGGESTED = 3;
const FIRST_SHOWN = 24;
const REMINDERS_SHOWN = 8;

interface Option {
  id: string;
  title: string;
  meta: string;
  face?: FamilyMember;
  score: number;
  clue?: string;
}

interface Done {
  text: string;
  undo?: () => Promise<void>;
}

/**
 * Step 2: the site asks one question at a time and the admin answers by tapping photos.
 * Nothing is kept only in the browser: every answer is saved straight away, so the
 * questions and reminders are always worked out again from the saved family.
 */
export const BuildTreeStep: React.FC<{ onAddPeople: () => void; onNext: () => void }> = ({ onAddPeople, onNext }) => {
  const { members, refreshData } = useAdmin();
  const toast = useToast();

  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [later, setLater] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done[]>([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [allReminders, setAllReminders] = useState(false);
  const [adding, setAdding] = useState(false);

  const placed = useMemo(() => placedIds(members), [members]);
  const pool = useMemo(
    () => members.filter((m) => !placed.has(m.id)).sort((a, b) => (birthYear(a) ?? 9999) - (birthYear(b) ?? 9999) || a.fullName.localeCompare(b.fullName)),
    [members, placed],
  );
  const questions = useMemo(() => openQuestions(members), [members]);

  // The question on screen: the one the admin picked, else the next one (questions put off come last).
  const current: Question | null = useMemo(() => {
    const placing = placingId ? pool.find((m) => m.id === placingId) : undefined;
    if (placing) return { kind: 'where', key: `where:${placing.id}`, person: placing };
    const chosen = questions.find((q) => q.key === chosenKey);
    if (chosen) return chosen;
    return questions.find((q) => !later.includes(q.key)) ?? questions[0] ?? null;
  }, [placingId, pool, questions, chosenKey, later]);

  const reset = () => {
    setPicked([]);
    setSearch('');
    setShowAll(false);
    setAdding(false);
  };

  const options: Option[] = useMemo(() => {
    if (!current) return [];
    const asOption = (m: FamilyMember, score: number, clue?: string): Option => ({
      id: m.id, title: m.fullName, meta: birthYear(m) ? `born ${birthYear(m)}` : m.currentCity ?? '', face: m, score, clue,
    });
    switch (current.kind) {
      case 'founders':
        return pool.map((m) => asOption(m, 0));
      case 'spouse':
        return rankCandidates(pool.filter((m) => m.id !== current.person.id), (x) => spouseClue(x, current.person)).map((c) => asOption(c.member, c.score, c.clue));
      case 'children':
        return rankCandidates(pool, (x) => childClue(x, current.parents)).map((c) => asOption(c.member, c.score, c.clue));
      case 'where': {
        const x = current.person;
        const out: Option[] = [];
        for (const f of familiesOnTree(members)) {
          const c = childClue(x, f.parents);
          out.push({ id: `child:${f.key}`, title: `Child of ${familyLabel(f.parents)}`, meta: 'born into this family', face: f.parents[0], score: c.score, clue: c.clue });
          if (f.parents.length === 1 && !f.parents[0].noSpouse) {
            const s = spouseClue(x, f.parents[0]);
            out.push({ id: `spouse:${f.parents[0].id}`, title: `Married to ${firstName(f.parents[0])}`, meta: `${firstName(f.parents[0])} has no spouse yet`, face: f.parents[0], score: s.score, clue: s.clue });
          }
        }
        return out.sort((a, b) => b.score - a.score);
      }
      default:
        return [];
    }
  }, [current, pool, members]);

  const multi = current?.kind === 'children' || current?.kind === 'founders';
  const filtered = options.filter((o) => !search.trim() || o.title.toLowerCase().includes(search.trim().toLowerCase()));
  const firstFew = showAll || search.trim() ? filtered : filtered.slice(0, FIRST_SHOWN);
  // Someone just added (or picked before searching) stays visible even when outside the first few.
  const shown = [...firstFew, ...options.filter((o) => picked.includes(o.id) && !firstFew.includes(o))];

  const toggle = (id: string) => {
    if (!multi) return setPicked((p) => (p[0] === id ? [] : [id]));
    const max = current?.kind === 'founders' ? 2 : 99;
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= max ? [...p.slice(1), id] : [...p, id]));
  };

  /** Runs a set of saves, then reloads the family so the next question appears. */
  const run = async (text: string, work: () => Promise<void>, undo?: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
      setDone((d) => [{ text, undo }, ...d].slice(0, 6));
      setChosenKey(null);
      setPlacingId(null);
      reset();
      await refreshData();
    } catch (e) {
      toast.error('That did not save', e instanceof Error ? e.message : undefined);
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const update = (id: string, changes: Partial<FamilyMember>) => familyApi.updateMember(id, changes).then(() => undefined);

  const marry = (person: FamilyMember, spouse: FamilyMember) => {
    const before = person.spouseIds ?? [];
    return run(
      `${firstName(spouse)} is ${firstName(person)}'s ${spouse.gender === 'female' ? 'wife' : spouse.gender === 'male' ? 'husband' : 'spouse'}`,
      async () => {
        await update(person.id, { spouseIds: [...before, spouse.id] });
        await update(spouse.id, { generation: person.generation || 1 });
      },
      () => update(person.id, { spouseIds: before }),
    );
  };

  const addChildren = (parents: FamilyMember[], kids: FamilyMember[]) => {
    const { fatherId, motherId } = parentIds(parents);
    return run(
      `${kids.map(firstName).join(', ')} ${kids.length === 1 ? 'is a child' : 'are children'} of ${familyLabel(parents)}`,
      async () => {
        for (const k of kids) await update(k.id, { fatherId: fatherId ?? '', motherId: motherId ?? '' });
      },
      async () => {
        for (const k of kids) await update(k.id, { fatherId: '', motherId: '' });
      },
    );
  };

  const byId = (id: string) => members.find((m) => m.id === id)!;

  const confirm = () => {
    if (!current || picked.length === 0) return;
    switch (current.kind) {
      case 'founders': {
        const [a, b] = picked.map(byId);
        return run(
          `${[a, b].filter(Boolean).map(firstName).join(' & ')} ${b ? 'are' : 'is'} at the top of the tree`,
          async () => {
            for (const m of [a, b].filter(Boolean)) await update(m.id, { generation: 1, branchId: 'root', branchName: 'Founding Roots', branchNameTamil: 'Founding Roots' });
            if (b) await update(a.id, { spouseIds: [b.id] });
          },
        );
      }
      case 'spouse':
        return marry(current.person, byId(picked[0]));
      case 'children':
        return addChildren(current.parents, picked.map(byId));
      case 'where': {
        const [kind, rest] = [picked[0].split(':')[0], picked[0].slice(picked[0].indexOf(':') + 1)];
        if (kind === 'spouse') return marry(byId(rest), current.person);
        const family = familiesOnTree(members).find((f) => f.key === rest);
        if (family) return addChildren(family.parents, [current.person]);
      }
    }
  };

  const answerNone = () => {
    if (!current) return;
    if (current.kind === 'spouse') {
      const p = current.person;
      return run(`${firstName(p)}: not married`, () => update(p.id, { noSpouse: true }), () => update(p.id, { noSpouse: false }));
    }
    if (current.kind === 'children') {
      const ps = current.parents;
      return run(
        `${familyLabel(ps)}: no children`,
        async () => { for (const p of ps) await update(p.id, { noChildren: true }); },
        async () => { for (const p of ps) await update(p.id, { noChildren: false }); },
      );
    }
  };

  const putOff = () => {
    if (!current) return;
    if (current.kind === 'where') setPlacingId(null);
    else setLater((l) => [...l.filter((k) => k !== current.key), current.key]);
    setChosenKey(null);
    reset();
  };

  const setGender = (p: FamilyMember, gender: 'male' | 'female') =>
    run(`${firstName(p)} is a ${gender === 'male' ? 'man' : 'woman'}`, () => update(p.id, { gender }), () => update(p.id, { gender: '' as FamilyMember['gender'] }));

  const undoLast = async () => {
    const last = done[0];
    if (!last?.undo) return;
    setBusy(true);
    try {
      await last.undo();
      setDone((d) => d.slice(1));
      await refreshData();
      toast.info('Undone', last.text);
    } catch (e) {
      toast.error('Could not undo', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const reminders = questions.filter((q) => q.key !== current?.key);
  const placedCount = members.filter((m) => placed.has(m.id)).length;
  const pct = members.length ? Math.round((placedCount / members.length) * 100) : 0;

  const choose = (key: string) => { setPlacingId(null); setChosenKey(key); reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const place = (id: string) => { setChosenKey(null); setPlacingId(id); reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const confirmLabel = () => {
    if (!current || picked.length === 0) return '';
    if (current.kind === 'children') return picked.length === 1 ? 'Yes, this is their child' : `Yes, these ${picked.length} are their children`;
    if (current.kind === 'founders') return picked.length === 2 ? 'Yes, these two are at the top' : 'Yes, this person is at the top';
    if (current.kind === 'spouse') return `Yes, ${firstName(byId(picked[0]))} is ${firstName(current.person)}'s ${byId(picked[0]).gender === 'female' ? 'wife' : byId(picked[0]).gender === 'male' ? 'husband' : 'spouse'}`;
    return `Yes, place ${firstName(current.person)} here`;
  };

  const tag = !current ? '' : current.kind === 'founders' ? 'The elders' : current.kind === 'children' ? `${firstName(current.parents[0])}'s family` : `${firstName(current.person)}'s family`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex-[1_1_480px] min-w-0">
          <StepTitle step="step 2 of 3" title="Build the tree">One simple question at a time. Just tap photos, there's nothing to type.</StepTitle>
        </div>
        <div className="flex-[0_1_320px] min-w-0 flex flex-col gap-1.5">
          <span className="text-[17px] font-bold">{placedCount} of {members.length} people on the tree</span>
          <div aria-hidden="true" className="h-3.5 rounded-full bg-album-line overflow-hidden">
            <div className="h-3.5 rounded-full bg-album-moss transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {pool.length > 0 && current?.kind !== 'founders' && (
        <a href="#reminders" className="no-underline bg-album-terracotta text-white rounded-[18px] min-h-[56px] px-4.5 py-2 flex flex-wrap items-center justify-between gap-2.5 px-5">
          <span className="flex items-center gap-2.5 text-lg font-bold">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            Don't forget: {pool.length === 1 ? '1 person is' : `${pool.length} people are`} not on the tree yet
          </span>
          <span className="text-base font-extrabold underline">See the list</span>
        </a>
      )}

      <div className="flex flex-wrap gap-6 items-start">
        <section aria-label="Family question" className="flex-[999_1_600px] min-w-0 bg-white border-[3px] border-album-leaf rounded-[28px] shadow-[0_6px_0_#1E4636] p-5 sm:p-6 flex flex-col gap-4.5 gap-5">
          {members.length === 0 ? (
            <Empty title="No family members yet" text="Start by uploading the Google Form file.">
              <button type="button" className={btnPrimary} onClick={onAddPeople}>Add people</button>
            </Empty>
          ) : !current ? (
            <Empty title="The family tree is ready." hand="everyone has a branch!" text="Every Athai, Mama and Chithappa is worked out for you. New form answers will show up here as reminders.">
              <button type="button" className={btnPrimary} onClick={onNext}>Next: share the link</button>
            </Empty>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="self-start bg-album-turmeric rounded-full px-3.5 py-0.5 text-[15px] font-extrabold">{tag}</span>
                <h2 className="font-album font-extrabold text-[1.75rem] sm:text-[2rem] leading-tight m-0" style={{ letterSpacing: 0 }}>{questionText(current)}</h2>
                <span className="text-[17px]">
                  {current.kind === 'gender' && 'One tap. This tells the site who is the father and who is the mother.'}
                  {current.kind === 'founders' && 'Tap the grandparents everyone comes from (one or two people). If they are not in the list, add them below.'}
                  {current.kind === 'spouse' && 'Tap one photo.'}
                  {current.kind === 'children' && 'Tap every child’s photo. Tap again to remove.'}
                  {current.kind === 'where' && 'Tap one: the family they were born into, or the person they married.'}
                </span>
              </div>

              {current.kind === 'gender' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Face member={current.person} className="w-20 h-20" />
                  <button type="button" disabled={busy} className={`${btnDark} min-h-[60px] px-7 text-lg`} onClick={() => setGender(current.person, 'male')}>Man</button>
                  <button type="button" disabled={busy} className={`${btnDark} min-h-[60px] px-7 text-lg`} onClick={() => setGender(current.person, 'female')}>Woman</button>
                </div>
              ) : (
                <>
                  {options.length > 8 && (
                    <label className="flex flex-col gap-1 max-w-[420px]">
                      <span className="text-[15px] font-bold">Find by name</span>
                      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a name…"
                        className="min-h-[48px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-[17px] font-album text-album-leaf" />
                    </label>
                  )}
                  {options.length === 0 && current.kind !== 'founders' && (
                    <p className="text-[17px] m-0">Nobody is waiting to be placed right now. If the answer is someone who hasn't filled the form, add them below.</p>
                  )}
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                    {shown.map((o) => {
                      const on = picked.includes(o.id);
                      return (
                        <button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={on}
                          className={`relative text-left bg-white rounded-[20px] p-1.5 pb-2.5 flex flex-col gap-1 font-album text-album-leaf transition ${on ? 'border-4 border-album-terracotta' : 'border-2 border-album-line hover:border-album-leaf'}`}>
                          {o.face && <Face member={o.face} className="w-full aspect-square" rounded="rounded-[14px]" />}
                          <span className="text-[17px] font-extrabold leading-tight px-1">{o.title}</span>
                          {o.meta && <span className="text-sm px-1">{o.meta}</span>}
                          {o.score >= SUGGESTED && o.clue && <span className="font-hand text-base leading-tight text-album-terracotta px-1">likely: {o.clue}</span>}
                          {on && (
                            <span aria-hidden="true" className="absolute right-2.5 top-2.5 w-[34px] h-[34px] rounded-full bg-album-terracotta flex items-center justify-center">
                              <Check className="w-5 h-5" color="#FFFFFF" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!showAll && !search.trim() && filtered.length > FIRST_SHOWN && (
                    <button type="button" className={`${btnSecondary} self-start`} onClick={() => setShowAll(true)}>Show everyone ({filtered.length})</button>
                  )}

                  {(current.kind === 'founders' || current.kind === 'spouse' || current.kind === 'children') && (
                    adding ? (
                      <AddPerson
                        deceasedHint={current.kind === 'founders'}
                        onCancel={() => setAdding(false)}
                        onAdded={async (m) => {
                          await refreshData();
                          setAdding(false);
                          setPicked((p) => (multi ? [...p, m.id] : [m.id]));
                        }}
                      />
                    ) : (
                      <button type="button" className="self-start underline font-bold text-base min-h-[44px]" onClick={() => setAdding(true)}>
                        + Add someone who isn't in the list
                      </button>
                    )
                  )}

                  <div className="flex flex-wrap gap-3 items-center">
                    {picked.length > 0 ? (
                      <button type="button" className={btnPrimary} disabled={busy} onClick={confirm}>{busy ? 'Saving…' : confirmLabel()}</button>
                    ) : (
                      <span className="font-hand text-[21px]">tap a photo above…</span>
                    )}
                    {current.kind === 'spouse' && <button type="button" className={btnSecondary} disabled={busy} onClick={answerNone}>{firstName(current.person)} is not married</button>}
                    {current.kind === 'children' && <button type="button" className={btnSecondary} disabled={busy} onClick={answerNone}>No children</button>}
                  </div>
                </>
              )}
              {current.kind !== 'founders' && (
                <button type="button" className="self-start underline text-base min-h-[44px]" onClick={putOff}>Not sure yet, remind me later</button>
              )}
            </>
          )}
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <TreeSoFar members={members} placed={placed} highlight={current} />
          <section aria-label="Just done" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2.5">
              <h2 className="font-album text-[19px] font-extrabold m-0" style={{ letterSpacing: 0 }}>Just done</h2>
              {done[0]?.undo && <button type="button" disabled={busy} className={`${btnSecondary} min-h-[44px] rounded-full`} onClick={undoLast}>Undo last</button>}
            </div>
            {done.length === 0 && <span className="font-hand text-[19px]">nothing yet. Answer the first question!</span>}
            {done.map((d, i) => <span key={i} className="bg-white rounded-2xl px-3 py-2 text-[15px] shadow-[0_2px_0_#DCE6D2]">{d.text}</span>)}
          </section>
        </aside>
      </div>

      <section id="reminders" aria-label="Still to do" className={`${card} border-[3px] border-album-terracotta flex flex-col gap-4.5 gap-5`}>
        <div className="flex flex-col">
          <span className="font-hand text-[22px] leading-none text-album-terracotta">so no one is left out</span>
          <h2 className="font-album text-[2rem] font-extrabold leading-tight m-0" style={{ letterSpacing: 0 }}>Still to do</h2>
        </div>
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-2.5">
            <h3 className="font-album text-xl font-extrabold m-0" style={{ letterSpacing: 0 }}>
              Not on the tree yet <span className="bg-album-terracotta text-white rounded-full px-2.5 text-base">{pool.length}</span>
            </h3>
            {(allReminders ? pool : pool.slice(0, REMINDERS_SHOWN)).map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 bg-album-paper rounded-[18px] px-2.5 py-2">
                <Face member={m} className="w-[52px] h-[52px]" rounded="rounded-[14px]" />
                <span className="flex-[1_1_140px] min-w-0 flex flex-col leading-tight">
                  <span className="text-lg font-extrabold">{m.fullName}</span>
                  <span className="text-sm">{[birthYear(m) && `born ${birthYear(m)}`, m.currentCity, m.source === 'form-import' && 'from the form'].filter(Boolean).join(' · ')}</span>
                </span>
                {current?.kind !== 'founders' && <button type="button" className={btnDark} onClick={() => place(m.id)}>Place now</button>}
              </div>
            ))}
            {pool.length === 0 && <span className="flex items-center gap-2 text-lg font-bold"><Check color="#5C8A4A" /> Everyone is on the tree!</span>}
          </div>
          <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-2.5">
            <h3 className="font-album text-xl font-extrabold m-0" style={{ letterSpacing: 0 }}>
              Questions not answered yet <span className="bg-album-turmeric rounded-full px-2.5 text-base">{reminders.length}</span>
            </h3>
            {(allReminders ? reminders : reminders.slice(0, REMINDERS_SHOWN)).map((q) => (
              <div key={q.key} className="flex flex-wrap items-center justify-between gap-2.5 bg-album-paper rounded-[18px] py-2 pl-4 pr-2.5">
                <span className="text-[17px] font-semibold flex-[1_1_160px] min-w-0">{reminderText(q)}{later.includes(q.key) && <span className="font-hand text-album-terracotta"> · put off</span>}</span>
                <button type="button" className={`${btnSecondary} min-h-[46px]`} onClick={() => choose(q.key)}>Answer now</button>
              </div>
            ))}
            {reminders.length === 0 && <span className="flex items-center gap-2 text-lg font-bold"><Check color="#5C8A4A" /> Nothing waiting</span>}
          </div>
        </div>
        {(pool.length > REMINDERS_SHOWN || reminders.length > REMINDERS_SHOWN) && (
          <button type="button" className={`${btnSecondary} self-start`} onClick={() => setAllReminders((v) => !v)}>{allReminders ? 'Show fewer' : 'Show the whole list'}</button>
        )}
      </section>
    </>
  );
};

const Empty: React.FC<{ title: string; text: string; hand?: string; children?: React.ReactNode }> = ({ title, text, hand, children }) => (
  <div className="flex flex-col items-center gap-2 py-9 text-center">
    {hand && <span className="font-hand text-[30px] text-album-terracotta">{hand}</span>}
    <span className="text-[2rem] font-extrabold leading-tight">{title}</span>
    <span className="text-lg max-w-[520px]">{text}</span>
    <div className="mt-2">{children}</div>
  </div>
);

/** Quick add for people who did not fill the form (often elders who have passed away). */
const AddPerson: React.FC<{ deceasedHint: boolean; onAdded: (m: FamilyMember) => void; onCancel: () => void }> = ({ deceasedHint, onAdded, onCancel }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [deceased, setDeceased] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const fullName = name.trim().replace(/\s+/g, ' ');
    if (!fullName || !gender) return;
    setSaving(true);
    try {
      const words = fullName.split(' ');
      const m = await familyApi.createMember({
        fullName, firstName: words.reduce((a, b) => (b.replace(/\./g, '').length > a.replace(/\./g, '').length ? b : a), words[0]),
        lastName: '', tamilName: '', gender, isDeceased: deceased, generation: 0, source: 'manual', childIds: [], spouseIds: [], tags: [],
      });
      onAdded(m);
    } catch (e) {
      toast.error('Could not add', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="bg-album-paper rounded-[20px] p-4 flex flex-col gap-3 max-w-[560px]">
      <label className="flex flex-col gap-1">
        <span className="text-[15px] font-bold">Their name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="min-h-[48px] rounded-2xl border-2 border-album-leaf bg-white px-4 text-[17px] font-album text-album-leaf" />
      </label>
      <div className="flex flex-wrap gap-2.5 items-center" role="group" aria-label="Man or woman">
        {(['male', 'female'] as const).map((g) => (
          <button key={g} type="button" aria-pressed={gender === g} onClick={() => setGender(g)}
            className={`min-h-[44px] px-5 rounded-full border-2 border-album-leaf font-bold ${gender === g ? 'bg-album-leaf text-white' : 'bg-white text-album-leaf'}`}>
            {g === 'male' ? 'Man' : 'Woman'}
          </button>
        ))}
        <label className="flex items-center gap-2 min-h-[44px] text-base">
          <input type="checkbox" checked={deceased} onChange={(e) => setDeceased(e.target.checked)} className="w-5 h-5 accent-[#1E4636]" />
          Has passed away{deceasedHint ? ' (common for the elders)' : ''}
        </label>
      </div>
      <div className="flex gap-2.5">
        <button type="button" className={btnDark} disabled={saving || !name.trim() || !gender} onClick={save}>{saving ? 'Adding…' : 'Add and select'}</button>
        <button type="button" className={`${btnSecondary} min-h-[48px]`} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

/** A compact text view of the tree, generation by generation, highlighting the family being asked about. */
const TreeSoFar: React.FC<{ members: FamilyMember[]; placed: Set<string>; highlight: Question | null }> = ({ members, placed, highlight }) => {
  const families = familiesOnTree(members);
  const hi = new Set<string>(
    !highlight ? [] : highlight.kind === 'children' ? highlight.parents.map((p) => p.id) : 'person' in highlight ? [highlight.person.id] : [],
  );
  const titles = ['THE ELDERS', 'CHILDREN', 'GRANDCHILDREN', 'GREAT-GRANDCHILDREN', '5TH GENERATION', '6TH GENERATION'];
  const gens = new Map<number, typeof families>();
  for (const f of families) {
    const g = Math.max(1, f.parents[0].generation || 1);
    gens.set(g, [...(gens.get(g) ?? []), f]);
  }
  const levels = Array.from(gens.keys()).sort((a, b) => a - b);
  return (
    <section aria-label="Your tree so far" className="bg-white rounded-[24px] p-4.5 p-5 shadow-[0_8px_20px_rgba(30,70,54,0.12)] flex flex-col gap-3">
      <span className="font-hand text-[22px] leading-none text-album-terracotta">your tree so far</span>
      {levels.length === 0 && <span className="text-[15px]">Empty for now. The first question starts it.</span>}
      {levels.map((g) => (
        <div key={g} className="flex flex-col gap-1.5 border-t-2 border-dotted border-[#9BB58C] pt-2.5">
          <span className="text-[13px] font-extrabold tracking-[1px]">{titles[g - 1] ?? `GENERATION ${g}`}</span>
          <div className="flex flex-wrap gap-1.5">
            {gens.get(g)!.map((f) => (
              <span key={f.key} className={`rounded-full px-3 py-1 text-[15px] font-bold ${f.parents.some((p) => hi.has(p.id)) ? 'bg-album-turmeric' : 'bg-album-paper'}`}>
                {familyLabel(f.parents)}
              </span>
            ))}
          </div>
        </div>
      ))}
      <span className="text-sm">{placed.size} on the tree</span>
    </section>
  );
};
