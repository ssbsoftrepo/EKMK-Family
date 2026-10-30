import React, { useState, useMemo, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { FamilyMember } from '../../types/family';
import { PersonAvatar } from '../Common/PersonAvatar';
import { 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Heart, 
  Sparkles, 
  Search, 
  Briefcase, 
  MapPin, 
  Calendar,
  X,
  Compass,
  GraduationCap
} from 'lucide-react';

export const FamilyTreeView: React.FC = () => {
  const { 
    members, 
    branches, 
    setSelectedMember, 
    highlightedMemberId, 
    setHighlightedMemberId 
  } = useFamily();

  // Root ancestor ID (Gen 1 Patriarch: KMK Sengottaiyan Gounder)
  const rootMember = useMemo(() => {
    return members.find((m) => m.generation === 1 && m.gender === 'male') || members[0];
  }, [members]);

  // Current active couple in focus (primary member ID)
  const [activePersonId, setActivePersonId] = useState<string>(rootMember?.id || 'ekmk-101');
  
  // Navigation history trail for breadcrumbs and Back navigation
  const [history, setHistory] = useState<string[]>([rootMember?.id || 'ekmk-101']);

  // Person selected for Detail & Tree Navigation Sheet
  const [detailPerson, setDetailPerson] = useState<FamilyMember | null>(null);

  // Quick search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // If highlightedMemberId comes from external search/locate
  useEffect(() => {
    if (highlightedMemberId) {
      const target = members.find((m) => m.id === highlightedMemberId);
      if (target) {
        if (target.childIds && target.childIds.length > 0) {
          goToPerson(target.id);
        } else if (target.fatherId) {
          goToPerson(target.fatherId);
        } else if (target.motherId) {
          goToPerson(target.motherId);
        } else {
          goToPerson(target.id);
        }
      }
      setHighlightedMemberId(null);
    }
  }, [highlightedMemberId]);

  // Active primary member and their spouse
  const activePrimary = useMemo(() => {
    return members.find((m) => m.id === activePersonId) || rootMember;
  }, [members, activePersonId, rootMember]);

  const activeSpouse = useMemo(() => {
    if (!activePrimary?.spouseId) return undefined;
    return members.find((m) => m.id === activePrimary.spouseId);
  }, [members, activePrimary]);

  // Active branch
  const activeBranch = useMemo(() => {
    if (!activePrimary) return branches[0];
    return branches.find((b) => b.id === activePrimary.branchId) || branches[0];
  }, [branches, activePrimary]);

  // Children of the active couple
  const childrenList = useMemo(() => {
    if (!activePrimary) return [];
    const childIds = activePrimary.childIds || [];
    return childIds.map((cid) => members.find((m) => m.id === cid)).filter(Boolean) as FamilyMember[];
  }, [members, activePrimary]);

  // Siblings of the active primary member (for quick peer navigation)
  const siblingsList = useMemo(() => {
    if (!activePrimary || (!activePrimary.fatherId && !activePrimary.motherId)) return [];
    const father = activePrimary.fatherId ? members.find((m) => m.id === activePrimary.fatherId) : undefined;
    const mother = activePrimary.motherId ? members.find((m) => m.id === activePrimary.motherId) : undefined;
    const allChildIds = father?.childIds || mother?.childIds || [];
    return allChildIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m && m.id !== activePrimary.id);
  }, [members, activePrimary]);

  // Navigate to a child / couple (drill-down to next generation)
  const goToPerson = (personId: string) => {
    setActivePersonId(personId);
    setHistory((prev) => {
      if (prev[prev.length - 1] === personId) return prev;
      return [...prev, personId];
    });
    setDetailPerson(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to previous couple in history
  const handleBack = () => {
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop();
      const previousId = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setActivePersonId(previousId);
      setDetailPerson(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activePrimary?.fatherId) {
      goToPerson(activePrimary.fatherId);
    } else if (activePrimary?.motherId) {
      goToPerson(activePrimary.motherId);
    }
  };

  // Reset all the way back to root
  const handleResetToRoot = () => {
    if (rootMember) {
      setActivePersonId(rootMember.id);
      setHistory([rootMember.id]);
      setDetailPerson(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filtered members for search popover
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return members
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          (m.profession && m.profession.toLowerCase().includes(q)) ||
          (m.currentCity && m.currentCity.toLowerCase().includes(q)) ||
          (m.branchName && m.branchName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [members, searchQuery]);

  // Progress percentage through generations (1 to 5)
  const genNumber = activePrimary?.generation || 1;
  const progressPercent = Math.min(100, Math.round((genNumber / 5) * 100));

  return (
    <div className="min-h-screen bg-heritage-ivory pb-24">
      
      {/* =========================================================================
          TOP MINIMAL CONTROLS & BREADCRUMBS
      ========================================================================= */}
      <div className="sticky top-18 z-30 bg-[#FFFEFB]/95 backdrop-blur-md border-b border-heritage-border shadow-xs">
        
        {/* Progress bar */}
        <div className="h-1 w-full bg-heritage-cream">
          <div 
            className="h-full bg-gradient-to-r from-heritage-gold via-heritage-maroon to-heritage-gold transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-2.5">
          {/* Top row: Back button, Gen title, and Search */}
          <div className="flex items-center justify-between gap-2">
            
            <div className="flex items-center space-x-2 min-w-0">
              {genNumber > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-heritage-ivory hover:bg-heritage-cream border border-heritage-border text-heritage-maroon text-xs font-bold transition-all shadow-xs flex-shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <div className="truncate">
                <span className="text-[11px] font-bold uppercase tracking-wider text-heritage-maroon bg-heritage-maroon-100/80 px-2.5 py-1 rounded-xl border border-heritage-maroon/20">
                  Generation {genNumber} of 5
                </span>
              </div>
            </div>

            {/* Right icons: Search and Return to Roots */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-heritage-ivory hover:bg-heritage-cream border border-heritage-border text-xs text-heritage-charcoal font-medium shadow-xs"
                title="Search any relative"
              >
                <Search className="w-3.5 h-3.5 text-heritage-maroon" />
                <span className="hidden sm:inline">Find</span>
              </button>

              {genNumber > 1 && (
                <button
                  onClick={handleResetToRoot}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-heritage-ivory hover:bg-heritage-cream border border-heritage-border text-xs text-heritage-muted hover:text-heritage-maroon shadow-xs"
                  title="Return to Roots"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Roots</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN MOBILE CONTENT CONTAINER
      ========================================================================= */}
      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-6">

        {/* =========================================================================
            ACTIVE COUPLE: PHOTO AND NAME ONLY
        ========================================================================= */}
        <section className="bg-[#FFFEFB] rounded-2xl border-2 border-heritage-gold/50 shadow-heritage-md p-4 sm:p-5 space-y-3.5 animate-fadeIn">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-heritage-maroon flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-heritage-gold-600" />
              <span>{genNumber === 1 ? 'Founding Couple' : `Generation ${genNumber} Couple`}</span>
            </span>
            <span className="text-[10px] bg-heritage-ivory px-2.5 py-0.5 rounded-full border border-heritage-border text-heritage-muted font-medium">
              Tap card for details
            </span>
          </div>

          {/* Couple Cards: Photo and Name Only */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch">
            
            {/* Primary Person */}
            <button
              onClick={() => setDetailPerson(activePrimary)}
              className="bg-heritage-ivory/60 hover:bg-heritage-cream/60 active:scale-98 rounded-xl border border-heritage-border p-2.5 sm:p-3 flex flex-col items-center text-center transition-all group"
            >
              <div className="w-full aspect-[3/4] max-w-[140px] rounded-xl overflow-hidden border-2 border-heritage-gold/70 bg-heritage-cream shadow-xs mb-2">
                <PersonAvatar
                  photoUrl={activePrimary.photoUrl}
                  name={activePrimary.fullName}
                  gender={activePrimary.gender}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <h2 className="font-serif text-xs sm:text-sm font-bold text-heritage-charcoal group-hover:text-heritage-maroon leading-snug line-clamp-2">
                {activePrimary.fullName}
              </h2>
            </button>

            {/* Spouse */}
            {activeSpouse ? (
              <button
                onClick={() => setDetailPerson(activeSpouse)}
                className="bg-heritage-ivory/60 hover:bg-heritage-cream/60 active:scale-98 rounded-xl border border-heritage-border p-2.5 sm:p-3 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-full aspect-[3/4] max-w-[140px] rounded-xl overflow-hidden border-2 border-heritage-gold/70 bg-heritage-cream shadow-xs mb-2 relative">
                  <PersonAvatar
                    photoUrl={activeSpouse.photoUrl}
                    name={activeSpouse.fullName}
                    gender={activeSpouse.gender}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 right-1 p-1 rounded-full bg-black/40 backdrop-blur-xs z-10">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                  </div>
                </div>

                <h3 className="font-serif text-xs sm:text-sm font-bold text-heritage-charcoal group-hover:text-heritage-maroon leading-snug line-clamp-2">
                  {activeSpouse.fullName}
                </h3>
              </button>
            ) : (
              <div className="bg-heritage-ivory/30 rounded-xl border border-dashed border-heritage-border p-3 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-heritage-muted">Unmarried / No spouse recorded</p>
              </div>
            )}

          </div>

          {/* Sibling Switcher (if any) */}
          {siblingsList.length > 0 && (
            <div className="pt-2.5 border-t border-heritage-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-muted mb-1.5">
                Siblings (Gen {genNumber}):
              </p>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {siblingsList.map((sib) => (
                  <button
                    key={sib.id}
                    onClick={() => goToPerson(sib.id)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-heritage-ivory hover:bg-heritage-cream border border-heritage-border text-xs text-heritage-charcoal hover:text-heritage-maroon font-medium whitespace-nowrap transition-colors flex-shrink-0 active:scale-95"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-heritage-gold-100 flex-shrink-0">
                      <PersonAvatar
                        photoUrl={sib.photoUrl}
                        name={sib.fullName}
                        gender={sib.gender}
                        className="w-full h-full"
                      />
                    </div>
                    <span className="truncate max-w-[120px]">{sib.firstName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* =========================================================================
            CHILDREN: PHOTO AND NAME ONLY (TOUCH TO VIEW DETAILS & NAVIGATE)
        ========================================================================= */}
        <section className="space-y-3.5">
          
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base sm:text-lg font-bold text-heritage-charcoal">
              Children ({childrenList.length})
            </h3>
            <span className="text-[11px] text-heritage-muted">
              Tap any child to open branch
            </span>
          </div>

          {childrenList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {childrenList.map((child) => {
                const childBranchCount = child.childIds?.length || 0;

                return (
                  <button
                    key={child.id}
                    onClick={() => setDetailPerson(child)}
                    className="bg-[#FFFEFB] hover:bg-heritage-cream/40 active:scale-98 rounded-2xl border border-heritage-border hover:border-heritage-gold shadow-heritage-sm p-2.5 flex flex-col items-center text-center transition-all group cursor-pointer"
                  >
                    {/* Photo only */}
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-heritage-gold/60 bg-heritage-cream shadow-2xs mb-2 relative">
                      <PersonAvatar
                        photoUrl={child.photoUrl}
                        name={child.fullName}
                        gender={child.gender}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Subtle branch count indicator tag */}
                      {childBranchCount > 0 && (
                        <div className="absolute bottom-1 right-1 bg-heritage-maroon/90 text-[#FAF7EE] text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 shadow-xs z-10">
                          <span>{childBranchCount}</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Name only */}
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-heritage-charcoal group-hover:text-heritage-maroon leading-tight line-clamp-2 px-1">
                      {child.fullName}
                    </h4>
                  </button>
                );
              })}
            </div>
          ) : (
            /* LATEST GENERATION / END OF BRANCH */
            <div className="bg-[#FFFEFB] rounded-2xl border-2 border-dashed border-heritage-gold/50 p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-heritage-gold-100 mx-auto flex items-center justify-center text-heritage-maroon">
                <Sparkles className="w-5 h-5 text-heritage-gold-600" />
              </div>
              <h4 className="font-serif text-base font-bold text-heritage-charcoal">
                Latest Generation of this Branch
              </h4>
              <p className="text-xs text-heritage-muted max-w-sm mx-auto">
                No subsequent descendants recorded under this branch.
              </p>
              <div className="pt-1 flex justify-center gap-2">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-xl bg-heritage-maroon text-[#FAF7EE] text-xs font-semibold shadow-xs"
                >
                  ← Back
                </button>
                <button
                  onClick={handleResetToRoot}
                  className="px-4 py-2 rounded-xl bg-heritage-ivory border border-heritage-border hover:bg-heritage-cream text-xs text-heritage-charcoal font-semibold"
                >
                  Return to Roots
                </button>
              </div>
            </div>
          )}

        </section>

      </div>

      {/* =========================================================================
          PERSON DETAIL & TREE NAVIGATION BOTTOM SHEET / MODAL
          (TRIGGERED WHEN TAPPING ANY PERSON CARD)
      ========================================================================= */}
      {detailPerson && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-heritage-charcoal/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setDetailPerson(null)}
        >
          <div 
            className="w-full sm:max-w-md bg-[#FFFEFB] rounded-t-3xl sm:rounded-2xl border-t sm:border-2 border-heritage-gold/60 shadow-heritage-xl overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="p-4 border-b border-heritage-border bg-heritage-maroon text-[#FAF7EE] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-heritage-gold-200">
                Generation {detailPerson.generation} • Profile & Branch
              </span>
              <button
                onClick={() => setDetailPerson(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Photo & Name */}
              <div className="flex space-x-4 items-center">
                <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-heritage-gold bg-heritage-cream shadow-xs flex-shrink-0">
                  <PersonAvatar
                    photoUrl={detailPerson.photoUrl}
                    name={detailPerson.fullName}
                    gender={detailPerson.gender}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg font-bold text-heritage-charcoal leading-tight">
                    {detailPerson.fullName}
                  </h3>

                  {detailPerson.birthDate && (
                    <p className="text-xs text-heritage-muted flex items-center space-x-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-heritage-gold-600" />
                      <span>
                        {detailPerson.birthDate.split('-')[0]}
                        {detailPerson.isDeceased && detailPerson.deathDate ? ` — ${detailPerson.deathDate.split('-')[0]}` : ''}
                      </span>
                    </p>
                  )}

                  {detailPerson.profession && (
                    <p className="text-xs text-heritage-charcoalLight flex items-center space-x-1 mt-0.5 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-heritage-muted flex-shrink-0" />
                      <span className="truncate">{detailPerson.profession}</span>
                    </p>
                  )}

                  {detailPerson.currentCity && (
                    <p className="text-xs text-heritage-charcoalLight flex items-center space-x-1 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-heritage-muted flex-shrink-0" />
                      <span className="truncate">{detailPerson.currentCity}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Spouse Info (if married) */}
              {detailPerson.spouseId && (() => {
                const sp = members.find((m) => m.id === detailPerson.spouseId);
                return sp ? (
                  <div className="p-2.5 rounded-xl bg-heritage-ivory border border-heritage-border flex items-center space-x-2 text-xs text-heritage-charcoal">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 flex-shrink-0" />
                    <span>Spouse: <strong>{sp.fullName}</strong></span>
                  </div>
                ) : null;
              })()}

              {/* Biography snippet (if available) */}
              {detailPerson.biography && (
                <div className="p-3 bg-heritage-ivory rounded-xl border border-heritage-border text-xs text-heritage-charcoalLight leading-relaxed">
                  {detailPerson.biography}
                </div>
              )}

              {/* TREE NAVIGATION ACTIONS */}
              <div className="space-y-2 pt-2 border-t border-heritage-border">
                {detailPerson.childIds && detailPerson.childIds.length > 0 ? (
                  <button
                    onClick={() => goToPerson(detailPerson.id)}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-sm font-bold shadow-heritage-sm transition-all active:scale-95"
                  >
                    <span>Explore Branch ({detailPerson.childIds.length} Children)</span>
                    <ArrowRight className="w-4 h-4 text-heritage-gold-300" />
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-heritage-muted bg-heritage-ivory rounded-xl border border-heritage-border">
                    Latest Generation • No further descendants recorded
                  </div>
                )}

                <button
                  onClick={() => {
                    const target = detailPerson;
                    setDetailPerson(null);
                    setSelectedMember(target);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-heritage-ivory hover:bg-heritage-cream border border-heritage-border text-xs text-heritage-charcoal font-semibold transition-colors"
                >
                  View Full Profile & Family Details
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          QUICK SEARCH MODAL DRAWER
      ========================================================================= */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-heritage-charcoal/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-[#FFFEFB] rounded-2xl border-2 border-heritage-gold/60 shadow-heritage-xl overflow-hidden flex flex-col max-h-[80vh] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-heritage-border bg-heritage-ivory flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-heritage-maroon" />
                <span className="font-serif text-sm font-bold text-heritage-charcoal">
                  Find Any Relative in the Tree
                </span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-muted hover:text-heritage-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-heritage-border">
              <input
                type="text"
                autoFocus
                placeholder="Type name, city, or profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-heritage-ivory border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon text-heritage-charcoal"
              />
            </div>

            {/* Results List */}
            <div className="overflow-y-auto p-2 divide-y divide-heritage-border/50 max-h-96">
              {searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      goToPerson(m.id);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 hover:bg-heritage-cream/60 rounded-xl flex items-center space-x-3 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-gold/50">
                      <PersonAvatar photoUrl={m.photoUrl} name={m.fullName} gender={m.gender} className="w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-heritage-charcoal group-hover:text-heritage-maroon truncate">
                        {m.fullName}
                      </p>
                      <p className="text-[11px] text-heritage-muted truncate">
                        Gen {m.generation} • {m.branchName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-heritage-maroon group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                      <span>Jump</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <p className="text-center py-6 text-xs text-heritage-muted">
                  No relatives found matching "{searchQuery}"
                </p>
              ) : (
                <p className="text-center py-6 text-xs text-heritage-muted">
                  Search across all relatives...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
