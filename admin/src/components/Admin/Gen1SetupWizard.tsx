import React, { useState, useRef, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PersonAvatar } from '../Common/PersonAvatar';
import { HeritageDateInput } from '../Common/HeritageDateInput';
import { familyApi } from '../../api/familyApi';
import {
  TreePine, Users, ChevronRight, CheckCircle2, Upload,
  Loader2, X, Heart, User, UserCheck, Sparkles,
  AlertCircle, ArrowRight, ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';

/* ─── Types ─── */
interface PersonForm {
  fullName: string;
  tamilName: string;
  birthDate: string;
  birthPlace: string;
  currentCity: string;
  education: string;
  profession: string;
  biography: string;
  photoUrl: string;
  isDeceased: boolean;
  deathDate: string;
}

const emptyPerson = (): PersonForm => ({
  fullName: '', tamilName: '', birthDate: '',
  birthPlace: 'Erode', currentCity: 'Erode',
  education: '', profession: '', biography: '',
  photoUrl: '', isDeceased: false, deathDate: '',
});

type WizardStep = 'welcome' | 'husband' | 'wife' | 'review' | 'saving';

/* ─── Inline Photo Upload ─── */
const PhotoBlock: React.FC<{
  photoUrl: string;
  name: string;
  gender: 'male' | 'female';
  onPhotoChange: (url: string) => void;
}> = ({ photoUrl, name, gender, onPhotoChange }) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File Too Large', 'File size exceeds 10MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Invalid Format', 'Please select JPG, PNG, or WEBP.'); return; }
    onPhotoChange(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await familyApi.uploadPhoto(file);
      if (res?.url) {
        onPhotoChange(res.url);
        toast.success('Photo Uploaded', `${name || (gender === 'male' ? 'Husband' : 'Wife')} photo attached.`);
      }
    } catch {
      toast.error('Upload Notice', 'Upload failed. Preview retained locally.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-[96px]">
      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-heritage-gold/60 shadow bg-heritage-cream flex-shrink-0">
        <PersonAvatar photoUrl={photoUrl} name={name || (gender === 'male' ? 'Husband' : 'Wife')} gender={gender} className="w-full h-full" imgClassName="w-full h-full object-cover object-top" />
        {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 text-heritage-gold animate-spin" /></div>}
        {photoUrl && !uploading && (
          <button type="button" onClick={() => onPhotoChange('')} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center" title="Remove">
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50 text-[#FAF7EE] text-[10px] font-semibold shadow transition-all">
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-heritage-gold-300" />}
        {uploading ? 'Uploading…' : photoUrl ? 'Change' : 'Upload Photo'}
      </button>
      {photoUrl && !uploading && <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />Uploaded</p>}
    </div>
  );
};

/* ─── Inline Couple Photo Upload ─── */
const CouplePhotoBlock: React.FC<{
  photoUrl: string;
  onPhotoChange: (url: string) => void;
}> = ({ photoUrl, onPhotoChange }) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File Too Large', 'File size exceeds 10MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Invalid Format', 'Please select JPG, PNG, or WEBP.'); return; }
    onPhotoChange(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await familyApi.uploadPhoto(file);
      if (res?.url) {
        onPhotoChange(res.url);
        toast.success('Photo Uploaded', 'Combined couple portrait attached.');
      }
    } catch {
      toast.error('Upload Notice', 'Upload failed. Preview retained locally.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-heritage-gold/80 shadow bg-heritage-cream/60 flex-shrink-0 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="Combined Couple Portrait" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="flex flex-col items-center justify-center text-heritage-gold-600/70 p-2 text-center">
            <Users className="w-8 h-8 text-heritage-maroon/60 mb-1" />
            <span className="text-[10px] font-semibold text-heritage-charcoal">Combined Photo</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-heritage-gold animate-spin" />
          </div>
        )}
        {photoUrl && !uploading && (
          <button
            type="button"
            onClick={() => onPhotoChange('')}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50 text-[#FAF7EE] text-xs font-semibold shadow transition-all cursor-pointer"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-heritage-gold-300" />}
          {uploading ? 'Uploading…' : photoUrl ? 'Change Photo' : 'Upload Combined Photo'}
        </button>
        <p className="text-[10px] text-heritage-muted leading-tight">
          Photo of husband & wife together. Displayed on the website home page.
        </p>
        {photoUrl && !uploading && (
          <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Combined photo attached
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Compact form field set ─── */
const PersonFields: React.FC<{
  form: PersonForm;
  onChange: (k: keyof PersonForm, v: string | boolean) => void;
  gender: 'male' | 'female';
  errors: Partial<Record<keyof PersonForm, string>>;
  onPhotoChange: (url: string) => void;
}> = ({ form, onChange, gender, errors, onPhotoChange }) => {
  const role = gender === 'male' ? 'Husband' : 'Wife';
  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Photo column — hidden on xs, shown sm+ */}
      <div className="hidden sm:flex flex-col items-center pt-6">
        <PhotoBlock photoUrl={form.photoUrl} name={form.fullName} gender={gender} onPhotoChange={onPhotoChange} />
      </div>

      {/* Fields column */}
      <div className="flex-1 space-y-3">
        {/* Photo upload — mobile only */}
        <div className="sm:hidden flex justify-center">
          <PhotoBlock photoUrl={form.photoUrl} name={form.fullName} gender={gender} onPhotoChange={onPhotoChange} />
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">
              {role}'s Full Name <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)}
              className={`w-full px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-heritage-maroon/20 ${errors.fullName ? 'border-rose-400' : 'border-heritage-border focus:border-heritage-maroon'} bg-[#FFFEFB]`}
            />
            {errors.fullName && <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" />{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Nickname <span className="text-heritage-muted font-normal">(Optional)</span></label>
            <input type="text" value={form.tamilName} onChange={(e) => onChange('tamilName', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB]"
            />
          </div>
        </div>

        {/* Date of Birth + Status row */}
        <div className="grid grid-cols-2 gap-2.5 items-end">
          <HeritageDateInput label="Date of Birth" value={form.birthDate} onChange={(v) => onChange('birthDate', v)} />
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Status</label>
            <label className="inline-flex items-center text-xs text-heritage-charcoal cursor-pointer gap-2 pt-1">
              <input type="checkbox" checked={form.isDeceased} onChange={(e) => onChange('isDeceased', e.target.checked)} className="rounded text-heritage-maroon mr-0 w-4 h-4" />
              Deceased
            </label>
          </div>
        </div>

        {/* Date of Demise — full width row, shown only if deceased */}
        {form.isDeceased && (
          <div className="grid grid-cols-2 gap-2.5">
            <HeritageDateInput label="Date of Demise" value={form.deathDate} onChange={(v) => onChange('deathDate', v)} />
            <div />
          </div>
        )}

        {/* Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Native Place</label>
            <input type="text" value={form.birthPlace} onChange={(e) => onChange('birthPlace', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Current City</label>
            <input type="text" value={form.currentCity} onChange={(e) => onChange('currentCity', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB]"
            />
          </div>
        </div>

        {/* Profession row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Education</label>
            <input type="text" value={form.education} onChange={(e) => onChange('education', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Profession</label>
            <input type="text" value={form.profession} onChange={(e) => onChange('profession', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB]"
            />
          </div>
        </div>

        {/* Biography */}
        <div>
          <label className="block text-[11px] font-semibold text-heritage-charcoal mb-0.5">Biography <span className="text-heritage-muted font-normal">(Optional)</span></label>
          <textarea rows={2} value={form.biography} onChange={(e) => onChange('biography', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-heritage-border focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB] resize-none"
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Main Wizard ─── */
export const Gen1SetupWizard: React.FC = () => {
  const { refreshData } = useAdmin();
  const toast = useToast();

  const [step, setStep] = useState<WizardStep>('welcome');
  const [husband, setHusband] = useState<PersonForm>(emptyPerson());
  const [wife, setWife] = useState<PersonForm>(emptyPerson());
  const [couplePhotoUrl, setCouplePhotoUrl] = useState('');
  const [coupleAbout, setCoupleAbout] = useState('');
  const [errors, setErrors] = useState<{ husband: Partial<Record<keyof PersonForm, string>>; wife: Partial<Record<keyof PersonForm, string>> }>({ husband: {}, wife: {} });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<{ husband: string; wife: string } | null>(null);

  const updateHusband = useCallback((k: keyof PersonForm, v: string | boolean) => {
    setHusband((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, husband: { ...e.husband, [k]: undefined } }));
  }, []);
  const updateWife = useCallback((k: keyof PersonForm, v: string | boolean) => {
    setWife((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, wife: { ...e.wife, [k]: undefined } }));
  }, []);

  const validateHusband = () => {
    const errs: Partial<Record<keyof PersonForm, string>> = {};
    if (!husband.fullName.trim()) errs.fullName = "Husband's name is required.";
    setErrors((e) => ({ ...e, husband: errs }));
    return !errs.fullName;
  };
  const validateWife = () => {
    const errs: Partial<Record<keyof PersonForm, string>> = {};
    if (!wife.fullName.trim()) errs.fullName = "Wife's name is required.";
    setErrors((e) => ({ ...e, wife: errs }));
    return !errs.fullName;
  };

  const handleSave = async () => {
    setSaveError(null);
    setStep('saving');
    try {
      const h = await familyApi.createMember({
        firstName: husband.fullName.split(' ')[0], lastName: husband.fullName.split(' ').slice(1).join(' ') || 'KMK',
        fullName: husband.fullName.trim(), tamilName: husband.tamilName || husband.fullName.trim(),
        gender: 'male', birthDate: husband.birthDate || undefined, deathDate: husband.isDeceased ? husband.deathDate || undefined : undefined,
        isDeceased: husband.isDeceased, photoUrl: husband.photoUrl || undefined,
        couplePhotoUrl: couplePhotoUrl || undefined,
        coupleAbout: coupleAbout.trim() || undefined,
        education: husband.education || undefined, profession: husband.profession || undefined,
        birthPlace: husband.birthPlace || undefined, currentCity: husband.currentCity || undefined,
        biography: husband.biography || undefined,
        generation: 1, branchId: 'root', branchName: 'Founding Roots', branchNameTamil: 'Founding Roots',
        childIds: [], tags: ['Generation 1', 'Founding Ancestor'],
      });
      const w = await familyApi.createMember({
        firstName: wife.fullName.split(' ')[0], lastName: wife.fullName.split(' ').slice(1).join(' ') || 'KMK',
        fullName: wife.fullName.trim(), tamilName: wife.tamilName || wife.fullName.trim(),
        gender: 'female', birthDate: wife.birthDate || undefined, deathDate: wife.isDeceased ? wife.deathDate || undefined : undefined,
        isDeceased: wife.isDeceased, photoUrl: wife.photoUrl || undefined,
        couplePhotoUrl: couplePhotoUrl || undefined,
        coupleAbout: coupleAbout.trim() || undefined,
        education: wife.education || undefined, profession: wife.profession || undefined,
        birthPlace: wife.birthPlace || undefined, currentCity: wife.currentCity || undefined,
        biography: wife.biography || undefined,
        generation: 1, branchId: 'root', branchName: 'Founding Roots', branchNameTamil: 'Founding Roots',
        spouseId: h.id, childIds: [], tags: ['Generation 1', 'Founding Ancestor'],
      });
      await familyApi.updateMember(h.id, {
        spouseId: w.id,
        couplePhotoUrl: couplePhotoUrl || undefined,
        coupleAbout: coupleAbout.trim() || undefined,
      });
      await refreshData();
      setSavedNames({ husband: husband.fullName, wife: wife.fullName });
      toast.success('Generation 1 Created!', `"${husband.fullName}" & "${wife.fullName}" registered as founders.`);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: ['#702D3B', '#B6955B', '#E8D7B0', '#FAF7EE'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed. Try again.';
      setSaveError(msg);
      toast.error('Save Failed', msg);
      setStep('review');
    }
  };

  /* ═══════════════ WELCOME ═══════════════ */
  if (step === 'welcome') return (
    <div className="min-h-screen bg-heritage-ivory flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-heritage-maroon flex items-center justify-center shadow-xl mx-auto">
          <TreePine className="w-8 h-8 text-heritage-gold-200" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-heritage-gold-700 uppercase tracking-widest">First Time Setup</p>
          <h1 className="font-serif text-2xl font-bold text-heritage-charcoal">Welcome to Family Archive</h1>
          <p className="text-xs text-heritage-muted leading-relaxed">Start by registering the <strong className="text-heritage-charcoal">Generation 1 founding couple</strong> — the root of your family tree.</p>
        </div>
        <div className="bg-[#FFFEFB] rounded-xl border border-heritage-border p-4 text-left space-y-2.5">
          {[
            { icon: User, t: 'Step 1', d: 'Enter Husband details & photo' },
            { icon: Users, t: 'Step 2', d: 'Enter Wife details & photo' },
            { icon: Sparkles, t: 'Step 3', d: 'Add couple photo, story & review' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-heritage-maroon/10 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-3.5 h-3.5 text-heritage-maroon" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-heritage-charcoal">{s.t}</p>
                <p className="text-[10px] text-heritage-muted">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setStep('husband')}
          className="w-full py-3 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group">
          <Sparkles className="w-4 h-4 text-heritage-gold-300" />
          Begin Setup
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-[10px] text-heritage-muted">After Gen 1 is saved, add children & expand the tree.</p>
      </div>
    </div>
  );

  /* ═══════════════ SAVING / SUCCESS ═══════════════ */
  if (step === 'saving') {
    if (savedNames) {
      setTimeout(() => window.location.reload(), 2000);
      return (
        <div className="min-h-screen bg-heritage-ivory flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shadow mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-heritage-charcoal">Family Tree Started!</h2>
              <p className="text-xs text-heritage-muted mt-1">Generation 1 has been saved successfully.</p>
            </div>
            <div className="bg-[#FFFEFB] rounded-xl border border-heritage-border p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-blue-700" /></div>
                <div className="text-left"><p className="text-[10px] text-heritage-muted">Husband — Gen 1</p><p className="text-sm font-bold text-heritage-charcoal">{savedNames.husband}</p></div>
              </div>
              <div className="flex justify-center"><Heart className="w-4 h-4 text-heritage-gold-400 fill-heritage-gold-300" /></div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0"><UserCheck className="w-4 h-4 text-rose-600" /></div>
                <div className="text-left"><p className="text-[10px] text-heritage-muted">Wife — Gen 1</p><p className="text-sm font-bold text-heritage-charcoal">{savedNames.wife}</p></div>
              </div>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-heritage-gold-600 mx-auto" />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-heritage-ivory flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-heritage-maroon animate-spin mx-auto" />
          <p className="text-sm text-heritage-muted font-medium">Saving to archive…</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ HUSBAND / WIFE / REVIEW ═══════════════ */
  const isHusband = step === 'husband';
  const isWife = step === 'wife';
  const isReview = step === 'review';

  return (
    <div className="min-h-screen bg-heritage-ivory flex flex-col">
      {/* Sticky compact header */}
      <div className="sticky top-0 z-10 bg-heritage-ivory border-b border-heritage-border px-4 py-3 flex items-center gap-3">
        {/* Progress pills */}
        <div className="flex items-center gap-1.5 flex-1">
          {(['husband', 'wife', 'review'] as const).map((s, idx) => {
            const labels = ['1. Husband', '2. Wife', '3. Couple & Review'];
            const active = step === s;
            const done = (isWife && idx === 0) || (isReview && idx < 2);
            return (
              <React.Fragment key={s}>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${active ? 'bg-heritage-maroon text-[#FAF7EE]' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-heritage-cream text-heritage-muted'}`}>
                  {done ? '✓ ' : ''}{labels[idx]}
                </div>
                {idx < 2 && <ChevronRight className="w-3 h-3 text-heritage-border flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-[10px] text-heritage-muted hidden sm:block">Generation 1 Setup</p>
      </div>

      {/* Form card */}
      <div className="flex-1 p-3 sm:p-5 max-w-3xl w-full mx-auto">
        <div className="bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-sm overflow-hidden">

          {/* Husband */}
          {isHusband && (
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-bold text-heritage-gold-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Husband Details — Generation 1
              </p>
              <PersonFields form={husband} onChange={updateHusband} gender="male" errors={errors.husband} onPhotoChange={(url) => updateHusband('photoUrl', url)} />
            </div>
          )}

          {/* Wife */}
          {isWife && (
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-bold text-heritage-gold-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Wife Details — Generation 1
              </p>
              <PersonFields form={wife} onChange={updateWife} gender="female" errors={errors.wife} onPhotoChange={(url) => updateWife('photoUrl', url)} />
            </div>
          )}

          {/* Review */}
          {isReview && (
            <div className="p-4 sm:p-5 space-y-4">
              {saveError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{saveError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Husband card */}
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3 space-y-2">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3" /> Husband — Gen 1</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-blue-200 flex-shrink-0">
                      <PersonAvatar photoUrl={husband.photoUrl} name={husband.fullName} gender="male" className="w-full h-full" imgClassName="w-full h-full object-cover object-top" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-heritage-charcoal text-xs leading-tight truncate">{husband.fullName}</p>
                      {husband.birthDate && <p className="text-[10px] text-heritage-muted">Born: {husband.birthDate}</p>}
                      {husband.profession && <p className="text-[10px] text-heritage-muted truncate">{husband.profession}</p>}
                      {husband.birthPlace && <p className="text-[10px] text-heritage-muted">From: {husband.birthPlace}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('husband')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-[#FFFEFB] hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 text-blue-600" />
                    <span>Edit Husband</span>
                  </button>
                </div>
                {/* Wife card */}
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50/40 p-3 space-y-2">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1"><UserCheck className="w-3 h-3" /> Wife — Gen 1</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-rose-200 flex-shrink-0">
                      <PersonAvatar photoUrl={wife.photoUrl} name={wife.fullName} gender="female" className="w-full h-full" imgClassName="w-full h-full object-cover object-top" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-heritage-charcoal text-xs leading-tight truncate">{wife.fullName}</p>
                      {wife.birthDate && <p className="text-[10px] text-heritage-muted">Born: {wife.birthDate}</p>}
                      {wife.profession && <p className="text-[10px] text-heritage-muted truncate">{wife.profession}</p>}
                      {wife.birthPlace && <p className="text-[10px] text-heritage-muted">From: {wife.birthPlace}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('wife')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-[#FFFEFB] hover:bg-rose-50 border border-rose-200 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 text-rose-600" />
                    <span>Edit Wife</span>
                  </button>
                </div>
              </div>
              {/* Couple banner */}
              <div className="flex items-center justify-center gap-3 py-2 px-4 bg-heritage-gold-50 rounded-xl border border-heritage-gold-200">
                <span className="text-xs font-semibold text-heritage-charcoal truncate max-w-[120px]">{husband.fullName}</span>
                <Heart className="w-4 h-4 text-heritage-gold-500 fill-heritage-gold-300 flex-shrink-0" />
                <span className="text-xs font-semibold text-heritage-charcoal truncate max-w-[120px]">{wife.fullName}</span>
              </div>

              {/* Founding Couple Combined Photo & Story (For Website Founders Section) */}
              <div className="rounded-2xl border-2 border-heritage-gold/60 bg-gradient-to-br from-[#FFFDF9] via-heritage-gold-50/20 to-heritage-cream/30 p-4 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-heritage-gold/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-heritage-gold-100 flex items-center justify-center text-heritage-maroon">
                      <Sparkles className="w-3.5 h-3.5 text-heritage-gold-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-heritage-maroon font-serif">
                        Website Founders Presentation (Combined Details)
                      </h4>
                      <p className="text-[10px] text-heritage-muted">
                        Shown on the website homepage for the Generation 1 founding couple
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-heritage-gold-800 bg-heritage-gold-100/80 px-2 py-0.5 rounded-full border border-heritage-gold-300">
                    Website Feature
                  </span>
                </div>

                {/* Combine Photo Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-heritage-charcoal mb-1">
                    Combined Couple Photo <span className="text-heritage-muted font-normal">(Husband & Wife together)</span>
                  </label>
                  <CouplePhotoBlock photoUrl={couplePhotoUrl} onPhotoChange={setCouplePhotoUrl} />
                </div>

                {/* Combine About Textarea */}
                <div>
                  <label className="block text-[11px] font-semibold text-heritage-charcoal mb-1">
                    Combined Family Story / Founders About <span className="text-heritage-muted font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={coupleAbout}
                    onChange={(e) => setCoupleAbout(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-heritage-gold/40 focus:outline-none focus:border-heritage-maroon bg-[#FFFEFB] shadow-inner resize-none"
                  />
                  <p className="text-[10px] text-heritage-muted mt-0.5">
                    Leave blank to use the individual biography or default archival tribute.
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-heritage-muted bg-heritage-ivory rounded-xl p-3 border border-heritage-border leading-relaxed">
                <strong className="text-heritage-charcoal">After saving:</strong> Both will be Generation 1, linked as husband and wife. You can then add Gen 2 children from the dashboard.
              </p>
            </div>
          )}

          {/* Footer nav */}
          <div className="px-4 sm:px-5 py-3 border-t border-heritage-border/60 flex items-center justify-between bg-heritage-cream/20">
            <button
              type="button"
              onClick={() => setStep(isHusband ? 'welcome' : isWife ? 'husband' : 'wife')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-heritage-border bg-[#FFFEFB] hover:bg-heritage-cream/80 hover:border-heritage-gold/50 text-heritage-charcoal text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 group active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-heritage-muted group-hover:text-heritage-maroon group-hover:-translate-x-0.5 transition-all" />
              <span>{isHusband ? 'Back' : isWife ? 'Back to Husband' : 'Back to Wife'}</span>
            </button>

            {isHusband && (
              <button onClick={() => { if (validateHusband()) setStep('wife'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-bold shadow transition-all">
                Next: Wife Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isWife && (
              <button onClick={() => { if (validateWife()) setStep('review'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-bold shadow transition-all">
                Next: Couple & Review <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isReview && (
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-lg transition-all">
                <CheckCircle2 className="w-3.5 h-3.5" /> Save Generation 1
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-[10px] text-heritage-muted mt-2">Both names are required. All other fields optional.</p>
      </div>
    </div>
  );
};
