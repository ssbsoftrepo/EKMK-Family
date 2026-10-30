import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { Gender } from '../../types/family';
import { HeritageSelect, SelectOption } from '../Common/HeritageSelect';
import { HeritageDateInput } from '../Common/HeritageDateInput';
import { PersonAvatar } from '../Common/PersonAvatar';
import { familyApi } from '../../api/familyApi';
import { X, UserPlus, Sparkles, CheckCircle2, Upload, Loader2, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';

interface Props {
  onClose: () => void;
  defaultParentId?: string;
}

export const AddMemberModal: React.FC<Props> = ({ onClose, defaultParentId }) => {
  const { members, branches, addMember } = useAdmin();
  const toast = useToast();

  // Multi-step form step (1 = Basic Info, 2 = Relationships, 3 = Professional & Heritage)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Server Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'File size exceeds 10MB. Please choose a smaller photo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid Format', 'Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Immediate local preview for responsive UX
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);
    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const res = await familyApi.uploadPhoto(file);
      if (res?.url) {
        setPhotoUrl(res.url);
        toast.success('Photo Uploaded', 'Portrait photo attached successfully.');
      }
    } catch (err: unknown) {
      console.warn('Server upload notice:', err);
      // Fallback: file reader base64 if server upload endpoint is temporarily unreachable
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) setPhotoUrl(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Preset default parent relationships cleanly based on parent gender
  const initialRelations = useMemo(() => {
    if (!defaultParentId) return { fatherId: '', motherId: '', branchId: 'root' };
    const p = members.find((m) => m.id === defaultParentId);
    if (!p) return { fatherId: '', motherId: '', branchId: 'root' };

    let fId = '';
    let mId = '';
    if (p.gender === 'female') {
      mId = p.id;
      fId = p.spouseId || '';
    } else {
      fId = p.id;
      mId = p.spouseId || '';
    }
    return { fatherId: fId, motherId: mId, branchId: p.branchId || 'root' };
  }, [defaultParentId, members]);

  // Relationships
  const [fatherId, setFatherId] = useState<string>(initialRelations.fatherId);
  const [motherId, setMotherId] = useState<string>(initialRelations.motherId);
  const [spouseId, setSpouseId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialRelations.branchId);

  // Check if member is Generation 1 (no parents)
  const isGen1 = useMemo(() => {
    return !fatherId && !motherId;
  }, [fatherId, motherId]);

  // Prevent background scroll when modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.warning('Name Required', 'Please enter Full Name.');
      setStep(1);
      return;
    }

    let calculatedGen = 1;
    let branchId = 'root';
    let branchName = 'Founding Roots';
    let branchNameTamil = 'Founding Roots';

    if (fatherId) {
      const f = members.find((m) => m.id === fatherId);
      if (f) {
        calculatedGen = f.generation + 1;
        branchId = f.branchId || 'root';
        branchName = f.branchName || 'Founding Roots';
        branchNameTamil = f.branchNameTamil || branchName;
      }
    } else if (motherId) {
      const m = members.find((m) => m.id === motherId);
      if (m) {
        calculatedGen = m.generation + 1;
        branchId = m.branchId || 'root';
        branchName = m.branchName || 'Founding Roots';
        branchNameTamil = m.branchNameTamil || branchName;
      }
    } else if (spouseId) {
      const s = members.find((m) => m.id === spouseId);
      if (s) {
        calculatedGen = s.generation;
        branchId = s.branchId || 'root';
        branchName = s.branchName || 'Founding Roots';
        branchNameTamil = s.branchNameTamil || branchName;
      }
    } else {
      // 1st Generation Founding Ancestor
      calculatedGen = 1;
      branchId = 'root';
      branchName = 'Founding Roots';
      branchNameTamil = 'Founding Roots';
    }

    setIsSubmitting(true);
    try {
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

      if (newMemberId) {
        toast.success('Member Added', `"${fullName.trim()}" was successfully registered.`);
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
      } else {
        toast.error('Add Failed', 'Failed to register member. Please check details and try again.');
      }
    } catch (err: unknown) {
      toast.error('Add Failed', err instanceof Error ? err.message : 'Unable to register member');
    } finally {
      setIsSubmitting(false);
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
                  />
                </div>
              )}

              {/* Photo Upload (Direct file upload only, no external link) */}
              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal mb-1.5">
                  Portrait Photograph <span className="text-heritage-muted font-normal">(Server File Upload)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-heritage-ivory/70 border border-heritage-border rounded-2xl">
                  {/* Live Avatar Preview */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-heritage-gold/70 bg-heritage-cream shadow-sm flex-shrink-0 relative group">
                    <PersonAvatar
                      photoUrl={photoUrl}
                      name={fullName || 'New Member'}
                      gender={gender}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                    {photoUrl && !isUploadingPhoto && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        title="Remove photo"
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold cursor-pointer"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-heritage-gold animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50 text-[#FAF7EE] text-xs font-semibold shadow-heritage-sm transition-all cursor-pointer"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-heritage-gold-300" />
                            <span>Uploading to Server...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-heritage-gold-300" />
                            <span>{photoUrl ? 'Change Portrait Photo' : 'Upload Portrait Photo'}</span>
                          </>
                        )}
                      </button>

                      {photoUrl && !isUploadingPhoto && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-3 py-2 rounded-xl border border-heritage-border text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <p className="text-[11px] text-heritage-muted leading-relaxed">
                      Supports JPG, PNG, or WEBP up to 10MB. Photos are stored securely in the server archive and served with HTTP caching.
                    </p>

                    {photoUrl && !isUploadingPhoto && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center sm:justify-start space-x-1.5 pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Photo attached to record successfully</span>
                      </p>
                    )}

                    {uploadError && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Relationships */}
          {step === 2 && (
            <div className="space-y-4">
              {isGen1 ? (
                <div className="p-3.5 bg-heritage-gold-50/90 border border-heritage-gold-300 rounded-xl flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-heritage-gold-700 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-heritage-maroon uppercase tracking-wider">
                      Generation 1 • Founding Root Lineage
                    </p>
                    <p className="text-[11px] text-heritage-muted leading-relaxed">
                      With no parents selected, this relative is registered as a <strong>Generation 1 Founding Ancestor</strong>. They will establish the root lineage for the family tree without needing to choose a child branch.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-heritage-gold-50 border border-heritage-gold-200 rounded-xl text-xs text-heritage-gold-900 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-heritage-gold-700 flex-shrink-0 mt-0.5" />
                  <span>
                    Select the father, mother, or spouse. You can search by name or clear any selection with the ✕ button at any time.
                  </span>
                </div>
              )}

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

              {!isGen1 && branchOptions.length > 0 && (
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
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#FFFEFB] hover:bg-heritage-cream/80 text-heritage-charcoal border border-heritage-border hover:border-heritage-gold/50 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 group active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-heritage-muted group-hover:text-heritage-maroon group-hover:-translate-x-0.5 transition-all" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] rounded-xl shadow-heritage-sm transition-all duration-200 group active:scale-95 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-heritage-gold-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50 text-[#FAF7EE] rounded-xl shadow-heritage-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-heritage-gold-300" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-heritage-gold-300" />
                  )}
                  <span>{isSubmitting ? 'Registering...' : 'Save & Generate in Tree'}</span>
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
