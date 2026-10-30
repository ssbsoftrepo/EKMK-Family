import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { Gender } from '../../types/family';
import { HeritageSelect, SelectOption } from '../Common/HeritageSelect';
import { HeritageDateInput } from '../Common/HeritageDateInput';
import { X, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onClose: () => void;
  defaultParentId?: string;
}

export const AddMemberModal: React.FC<Props> = ({ onClose, defaultParentId }) => {
  const { members, branches, addMember, locateInTree } = useAdmin();

  // Multi-step form step (1 = Basic Info, 2 = Relationships, 3 = Professional & Heritage)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('KMK');
  const [fullName, setFullName] = useState('');
  const [tamilName, setTamilName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [business, setBusiness] = useState('');
  const [birthPlace, setBirthPlace] = useState('Erode');
  const [currentCity, setCurrentCity] = useState('Erode');
  const [biography, setBiography] = useState('');

  // Preset default parent relationships cleanly based on parent gender
  const initialRelations = useMemo(() => {
    if (!defaultParentId) return { fatherId: '', motherId: '', branchId: 'branch-shanmuga' };
    const p = members.find((m) => m.id === defaultParentId);
    if (!p) return { fatherId: '', motherId: '', branchId: 'branch-shanmuga' };

    let fId = '';
    let mId = '';
    if (p.gender === 'female') {
      mId = p.id;
      fId = p.spouseId || '';
    } else {
      fId = p.id;
      mId = p.spouseId || '';
    }
    return { fatherId: fId, motherId: mId, branchId: p.branchId || 'branch-shanmuga' };
  }, [defaultParentId, members]);

  // Relationships
  const [fatherId, setFatherId] = useState<string>(initialRelations.fatherId);
  const [motherId, setMotherId] = useState<string>(initialRelations.motherId);
  const [spouseId, setSpouseId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialRelations.branchId);

  // Prevent background scroll when modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Preset portrait avatars for quick demonstration
  const PRESET_AVATARS = [
    { label: 'Elder Patriarch', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    { label: 'Elder Matriarch', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' },
    { label: 'Young Man', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
    { label: 'Young Woman', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
    { label: 'Child / Toddler', url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('Please enter Full Name.');
      return;
    }

    let calculatedGen = 3;
    let branchId = selectedBranchId;
    let branchName = 'Shanmugasundaram Branch';
    let branchNameTamil = 'Shanmugasundaram Branch';

    if (fatherId) {
      const f = members.find((m) => m.id === fatherId);
      if (f) {
        calculatedGen = f.generation + 1;
        branchId = f.branchId;
        branchName = f.branchName;
        branchNameTamil = f.branchNameTamil;
      }
    } else if (motherId) {
      const m = members.find((m) => m.id === motherId);
      if (m) {
        calculatedGen = m.generation + 1;
        branchId = m.branchId;
        branchName = m.branchName;
        branchNameTamil = m.branchNameTamil;
      }
    } else if (spouseId) {
      const s = members.find((m) => m.id === spouseId);
      if (s) {
        calculatedGen = s.generation;
        branchId = s.branchId;
        branchName = s.branchName;
        branchNameTamil = s.branchNameTamil;
      }
    } else {
      const br = branches.find((b) => b.id === selectedBranchId);
      if (br) {
        branchName = br.name;
        branchNameTamil = br.tamilName;
      }
    }

    const newMemberId = await addMember({
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName,
      fullName: fullName.trim(),
      tamilName: tamilName.trim() || fullName.trim(),
      gender,
      birthDate: birthDate || undefined,
      deathDate: isDeceased ? deathDate || undefined : undefined,
      isDeceased,
      photoUrl: photoUrl.trim() || undefined,
      education: education.trim() || undefined,
      profession: profession.trim() || undefined,
      business: business.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      currentCity: currentCity.trim() || undefined,
      biography: biography.trim() || undefined,
      generation: calculatedGen,
      branchId,
      branchName,
      branchNameTamil,
      fatherId: fatherId || undefined,
      motherId: motherId || undefined,
      spouseId: spouseId || undefined,
      childIds: [],
      tags: ['Newly Added'],
    });

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#702D3B', '#B6955B', '#E8D7B0'],
      });
    } catch {
      // ignore
    }

    onClose();
    if (newMemberId) {
      locateInTree(newMemberId);
    }
  };

  // Build Select Options for HeritageSelect
  const fatherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.gender === 'male')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members]);

  const motherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.gender === 'female')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members]);

  const spouseOptions: SelectOption[] = useMemo(() => {
    return members.map((m) => {
      let sub = `${m.branchName || 'Family Branch'}`;
      if (m.spouseId) {
        const currentSpouse = members.find((s) => s.id === m.spouseId);
        sub += ` (Currently spouse of ${currentSpouse?.fullName || m.spouseId})`;
      } else {
        sub += ' • Unmarried / Available';
      }
      return {
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: sub,
      };
    });
  }, [members]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: b.name,
      sublabel: b.tamilName,
    }));
  }, [branches]);

  const genderOptions: SelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-heritage-charcoal/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FFFEFB] rounded-2xl border-2 border-heritage-gold/60 shadow-heritage-lg overflow-hidden flex flex-col max-h-[92vh] my-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-heritage-maroon text-[#FAF7EE] p-4 sm:p-5 flex items-center justify-between border-b border-heritage-gold/40 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-heritage-gold-300" />
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold">New Family Member Registration</h2>
              <p className="text-xs text-heritage-gold-200">
                Add Family Member • Automatically placed in family tree
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Navigation Pills */}
        <div className="flex items-center justify-around bg-heritage-cream/40 border-b border-heritage-border py-2 text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`font-semibold px-3 py-1 rounded-full transition-colors ${
              step === 1 ? 'bg-heritage-maroon text-[#FAF7EE]' : 'text-heritage-muted hover:text-heritage-charcoal'
            }`}
          >
            1. Basic Information
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`font-semibold px-3 py-1 rounded-full transition-colors ${
              step === 2 ? 'bg-heritage-maroon text-[#FAF7EE]' : 'text-heritage-muted hover:text-heritage-charcoal'
            }`}
          >
            2. Family Relationships
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`font-semibold px-3 py-1 rounded-full transition-colors ${
              step === 3 ? 'bg-heritage-maroon text-[#FAF7EE]' : 'text-heritage-muted hover:text-heritage-charcoal'
            }`}
          >
            3. Personal & Roots
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Full Name (English) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KMK S. Balakrishnan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon focus:ring-2 focus:ring-heritage-maroon/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Known As / Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Balu, KMK Jr."
                    value={tamilName}
                    onChange={(e) => setTamilName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon focus:ring-2 focus:ring-heritage-maroon/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <HeritageSelect
                  label="Gender"
                  value={gender}
                  onChange={(v) => setGender((v as Gender) || 'male')}
                  options={genderOptions}
                  allowClear={false}
                  searchable={false}
                  required
                />

                <HeritageDateInput
                  label="Date of Birth"
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder="YYYY-MM-DD"
                />

                <div className="pb-1">
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Status
                  </label>
                  <label className="inline-flex items-center text-xs text-heritage-charcoal cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isDeceased}
                      onChange={(e) => setIsDeceased(e.target.checked)}
                      className="rounded text-heritage-maroon focus:ring-heritage-gold mr-2 w-4 h-4"
                    />
                    Deceased
                  </label>
                </div>
              </div>

              {isDeceased && (
                <div className="sm:w-1/2">
                  <HeritageDateInput
                    label="Date of Demise"
                    value={deathDate}
                    onChange={setDeathDate}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              )}

              {/* Photo URL & Presets */}
              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Paste image link, or select sample preset below"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon focus:ring-2 focus:ring-heritage-maroon/15"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-heritage-muted mr-1">Sample presets:</span>
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(preset.url)}
                      className="px-2 py-0.5 rounded-lg bg-heritage-cream/50 hover:bg-heritage-cream text-[10px] font-medium text-heritage-charcoal border border-heritage-border transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Relationships */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-heritage-gold-50 border border-heritage-gold-200 rounded-xl text-xs text-heritage-gold-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-heritage-gold-700 flex-shrink-0 mt-0.5" />
                <span>
                  Select the father, mother, or spouse. You can search by name or clear any selection with the ✕ button at any time.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HeritageSelect
                  label="Select Father"
                  value={fatherId}
                  onChange={setFatherId}
                  options={fatherOptions}
                  placeholder="Search & choose father..."
                  emptyOptionLabel="None / Unknown Father"
                  searchable
                  allowClear
                />

                <HeritageSelect
                  label="Select Mother"
                  value={motherId}
                  onChange={setMotherId}
                  options={motherOptions}
                  placeholder="Search & choose mother..."
                  emptyOptionLabel="None / Unknown Mother"
                  searchable
                  allowClear
                />
              </div>

              <HeritageSelect
                label="Select Spouse (if already registered in family archive)"
                value={spouseId}
                onChange={setSpouseId}
                options={spouseOptions}
                placeholder="Search & choose spouse..."
                emptyOptionLabel="None / Not Married / Unregistered"
                searchable
                allowClear
              />

              {!fatherId && !motherId && (
                <HeritageSelect
                  label="Primary Family Branch"
                  value={selectedBranchId}
                  onChange={setSelectedBranchId}
                  options={branchOptions}
                  placeholder="Select primary branch..."
                  allowClear={false}
                  searchable={false}
                />
              )}
            </div>
          )}

          {/* STEP 3: Professional & Heritage */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.E. (Mech), M.B.A., M.B.B.S."
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Doctor, Agriculturist"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Business / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KMK Textile Mills, Perundurai Farms"
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                    Current Location / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Erode, Coimbatore, Chennai, USA"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                  Short Biography / Family Memories
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short note about this person's contributions, life story or passions..."
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-heritage-border flex items-center justify-between flex-shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-semibold bg-heritage-cream/60 hover:bg-heritage-cream text-heritage-charcoal rounded-xl transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] rounded-xl transition-colors shadow-sm"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] rounded-xl shadow-heritage-sm flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-heritage-gold-300" />
                  <span>Save & Generate in Tree</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
