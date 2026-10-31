import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { FamilyMember, Gender } from '../../types/family';
import { HeritageSelect, SelectOption } from '../Common/HeritageSelect';
import { HeritageDateInput } from '../Common/HeritageDateInput';
import { PersonAvatar } from '../Common/PersonAvatar';
import { familyApi } from '../../api/familyApi';
import { X, Edit3, Trash2, CheckCircle2, Heart, Users, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HeritageConfirmModal } from '../Common/HeritageConfirmModal';

interface Props {
  member: FamilyMember;
  onClose: () => void;
}

export const EditMemberModal: React.FC<Props> = ({ member, onClose }) => {
  const { updateMember, deleteMember, members, branches } = useAdmin();
  const toast = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const initialSpouseIds = useMemo(() => {
    if (member.spouseIds && member.spouseIds.length > 0) {
      return member.spouseIds;
    }
    return member.spouseId ? [member.spouseId] : [];
  }, [member.spouseIds, member.spouseId]);
  const [spouseIds, setSpouseIds] = useState<string[]>(initialSpouseIds);
  const [branchId, setBranchId] = useState<string>(member.branchId || '');
  const [branchName, setBranchName] = useState<string>(member.branchName && member.branchName !== 'Founding Roots' ? member.branchName : '');

  // Professional & Personal
  const [education, setEducation] = useState(member.education || '');
  const [profession, setProfession] = useState(member.profession || '');
  const [business, setBusiness] = useState(member.business || '');
  const [currentCity, setCurrentCity] = useState(member.currentCity || '');
  const [birthPlace, setBirthPlace] = useState(member.birthPlace || '');
  const [biography, setBiography] = useState(member.biography || '');
  const [couplePhotoUrl, setCouplePhotoUrl] = useState(member.couplePhotoUrl || '');
  const [coupleAbout, setCoupleAbout] = useState(member.coupleAbout || '');

  // Server Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingCouplePhoto, setIsUploadingCouplePhoto] = useState(false);
  const coupleFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoupleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setCouplePhotoUrl(URL.createObjectURL(file));
    setIsUploadingCouplePhoto(true);

    try {
      const result = await familyApi.uploadPhoto(file);
      if (result && result.url) {
        setCouplePhotoUrl(result.url);
        toast.success('Photo Uploaded', 'Couple photo uploaded successfully.');
      }
    } catch (err: unknown) {
      console.error('Failed to upload couple photo:', err);
      toast.error('Upload Failed', 'Failed to upload couple photo.');
    } finally {
      setIsUploadingCouplePhoto(false);
      if (e.target) e.target.value = '';
    }
  };

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

    // Immediate local preview
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

  // Check if member is Generation 1 (Founding Generation)
  const isGen1 = useMemo(() => {
    return member.generation === 1;
  }, [member.generation]);

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

    if (!fullName.trim()) {
      toast.warning('Name Required', 'Please enter Full Name.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (birthDate && birthDate > todayStr) {
      toast.warning('Invalid Birth Date', 'Date of birth cannot be in the future.');
      return;
    }

    if (isDeceased && birthDate && deathDate && deathDate < birthDate) {
      toast.warning('Invalid Date Range', 'Date of demise cannot be earlier than date of birth.');
      return;
    }

    // Chronology check between parent and child
    if (birthDate) {
      if (fatherId) {
        const f = members.find((m) => m.id === fatherId);
        if (f?.birthDate && birthDate <= f.birthDate) {
          toast.warning('Chronology Conflict', `Member's birth date (${birthDate}) cannot be before or equal to father's birth date (${f.birthDate}).`);
          return;
        }
      }
      if (motherId) {
        const m = members.find((m) => m.id === motherId);
        if (m?.birthDate && birthDate <= m.birthDate) {
          toast.warning('Chronology Conflict', `Member's birth date (${birthDate}) cannot be before or equal to mother's birth date (${m.birthDate}).`);
          return;
        }
        if (m?.isDeceased && m?.deathDate && birthDate > m.deathDate) {
          toast.warning('Chronology Conflict', `Member's birth date (${birthDate}) cannot be after mother's date of demise (${m.deathDate}).`);
          return;
        }
      }
    }

    // Tamil Hindu Kinship Validation for Spouses (multiple wives / multiple husbands / remarriage)
    for (const spId of spouseIds) {
      if (spId === fatherId || spId === motherId || spId === member.fatherId || spId === member.motherId || ancestorIds.has(spId)) {
        toast.warning('Kinship Rule', 'In Tamil Hindu tradition, a person cannot select their father, mother, grandfather, or grandmother as spouse.');
        return;
      }
      if (descendantIds.has(spId)) {
        toast.warning('Kinship Rule', 'Cannot select children or grandchildren as spouse.');
        return;
      }
      if (siblingIds.has(spId)) {
        toast.warning('Kinship Rule', 'Cannot select brother or sister as spouse.');
        return;
      }
    }

    // Determine branch name
    let finalBranchId = branchId;
    let bName = branchName.trim() || member.branchName;
    let bNameTamil = branchName.trim() || member.branchNameTamil;

    if (isGen1) {
      finalBranchId = 'root';
      bName = 'Founding Roots';
      bNameTamil = 'Founding Roots';
    } else if (branchName.trim()) {
      bName = branchName.trim();
      bNameTamil = branchName.trim();
      finalBranchId = branchId && branchId !== 'root' ? branchId : 'branch-' + bName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    } else {
      // Inherit from father, mother, or spouse if no custom branch is entered
      const parent = members.find((m) => m.id === fatherId) || members.find((m) => m.id === motherId);
      if (parent && parent.branchId && parent.branchId !== 'root') {
        finalBranchId = parent.branchId;
        bName = parent.branchName || 'Family Branch';
        bNameTamil = parent.branchNameTamil || bName;
      } else if (spouseIds.length > 0) {
        const spouse = members.find((m) => m.id === spouseIds[0]);
        if (spouse && spouse.branchId && spouse.branchId !== 'root') {
          finalBranchId = spouse.branchId;
          bName = spouse.branchName || 'Family Branch';
          bNameTamil = spouse.branchNameTamil || bName;
        }
      }
    }

    setIsSaving(true);
    try {
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
        couplePhotoUrl: couplePhotoUrl.trim() || undefined,
        coupleAbout: coupleAbout.trim() || undefined,
        // Explicitly pass empty string if cleared so backend can distinguish from undefined
        spouseId: spouseIds.length > 0 ? spouseIds[0] : '',
        spouseIds: spouseIds,
        fatherId: fatherId || '',
        motherId: motherId || '',
        branchId: finalBranchId || undefined,
        branchName: bName,
        branchNameTamil: bNameTamil,
      });

      toast.success('Changes Saved', `Updated details for ${fullName.trim()}.`);
      onClose();
    } catch (err: unknown) {
      toast.error('Save Failed', err instanceof Error ? err.message : 'Unable to save member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMember(member.id);
      toast.success('Member Removed', `"${member.fullName}" has been removed from the family tree.`);
      setShowDeleteModal(false);
      onClose();
    } catch (err: unknown) {
      toast.error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete member');
    } finally {
      setIsDeleting(false);
    }
  };

  // Collect all descendant IDs of this member to prevent circular lineage references
  const descendantIds = useMemo(() => {
    const set = new Set<string>();
    const queue = [...(member.childIds || [])];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!set.has(current)) {
        set.add(current);
        const found = members.find((m) => m.id === current);
        if (found?.childIds) queue.push(...found.childIds);
      }
    }
    return set;
  }, [member.childIds, members]);

  // Collect all direct ancestor IDs (Father, Mother, Paternal/Maternal Grandparents, etc.)
  const ancestorIds = useMemo(() => {
    const set = new Set<string>();
    const queue: string[] = [];
    if (fatherId) queue.push(fatherId);
    if (motherId) queue.push(motherId);
    if (member.fatherId) queue.push(member.fatherId);
    if (member.motherId) queue.push(member.motherId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!set.has(current)) {
        set.add(current);
        const found = members.find((m) => m.id === current);
        if (found?.fatherId) queue.push(found.fatherId);
        if (found?.motherId) queue.push(found.motherId);
      }
    }
    return set;
  }, [fatherId, motherId, member.fatherId, member.motherId, members]);

  // Collect direct sibling IDs (brothers and sisters sharing same father or mother)
  const siblingIds = useMemo(() => {
    const set = new Set<string>();
    const fId = fatherId || member.fatherId;
    const mId = motherId || member.motherId;
    if (!fId && !mId) return set;

    members.forEach((m) => {
      if (m.id === member.id) return;
      if (fId && m.fatherId === fId) set.add(m.id);
      if (mId && m.motherId === mId) set.add(m.id);
    });
    return set;
  }, [fatherId, motherId, member.fatherId, member.motherId, member.id, members]);

  // Build Select Options for HeritageSelect
  const fatherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.id !== member.id && !descendantIds.has(m.id) && !spouseIds.includes(m.id) && m.id !== motherId && !siblingIds.has(m.id) && m.gender === 'male')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members, member.id, descendantIds, spouseIds, motherId, siblingIds]);

  const motherOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => m.id !== member.id && !descendantIds.has(m.id) && !spouseIds.includes(m.id) && m.id !== fatherId && !siblingIds.has(m.id) && m.gender === 'female')
      .map((m) => ({
        value: m.id,
        label: m.fullName,
        badge: `Gen ${m.generation}`,
        sublabel: `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`,
      }));
  }, [members, member.id, descendantIds, spouseIds, fatherId, siblingIds]);

  // Spouses of descendants (daughter-in-law / son-in-law) and spouses of ancestors
  const inLawIds = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (descendantIds.has(m.id) || ancestorIds.has(m.id)) {
        if (m.spouseIds) m.spouseIds.forEach((id) => set.add(id));
        if (m.spouseId) set.add(m.spouseId);
      }
    });
    return set;
  }, [members, descendantIds, ancestorIds]);

  const spouseOptions: SelectOption[] = useMemo(() => {
    return members
      .filter((m) => {
        // Cannot be self
        if (m.id === member.id) return false;
        // Cannot be already selected in spouseIds
        if (spouseIds.includes(m.id)) return false;
        // Cannot be father or mother
        if (m.id === fatherId || m.id === motherId || m.id === member.fatherId || m.id === member.motherId) return false;
        // Cannot be a direct descendant (children, grandchildren, etc.)
        if (descendantIds.has(m.id)) return false;
        // Cannot be a direct ancestor (father, mother, grandfather, grandmother, etc.)
        if (ancestorIds.has(m.id)) return false;
        // Cannot be a sibling (brother, sister)
        if (siblingIds.has(m.id)) return false;
        // Cannot be an in-law (daughter-in-law / son-in-law / parent's spouse)
        if (inLawIds.has(m.id)) return false;
        // Tamil Hindu tradition: opposite gender for marriage
        if (gender === 'male' && m.gender !== 'female') return false;
        if (gender === 'female' && m.gender !== 'male') return false;
        return true;
      })
      .map((m) => {
        let sub = `${m.branchName || 'Family Branch'}${m.profession ? ` • ${m.profession}` : ''}`;
        if (m.spouseIds && m.spouseIds.length > 0) {
          const names = m.spouseIds.map((id) => members.find((s) => s.id === id)?.fullName).filter(Boolean).join(', ');
          sub += ` • (Linked with ${names})`;
        } else if (m.spouseId) {
          const currentPartner = members.find((s) => s.id === m.spouseId);
          sub += ` • (Linked with ${currentPartner?.fullName || m.spouseId})`;
        }
        return {
          value: m.id,
          label: m.fullName,
          badge: `Gen ${m.generation}`,
          sublabel: sub,
        };
      });
  }, [members, member.id, spouseIds, fatherId, motherId, member.fatherId, member.motherId, descendantIds, ancestorIds, siblingIds, inLawIds, gender]);

  const branchOptions: SelectOption[] = useMemo(() => {
    return branches
      .filter((b) => b.id !== 'root' && members.some((m) => m.branchId === b.id))
      .map((b) => ({
        value: b.id,
        label: b.name,
        sublabel: b.tamilName,
      }));
  }, [branches, members]);

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
                {member.fullName} • Generation {member.generation}
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
                    name={fullName || member.fullName}
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

          {/* Section 2: Family Relationships (Spouse, Father, Mother, Branch) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 pb-1 border-b border-heritage-border text-heritage-maroon">
              <Heart className="w-4 h-4 text-heritage-gold-600" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                2. Family Relationships & Lineage
              </h3>
            </div>

            {/* Spouses Section (Supports Multiple Wives / Multiple Husbands / Remarriage) */}
            <div className="space-y-2.5 p-3.5 bg-heritage-ivory/50 rounded-2xl border border-heritage-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-heritage-charcoal flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/30" />
                  <span>
                    Spouse(s) in Marriage ({spouseIds.length})
                  </span>
                </label>
                <span className="text-[10px] text-heritage-muted font-medium">
                  Supports multiple spouses &amp; remarriages
                </span>
              </div>

              {/* List of currently linked spouses */}
              {spouseIds.length > 0 ? (
                <div className="space-y-2">
                  {spouseIds.map((spId) => {
                    const sp = members.find((m) => m.id === spId);
                    if (!sp) return null;
                    return (
                      <div
                        key={spId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-heritage-border shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-border">
                            <PersonAvatar
                              photoUrl={sp.photoUrl}
                              name={sp.fullName}
                              gender={sp.gender}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-heritage-charcoal truncate">
                              {sp.fullName}
                              <span className="ml-1.5 text-[10px] font-medium text-heritage-maroon bg-heritage-maroon/10 px-1.5 py-0.2 rounded border border-heritage-maroon/20">
                                Spouse
                              </span>
                            </p>
                            <p className="text-[10px] text-heritage-muted truncate">
                              {sp.branchName || 'Family Branch'} {sp.profession ? `• ${sp.profession}` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSpouseIds(spouseIds.filter((id) => id !== spId))}
                          className="p-1.5 rounded-lg text-heritage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Unlink this spouse"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-heritage-muted italic">
                  No spouse currently linked (Single record)
                </p>
              )}

              {/* Add spouse dropdown */}
              <div className="pt-1">
                <HeritageSelect
                  label={spouseIds.length === 0 ? "Select Spouse" : "+ Add Another Spouse (Remarriage / Multiple Spouses)"}
                  value=""
                  onChange={(val) => {
                    if (val && !spouseIds.includes(val)) {
                      setSpouseIds([...spouseIds, val]);
                    }
                  }}
                  options={spouseOptions}
                  placeholder={spouseIds.length === 0 ? "Select spouse..." : "Select another spouse to link..."}
                  emptyOptionLabel="-- Select partner in marriage to link --"
                  helperText="Linking spouses automatically establishes reciprocal links on all records without breaking previous marriages."
                  searchable
                />
              </div>
            </div>

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

            {isGen1 ? (
              <div className="p-3 bg-heritage-gold-50/90 border border-heritage-gold-300 rounded-xl flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-heritage-gold-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-heritage-maroon uppercase tracking-wider">
                    Generation 1 • Founding Root Lineage
                  </p>
                  <p className="text-[11px] text-heritage-muted mt-0.5">
                    This relative is in the founding generation (Founding Roots). No child branch is needed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 p-3.5 bg-heritage-ivory rounded-xl border border-heritage-border">
                <label className="block text-xs font-semibold text-heritage-charcoal">
                  Family Branch Name
                </label>
                <p className="text-[11px] text-heritage-muted leading-relaxed">
                  {(() => {
                    const parent = members.find((m) => m.id === fatherId) || members.find((m) => m.id === motherId);
                    if (parent && parent.branchName && parent.branchName !== 'Founding Roots') {
                      return `Inherits "${parent.branchName}" from parent, or enter a custom branch name below.`;
                    }
                    if (spouseIds.length > 0) {
                      const sp = members.find((m) => m.id === spouseIds[0]);
                      if (sp && sp.branchName && sp.branchName !== 'Founding Roots') {
                        return `Inherits "${sp.branchName}" from spouse in marriage, or enter a custom branch name below.`;
                      }
                    }
                    return 'Lineage branch associated with this relative and their descendants.';
                  })()}
                </p>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder={(() => {
                    const parent = members.find((m) => m.id === fatherId) || members.find((m) => m.id === motherId);
                    if (parent?.branchName && parent.branchName !== 'Founding Roots') {
                      return `${parent.branchName} (Inherited from parent)`;
                    }
                    if (spouseIds.length > 0) {
                      const sp = members.find((m) => m.id === spouseIds[0]);
                      if (sp?.branchName && sp.branchName !== 'Founding Roots') {
                        return `${sp.branchName} (Inherited from spouse)`;
                      }
                    }
                    return `${fullName.trim() || 'Family'} Branch`;
                  })()}
                  className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
                />
              </div>
            )}
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
                Short Biography / Personal Notes
              </label>
              <textarea
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
              />
            </div>

            {/* Section 4: Generation 1 Founders Couple Presentation for Website */}
            {member.generation === 1 && (
              <div className="space-y-3 pt-3 border-t border-heritage-border">
                <div className="flex items-center space-x-2 text-heritage-maroon">
                  <Sparkles className="w-4 h-4 text-heritage-gold-600" />
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                    Founders Couple & Website Presentation
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl border border-heritage-gold/50 bg-heritage-gold-50/25 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-heritage-charcoal mb-1.5">
                      Combined Couple Photo <span className="text-heritage-muted font-normal">(Husband & Wife together)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-heritage-gold/60 bg-heritage-cream flex-shrink-0 flex items-center justify-center">
                        {couplePhotoUrl ? (
                          <img src={couplePhotoUrl} alt="Couple" className="w-full h-full object-cover object-top" />
                        ) : (
                          <Users className="w-6 h-6 text-heritage-gold-500" />
                        )}
                        {isUploadingCouplePhoto && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-heritage-gold animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          disabled={isUploadingCouplePhoto}
                          onClick={() => coupleFileInputRef.current?.click()}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-heritage-gold-300" />
                          <span>{couplePhotoUrl ? 'Change Couple Photo' : 'Upload Couple Photo'}</span>
                        </button>
                        {couplePhotoUrl && !isUploadingCouplePhoto && (
                          <button
                            type="button"
                            onClick={() => setCouplePhotoUrl('')}
                            className="block text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                          >
                            Remove couple photo
                          </button>
                        )}
                        <input
                          ref={coupleFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoupleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
                      Combined Family Story / Founders About <span className="text-heritage-muted font-normal">(Website Homepage)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={coupleAbout}
                      onChange={(e) => setCoupleAbout(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
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
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50 text-[#FAF7EE] rounded-xl shadow-heritage-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-heritage-gold-300" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-heritage-gold-300" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Themed Deletion Confirmation Modal */}
        <HeritageConfirmModal
          isOpen={showDeleteModal}
          title="Remove Family Member"
          message={`Are you sure you want to remove "${member.fullName}" from the family tree archive?`}
          confirmLabel="Yes, Delete Member"
          cancelLabel="Keep Record"
          isDestructive={true}
          isLoading={isDeleting}
          member={{
            fullName: member.fullName,
            tamilName: member.tamilName,
            generation: member.generation,
            gender: member.gender,
            photoUrl: member.photoUrl,
            branchName: member.branchName,
          }}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </div>,
    document.body
  );
};
