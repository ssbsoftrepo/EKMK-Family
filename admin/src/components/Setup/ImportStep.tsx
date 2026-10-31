import React, { useMemo, useRef, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { familyApi, ImportReport } from '../../api/familyApi';
import { FamilyMember } from '../../types/family';
import { Face, StepTitle, btnDark, btnPrimary, btnSecondary, card, Check } from './ui';

const GENDER_PREVIEW = 6;

/** Step 1: upload the Google Form file. The site tidies it; the admin only answers what cannot be guessed. */
export const ImportStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { members, refreshData, deleteMember } = useAdmin();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAllGender, setShowAllGender] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await familyApi.importResponses(file);
      setReport(r);
      setFileName(file.name);
      await refreshData();
      toast.success(
        r.added > 0 ? `${r.added} new ${r.added === 1 ? 'person' : 'people'} added` : 'Everyone in this file was already here',
        r.updated > 0 ? `${r.updated} filled in missing details` : undefined,
      );
    } catch (e) {
      toast.error('Could not read the file', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const needGender = useMemo(() => members.filter((m) => !m.gender).sort((a, b) => a.fullName.localeCompare(b.fullName)), [members]);
  const shownGender = showAllGender ? needGender : needGender.slice(0, GENDER_PREVIEW);
  const duplicates = (report?.possibleDuplicates ?? []).filter(
    (d) => !dismissed.has(d.firstId + d.secondId) && members.some((m) => m.id === d.firstId) && members.some((m) => m.id === d.secondId),
  );

  const setGender = async (m: FamilyMember, gender: 'male' | 'female') => {
    setSavingId(m.id);
    try {
      await familyApi.updateMember(m.id, { gender });
      await refreshData();
    } catch (e) {
      toast.error('Could not save', e instanceof Error ? e.message : undefined);
    } finally {
      setSavingId(null);
    }
  };

  const keepOne = async (keepId: string, removeId: string) => {
    try {
      await deleteMember(removeId);
      setDismissed((s) => new Set(s).add(keepId + removeId));
      toast.success('Done, kept one');
    } catch (e) {
      toast.error('Could not remove the copy', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <>
      <StepTitle step="step 1 of 3" title="Add everyone at once">
        Upload the Excel file from the Google Form. We tidy it up for you, so you never edit a spreadsheet.
      </StepTitle>

      <section
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
        className={`rounded-[26px] border-[3px] border-dashed px-5 py-8 flex flex-col items-center gap-3.5 text-center transition ${dragging ? 'bg-album-sage/40 border-album-terracotta' : 'bg-white border-album-leaf'}`}
      >
        <span className="w-[76px] h-[76px] rounded-full bg-album-sage flex items-center justify-center">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#1E4636" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </span>
        <span className="text-2xl font-extrabold">{uploading ? 'Reading the file…' : 'Drop the Excel file here'}</span>
        <span className="text-base max-w-[520px]">In Google Forms: Responses → the three dots → Download responses (.csv), or open the linked Sheet and choose File → Download → Microsoft Excel.</span>
        <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" className="hidden" id="form-file" onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" className={btnPrimary} disabled={uploading} onClick={() => fileInput.current?.click()}>
          Choose file
        </button>
        {fileName && (
          <span className="flex items-center gap-2 bg-album-paper rounded-full px-3.5 py-1 text-[15px]">
            <Check className="w-[18px] h-[18px]" /> {fileName} · uploaded just now
          </span>
        )}
      </section>

      <div className="flex flex-wrap gap-5 items-start">
        <section className={`${card} flex-[1_1_420px] min-w-0 shadow-[0_4px_0_#1E4636] flex flex-col gap-3.5`}>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-5xl font-extrabold leading-none">{members.length}</span>
            <span className="text-xl font-bold">family members so far</span>
          </div>
          {report ? (
            <>
              <h2 className="font-album text-lg font-extrabold tracking-wide m-0">FROM THIS FILE</h2>
              <ul className="flex flex-col gap-2.5 text-[17px] leading-snug">
                <Li>{report.added} new {report.added === 1 ? 'person' : 'people'} added</Li>
                {report.updated > 0 && <Li>{report.updated} already here, missing details filled in</Li>}
                {report.unchanged > 0 && <Li>{report.unchanged} already here, nothing new</Li>}
                {report.fixes.map((f) => <Li key={f}>{f}</Li>)}
              </ul>
            </>
          ) : (
            <p className="text-[17px] m-0">Upload the file to add people. More answers coming later? Just upload the file again: only the new people are added, and nothing you changed is overwritten.</p>
          )}
        </section>

        <section className={`${card} flex-[1_1_420px] min-w-0 border-[3px] border-album-terracotta flex flex-col gap-4`}>
          <div className="flex flex-col">
            <span className="font-hand text-[22px] leading-none text-album-terracotta">{needGender.length + duplicates.length === 0 ? 'all clear' : 'just a few quick taps'}</span>
            <h2 className="font-album text-2xl font-extrabold m-0" style={{ letterSpacing: 0 }}>Needs you</h2>
          </div>

          {needGender.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[17px] font-bold">Man or woman? The Tamil relation names need it. ({needGender.length} left)</span>
              {shownGender.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2.5 bg-album-paper rounded-2xl px-2.5 py-2">
                  <Face member={m} className="w-11 h-11" rounded="rounded-xl" />
                  <span className="flex-[1_1_120px] min-w-0 text-[17px] font-bold">{m.fullName}</span>
                  <button type="button" disabled={savingId === m.id} onClick={() => setGender(m, 'male')} className={`${btnSecondary} min-h-[44px] rounded-full`}>Man</button>
                  <button type="button" disabled={savingId === m.id} onClick={() => setGender(m, 'female')} className={`${btnSecondary} min-h-[44px] rounded-full`}>Woman</button>
                </div>
              ))}
              {needGender.length > GENDER_PREVIEW && (
                <button type="button" className="self-start underline font-bold text-[15px] min-h-[44px]" onClick={() => setShowAllGender((v) => !v)}>
                  {showAllGender ? 'Show fewer' : `Show all ${needGender.length}`}
                </button>
              )}
              <span className="text-[15px]">Tip: add a "Man / Woman" question to the Google Form and this list stays empty.</span>
            </div>
          )}

          {duplicates.map((d) => (
            <div key={d.firstId + d.secondId} className="flex flex-col gap-2.5">
              <span className="text-[17px] font-bold">Are these the same person? ({d.reason})</span>
              <div className="flex flex-wrap items-center gap-2.5 bg-album-paper rounded-2xl p-2.5">
                <span className="flex-[1_1_200px] text-[17px]"><strong>{d.firstName}</strong> &amp; <strong>{d.secondName}</strong></span>
                <button type="button" className={`${btnDark} rounded-full`} onClick={() => keepOne(d.firstId, d.secondId)}>Same person, keep one</button>
                <button type="button" className={`${btnSecondary} min-h-[44px] rounded-full`} onClick={() => setDismissed((s) => new Set(s).add(d.firstId + d.secondId))}>Two people</button>
              </div>
            </div>
          ))}

          {needGender.length + duplicates.length === 0 && (
            <span className="flex items-center gap-2 text-lg font-bold"><Check color="#5C8A4A" /> Nothing to check</span>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-hand text-[21px] max-w-[560px]">More answers coming? Upload the file again any time. Only the new people are added.</span>
        <button type="button" className={btnPrimary} onClick={onNext} disabled={members.length === 0}>
          Looks good, build the tree
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </>
  );
};

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex gap-2.5"><Check className="w-6 h-6 flex-shrink-0" color="#5C8A4A" /><span>{children}</span></li>
);
