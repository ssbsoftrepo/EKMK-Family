import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFamily } from '../../context/FamilyContext';
import { FamilyMember } from '../../types/family';
import { PersonAvatar } from '../Common/PersonAvatar';
import { ContactButtons } from '../Common/ContactButtons';
import { 
  X, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Users, 
  Heart, 
  Sparkles, 
  TreePine, 
  Edit3, 
  Award,
  Flower2,
  ChevronRight
} from 'lucide-react';

interface Props {
  member: FamilyMember | null;
  onClose: () => void;
  onEdit?: (member: FamilyMember) => void;
}

export const PersonProfileModal: React.FC<Props> = ({ member, onClose, onEdit }) => {
  const { members, getMemberById, setSelectedMember, locateInTree, branches } = useFamily();

  if (!member) return null;

  const father = member.fatherId ? getMemberById(member.fatherId) : undefined;
  const mother = member.motherId ? getMemberById(member.motherId) : undefined;
  // Find all spouses (supports multiple wives / multiple husbands / remarriage)
  const spouses = useMemo(() => {
    const list: string[] = [];
    if (member.spouseIds && member.spouseIds.length > 0) {
      list.push(...member.spouseIds);
    } else if (member.spouseId) {
      list.push(member.spouseId);
    }
    // Also include reciprocal marriages
    members.forEach((m) => {
      if (
        (m.spouseIds && m.spouseIds.includes(member.id)) ||
        m.spouseId === member.id
      ) {
        if (!list.includes(m.id)) list.push(m.id);
      }
    });
    return list.map((id) => getMemberById(id)).filter(Boolean) as FamilyMember[];
  }, [member, members, getMemberById]);
  const children = member.childIds?.map((id) => getMemberById(id)).filter(Boolean) as FamilyMember[] || [];
  
  // Find siblings (members who share either father or mother, excluding this member)
  const siblings = father || mother
    ? (father?.childIds || mother?.childIds || [])
        .filter((id) => id !== member.id)
        .map((id) => getMemberById(id))
        .filter(Boolean) as FamilyMember[]
    : [];

  const branch = branches.find((b) => b.id === member.branchId);

  // Calculate age or age at death
  const getAgeString = () => {
    if (!member.birthDate) return null;
    const birthYear = new Date(member.birthDate).getFullYear();
    if (member.isDeceased && member.deathDate) {
      const deathYear = new Date(member.deathDate).getFullYear();
      return `${deathYear - birthYear} years (${birthYear} - ${deathYear})`;
    }
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} years old (Born ${birthYear})`;
  };

  const ageStr = getAgeString();

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-heritage-charcoal/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#FFFEFB] rounded-2xl border-2 border-heritage-gold/60 shadow-heritage-lg overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cultural Ornamental Header */}
        <div className="relative bg-gradient-to-r from-heritage-maroon-900 via-heritage-maroon to-heritage-maroon-800 text-[#FAF7EE] px-6 py-4 border-b border-heritage-gold/40 flex-shrink-0">
          <div className="absolute top-0 right-0 p-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 text-heritage-gold-300 text-xs font-semibold">
            <Flower2 className="w-4 h-4" />
            <span>Family Member Profile Details</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-heritage-gold-500/30 text-heritage-gold-200 border border-heritage-gold/40">
              Generation {member.generation}
            </span>

            {branch && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/20">
                {branch.name}
              </span>
            )}

            {member.isDeceased && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-900/60 text-amber-200 border border-amber-500/40 flex items-center space-x-1">
                <span>🕊️ In Loving Memory</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="relative px-6 py-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Avatar & Key Name Info Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
            
            {/* Portrait Image */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-heritage-gold/80 shadow-heritage-md bg-heritage-cream flex-shrink-0">
              <PersonAvatar
                photoUrl={member.photoUrl}
                name={member.fullName}
                gender={member.gender}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover object-top"
              />

              {member.isDeceased && (
                <div className="absolute bottom-0 inset-x-0 bg-heritage-charcoal/90 text-[10px] text-amber-200 text-center py-0.5 font-serif z-10">
                  In Memory
                </div>
              )}
            </div>

            {/* Names & Titles */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-heritage-charcoal leading-tight">
                {member.fullName}
              </h2>
              <p className="text-sm text-heritage-muted mt-0.5">
                {member.profession || member.currentCity || (branch ? `${branch.name} Branch` : '')}
              </p>
              {ageStr && (
                <p className="text-xs text-heritage-muted flex items-center justify-center sm:justify-start space-x-1 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-heritage-gold-600" />
                  <span>{ageStr}</span>
                </p>
              )}
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  locateInTree(member.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-heritage-maroon text-[#FAF7EE] text-xs font-semibold hover:bg-heritage-maroon-800 transition-colors shadow-sm flex items-center space-x-1.5"
                title="Locate and center on the interactive family tree"
              >
                <TreePine className="w-3.5 h-3.5 text-heritage-gold-300" />
                <span>Locate on Tree</span>
              </button>

              {onEdit && (
                <button
                  onClick={() => onEdit(member)}
                  className="p-2 rounded-xl bg-heritage-cream/80 hover:bg-heritage-cream text-heritage-charcoal border border-heritage-border text-xs transition-colors"
                  title="Edit member details"
                >
                  <Edit3 className="w-4 h-4 text-heritage-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Call / WhatsApp (only when a phone number was given) */}
          <ContactButtons member={member} />

          {/* Quick Details Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {member.profession && (
              <div className="p-3 bg-heritage-ivory rounded-xl border border-heritage-border flex items-start space-x-3">
                <Briefcase className="w-4 h-4 text-heritage-maroon flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-heritage-muted font-medium">Profession / Enterprise</p>
                  <p className="text-xs font-semibold text-heritage-charcoal">{member.profession}</p>
                  {member.business && (
                    <p className="text-[11px] text-heritage-muted">{member.business}</p>
                  )}
                </div>
              </div>
            )}

            {member.education && (
              <div className="p-3 bg-heritage-ivory rounded-xl border border-heritage-border flex items-start space-x-3">
                <GraduationCap className="w-4 h-4 text-heritage-gold-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-heritage-muted font-medium">Education</p>
                  <p className="text-xs font-semibold text-heritage-charcoal">{member.education}</p>
                </div>
              </div>
            )}

            {(member.birthPlace || member.currentCity) && (
              <div className="p-3 bg-heritage-ivory rounded-xl border border-heritage-border flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-heritage-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-heritage-muted font-medium">Roots & Location</p>
                  <p className="text-xs font-semibold text-heritage-charcoal">
                    {member.currentCity || member.birthPlace}
                  </p>
                  {member.birthPlace && member.currentCity && member.birthPlace !== member.currentCity && (
                    <p className="text-[11px] text-heritage-muted">Native: {member.birthPlace}</p>
                  )}
                </div>
              </div>
            )}

            {member.tags && member.tags.length > 0 && (
              <div className="p-3 bg-heritage-ivory rounded-xl border border-heritage-border flex items-start space-x-3">
                <Award className="w-4 h-4 text-heritage-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-heritage-muted font-medium">Pillars & Roles</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-[#FFFEFB] border border-heritage-border text-heritage-charcoal">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Biography */}
          {member.biography && (
            <div className="p-4 bg-heritage-cream/40 rounded-xl border border-heritage-border/80 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-heritage-maroon flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-heritage-gold-600" />
                <span>Family Heritage & Biography</span>
              </h3>
              <p className="text-xs text-heritage-charcoalLight leading-relaxed">
                {member.biography}
              </p>
            </div>
          )}

          {/* =========================================================================
              DIRECT FAMILY RELATIONSHIPS (CLICKABLE LINKS)
          ========================================================================= */}
          <div className="space-y-4 pt-2 border-t border-heritage-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-heritage-muted">
              Family Relationships
            </h3>

            {/* Parents */}
            {(father || mother) && (
              <div>
                <p className="text-[11px] font-semibold text-heritage-muted mb-2">Parents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {father && (
                    <button
                      onClick={() => setSelectedMember(father)}
                      className="p-2 rounded-lg bg-heritage-ivory hover:bg-heritage-cream/70 border border-heritage-border text-left flex items-center space-x-2.5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0">
                        {father.photoUrl ? (
                          <img src={father.photoUrl} alt={father.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heritage-maroon">
                            {father.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                          {father.fullName}
                        </p>
                        <p className="text-[10px] text-heritage-muted">Father</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-heritage-muted group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {mother && (
                    <button
                      onClick={() => setSelectedMember(mother)}
                      className="p-2 rounded-lg bg-heritage-ivory hover:bg-heritage-cream/70 border border-heritage-border text-left flex items-center space-x-2.5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0">
                        {mother.photoUrl ? (
                          <img src={mother.photoUrl} alt={mother.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heritage-maroon">
                            {mother.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                          {mother.fullName}
                        </p>
                        <p className="text-[10px] text-heritage-muted">Mother</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-heritage-muted group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Spouses (Supports Multiple Wives / Multiple Husbands / Remarriage) */}
            {spouses.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-heritage-muted mb-2 flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  <span>
                    {spouses.length > 1
                      ? 'Spouses in Marriage'
                      : (member.gender === 'female' ? 'Husband' : 'Wife')}
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spouses.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => setSelectedMember(sp)}
                      className="p-2.5 rounded-xl bg-heritage-ivory hover:bg-heritage-cream/70 border border-heritage-gold/50 text-left flex items-center space-x-3 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-gold">
                        <PersonAvatar
                          photoUrl={sp.photoUrl}
                          name={sp.fullName}
                          gender={sp.gender}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                          {sp.fullName}
                        </p>
                        <p className="text-[10px] text-heritage-muted">
                          {sp.profession || sp.currentCity || sp.branchName || (sp.gender === 'female' ? 'Wife' : 'Husband')}
                        </p>
                      </div>
                      <Heart className="w-4 h-4 text-heritage-maroon fill-heritage-maroon/20 ml-2 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-heritage-muted mb-2">
                  Children ({children.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedMember(child)}
                      className="p-2 rounded-lg bg-heritage-ivory hover:bg-heritage-cream/70 border border-heritage-border text-left flex items-center space-x-2.5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0">
                        <PersonAvatar
                          photoUrl={child.photoUrl}
                          name={child.fullName}
                          gender={child.gender}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                          {child.fullName}
                        </p>
                        <p className="text-[10px] text-heritage-muted">Gen {child.generation}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-heritage-muted group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Siblings */}
            {siblings.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-heritage-muted mb-2">
                  Siblings ({siblings.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {siblings.map((sibling) => (
                    <button
                      key={sibling.id}
                      onClick={() => setSelectedMember(sibling)}
                      className="px-3 py-1.5 rounded-lg bg-heritage-ivory hover:bg-heritage-cream/80 border border-heritage-border text-xs text-heritage-charcoal hover:text-heritage-maroon font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      <span>{sibling.fullName}</span>
                      <ChevronRight className="w-3 h-3 text-heritage-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-heritage-ivory px-6 py-3.5 border-t border-heritage-border flex items-center justify-between">
          <span className="text-[11px] text-heritage-muted font-serif">
            Erode KMK Kudumbam • Generation {member.generation}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FFFEFB] border border-heritage-border hover:bg-heritage-cream/60 text-xs font-semibold text-heritage-charcoal transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
