import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { FamilyMember, Gender } from '../../types/family';
import { HeritageSelect, SelectOption } from '../Common/HeritageSelect';
import { HeritageDateInput } from '../Common/HeritageDateInput';
import { X, Edit3, Trash2, CheckCircle2, Heart, Users, Sparkles } from 'lucide-react';

interface Props {
  member: FamilyMember;
  onClose: () => void;
}

export const EditMemberModal: React.FC<Props> = ({ member, onClose }) => {
  const { updateMember, deleteMember, members, branches } = useAdmin();

  // Basic Details
  const [fullName, setFullName] = useState(member.fullName);
  const [tamilName, setTamilName] = useState(member.tamilName || '');
  const [gender, setGender] = useState<Gender>(member.gender);
  const [birthDate, setBirthDate] = useState(member.birthDate || '');
  const [deathDate, setDeathDate] = useState(member.deathDate || '');
  const [isDeceased, setIsDeceased] = useState(member.isDeceased);
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || '');

  // Relationships
  const [fatherId, setFatherId] = useState<string>(member.fatherId || '');
  const [motherId, setMotherId] = useState<string>(member.motherId || '');
  const [spouseId, setSpouseId] = useState<string>(member.spouseId || '');
  const [branchId, setBranchId] = useState<string>(member.branchId || '');

  // Professional & Personal
  const [education, setEducation] = useState(member.education || '');
  const [profession, setProfession] = useState(member.profession || '');
  const [business, setBusiness] = useState(member.business || '');
  const [currentCity, setCurrentCity] = useState(member.currentCity || '');
  const [birthPlace, setBirthPlace] = useState(member.birthPlace || '');
  const [biography, setBiography] = useState(member.biography || '');

  // Prevent background scroll while modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine branch name if branch was changed
    let bName = member.branchName;
    let bNameTamil = member.branchNameTamil;
    if (branchId && branchId !== member.branchId) {
      const selectedB = branches.find((b) => b.id === branchId);
      if (selectedB) {
        bName = selectedB.name;
        bNameTamil = selectedB.tamilName;
      }
    }

    await updateMember(member.id, {
      fullName: fullName.trim(),
      tamilName: tamilName.trim(),
      gender,
      birthDate: birthDate || undefined,
      deathDate: isDeceased ? deathDate || undefined : undefined,
      isDeceased,
      photoUrl: photoUrl.trim() || undefined,
      education: education.trim() || undefined,
      profession: profession.trim() || undefined,
      business: business.trim() || undefined,
      currentCity: currentCity.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      biography: biography.trim() || undefined,
      // Explicitly pass empty string if cleared so backend can distinguish from undefined
      spouseId: spouseId || '',
      fatherId: fatherId || '',
      motherId: motherId || '',
      branchId: branchId || undefined,
      branchName: bName,
      branchNameTamil: bNameTamil,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove "${member.fullName}" from the family tree? This will detach related spouse/parent connections.`)) {
      deleteMember(member.id);
      onClose();
    }
  };

  // Build Select Options for HeritageSelect
  const fatherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.id !== member.id && m.gender === 'male')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members, member.id]);

  const motherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.id !== member.id && m.gender === 'female')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members, member.id]);

  const spouseOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.id !== member.id)
      .map((m) => {
        let sub = `${m.branchName || 'Family Branch'}`;
        if (m.id === member.spouseId) {
          sub += ' • (Current Spouse)';
        } else if (m.spouseId) {
          const currentPartner = members.find((s) => s.id === m.spouseId);
          sub += ` (Linked with ${currentPartner?.fullName || m.spouseId})`;
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
  }, [members, member.id, member.spouseId]);

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
            <Edit3 className="w-5 h-5 text-heritage-gold-300" />
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold">Edit Family Member Details</h2>
              <p className="text-xs text-heritage-gold-200">
                {member.fullName} • Generation {member.generation} ({member.id})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-1 border-b border-heritage-border text-heritage-maroon">
              <Users className="w-4 h-4 text-heritage-gold-600" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                1. Basic Identification
              </h3>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                Profile Photo URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon focus:ring-2 focus:ring-heritage-maroon/15"
              />
            </div>
          </div>

          {/* Section 2: Family Relationships (Spouse, Father, Mother, Branch) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 pb-1 border-b border-heritage-border text-heritage-maroon">
              <Heart className="w-4 h-4 text-heritage-gold-600" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                2. Family Relationships & Lineage
              </h3>
            </div>

            {/* Spouse Link with Clear option */}
            <HeritageSelect
              label="Spouse (Partner in Marriage)"
              value={spouseId}
              onChange={setSpouseId}
              options={spouseOptions}
              placeholder="Select spouse or click ✕ to clear..."
              emptyOptionLabel="None / Unmarried / Clear Spouse"
              helperText="Selecting a spouse automatically establishes the reciprocal spouse link on both family records."
              searchable
              allowClear
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HeritageSelect
                label="Father"
                value={fatherId}
                onChange={setFatherId}
                options={fatherOptions}
                placeholder="Choose father..."
                emptyOptionLabel="None / Unknown Father"
                searchable
                allowClear
              />

              <HeritageSelect
                label="Mother"
                value={motherId}
                onChange={setMotherId}
                options={motherOptions}
                placeholder="Choose mother..."
                emptyOptionLabel="None / Unknown Mother"
                searchable
                allowClear
              />
            </div>

            <HeritageSelect
              label="Assigned Family Branch"
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              placeholder="Select lineage branch..."
              allowClear={false}
              searchable={false}
            />
          </div>

          {/* Section 3: Professional & Heritage */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 pb-1 border-b border-heritage-border text-heritage-maroon">
              <Sparkles className="w-4 h-4 text-heritage-gold-600" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                3. Professional & Background
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                  Education
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.E. (Mech), M.B.B.S."
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                  Profession / Enterprise
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Advocate, Agriculturist"
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
                  placeholder="e.g. KMK Mills"
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
                  placeholder="e.g. Erode, Coimbatore, Chennai"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                Short Biography / Personal Notes
              </label>
              <textarea
                rows={3}
                placeholder="Personal history, community leadership, family stories..."
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
              />
            </div>
          </div>

          {/* Actions & Delete Button */}
          <div className="pt-4 border-t border-heritage-border flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors border border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Member</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-heritage-cream/50 hover:bg-heritage-cream text-heritage-charcoal rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] rounded-xl shadow-heritage-sm flex items-center space-x-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-heritage-gold-300" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
