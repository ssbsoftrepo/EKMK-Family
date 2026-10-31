import React, { useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { FamilyMember } from '../../types/family';
import { PersonAvatar } from '../Common/PersonAvatar';
import { 
  TreePine, 
  Users, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight,
  Award, 
  Building,
  GraduationCap,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Flame,
  UserPlus
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActiveTab, stats, branches, locateInTree, members, setSelectedMember } = useFamily();

  // Dynamic Generation 1 Founder(s)
  const gen1Members = useMemo(() => {
    return members.filter((m) => m.generation === 1);
  }, [members]);

  const founderPatriarch = useMemo(() => {
    return gen1Members.find((m) => m.gender === 'male') || gen1Members[0];
  }, [gen1Members]);

  const founderSpouses = useMemo(() => {
    if (!founderPatriarch) return [];
    const sIds = (founderPatriarch.spouseIds && founderPatriarch.spouseIds.length > 0)
      ? founderPatriarch.spouseIds
      : (founderPatriarch.spouseId ? [founderPatriarch.spouseId] : []);
    
    const spouses = sIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m);

    if (spouses.length === 0) {
      const fallback = gen1Members.find((m) => m.gender === 'female' && m.id !== founderPatriarch.id);
      return fallback ? [fallback] : [];
    }
    return spouses;
  }, [gen1Members, founderPatriarch, members]);

  const founderMatriarch = founderSpouses[0];

  // Dynamic established year from Gen 1 founder's birthDate
  const estYear = useMemo(() => {
    const founder = founderPatriarch || founderMatriarch;
    if (founder?.birthDate) {
      const match = founder.birthDate.match(/\d{4}/);
      if (match) return match[0];
    }
    return null;
  }, [founderPatriarch, founderMatriarch]);

  // Dynamic generations depth
  const generationsDepth = useMemo(() => {
    if (members.length === 0) return 0;
    return Math.max(...members.map((m) => m.generation || 1), 1);
  }, [members]);

  // Helper to get detailed branch leader and stats
  const getBranchDetails = (branchId: string, rootPersonId: string) => {
    const leader = members.find((m) => m.id === rootPersonId);
    const spouse = leader?.spouseId ? members.find((m) => m.id === leader.spouseId) : undefined;
    const branchMembers = members.filter((m) => m.branchId === branchId);
    
    // Count distinct generations in this branch
    const genSet = new Set(branchMembers.map((m) => m.generation));

    return {
      leader,
      spouse,
      totalCount: branchMembers.length,
      generationsCount: genSet.size,
    };
  };

  // Only branches that actually have registered members in the database
  const activeBranches = useMemo(() => {
    return branches
      .filter((b) => b.id !== 'root')
      .map((branch) => ({
        branch,
        details: getBranchDetails(branch.id, branch.rootPersonId),
      }))
      .filter(({ details }) => details.totalCount > 0);
  }, [branches, members]);

  return (
    <div className="min-h-screen bg-heritage-ivory flex flex-col selection:bg-heritage-gold/30 selection:text-heritage-maroon">
      
      {/* =========================================================================
          HERO SECTION (PRO-DESIGNED WITH AMBIENT CULTURAL LAYERING)
      ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5EFE3] via-heritage-ivory to-heritage-ivory border-b border-heritage-border/80 py-12 lg:py-20">
        
        {/* Subtle Kolam Background Pattern Watermark */}
        <div className="absolute inset-0 bg-kolam-grid opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Cultural Badge with Gold Foil Accent */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FFFEFB] border border-heritage-gold/60 text-heritage-maroon shadow-sm text-xs font-semibold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-heritage-gold animate-pulse" />
                <span>Kongu Heritage • Family Lineage Archive</span>
                {estYear && <span className="text-heritage-gold-600 font-bold">• Est. {estYear}</span>}
              </div>

              {/* Main Heading in English */}
              <div className="space-y-2">
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-heritage-maroon tracking-tight leading-[1.15]">
                  Erode KMK Family <br />
                  <span className="text-gold-gradient font-serif">Heritage & Genealogy</span>
                </h1>
                <p className="font-display italic text-lg sm:text-2xl text-heritage-muted font-medium">
                  Preserving Our Roots & Connecting Generations Worldwide
                </p>
              </div>

              {/* Archival Quote Box with Royal Border */}
              <div className="relative p-5 rounded-2xl bg-[#FFFEFB]/90 backdrop-blur-sm border border-heritage-gold/50 shadow-heritage-sm max-w-xl mx-auto lg:mx-0">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-heritage-maroon via-heritage-gold to-heritage-maroon rounded-l-2xl" />
                <p className="text-sm sm:text-base font-serif text-heritage-charcoal italic leading-relaxed pl-2">
                  {generationsDepth > 1
                    ? `"Our Roots. Our Legacy. Honoring the values of our founding ancestors and connecting ${generationsDepth} generations across continents."`
                    : `"Our Roots. Our Legacy. Honoring the values of our founding ancestors and preserving our heritage for future generations."`}
                </p>
                <p className="text-xs text-heritage-muted mt-2 pl-2 font-sans font-medium flex items-center space-x-2">
                  <span className="text-heritage-gold-700">✦</span>
                  <span>Erode KMK Family Kudumbam {estYear ? `• Established in ${estYear}` : '• Living Lineage Archive'}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('tree')}
                  className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-sm sm:text-base font-semibold shadow-heritage hover:shadow-maroon-glow transition-all duration-200 group w-full sm:w-auto min-h-[44px]"
                >
                  <TreePine className="w-5 h-5 text-heritage-gold-300 group-hover:scale-110 transition-transform" />
                  <span>Explore Interactive Tree</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Pro-Styled Metric Counters */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-4 max-w-md mx-auto lg:mx-0">
                <div className="p-2.5 sm:p-3.5 bg-[#FFFEFB] rounded-xl border border-heritage-border/90 shadow-heritage-sm text-center transform hover:-translate-y-0.5 transition-transform">
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-heritage-maroon">
                    {stats.totalMembers}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-heritage-muted font-semibold uppercase tracking-wider">
                    Relatives
                  </span>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-[#FFFEFB] rounded-xl border border-heritage-border/90 shadow-heritage-sm text-center transform hover:-translate-y-0.5 transition-transform">
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-heritage-gold-700">
                    {generationsDepth}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-heritage-muted font-semibold uppercase tracking-wider">
                    {generationsDepth === 1 ? 'Generation' : 'Generations'}
                  </span>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-[#FFFEFB] rounded-xl border border-heritage-border/90 shadow-heritage-sm text-center transform hover:-translate-y-0.5 transition-transform">
                  <span className="block font-serif text-xl sm:text-3xl font-bold text-heritage-charcoal">
                    {activeBranches.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-heritage-muted font-semibold uppercase tracking-wider">
                    Main Branches
                  </span>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Magnificent Heritage Artwork */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative border backdrop */}
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-heritage-maroon/20 via-heritage-gold/30 to-heritage-cream opacity-80 blur-lg" />

                <div className="relative rounded-3xl overflow-hidden border-2 border-heritage-gold/70 shadow-heritage-lg bg-[#FFFEFB]">
                  <img
                    src="/assets/hero_tree.jpg"
                    alt="Erode KMK Heritage Banyan Tree"
                    className="w-full h-72 sm:h-96 object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-charcoal/95 via-heritage-charcoal/30 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                    <span className="text-xs uppercase tracking-widest text-heritage-gold-300 font-bold">
                      {estYear ? `Established ${estYear} • Kongu Heritage` : 'Kongu Heritage • Living Archive'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-white mt-1">
                      The Living Banyan of Erode KMK
                    </h3>
                    <p className="text-xs text-white/85 mt-1 leading-relaxed">
                      Deeply rooted along the Bhavani & Cauvery river delta, flourishing {generationsDepth > 0 ? `across ${generationsDepth} ${generationsDepth === 1 ? 'generation' : 'generations'}` : 'into future generations'} into world-class doctors, technologists, and agriculturalists.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: FOUNDING PATRIARCH & MATRIARCH (DYNAMIC - ONLY SHOWN IF DATA EXISTS)
      ========================================================================= */}
      {founderPatriarch && (
        <section className="py-12 sm:py-20 bg-[#FFFEFB] border-b border-heritage-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-heritage-gold-800 bg-heritage-gold-50 border border-heritage-gold-200">
                <Sparkles className="w-3.5 h-3.5 text-heritage-gold-600" />
                <span>Generation 1 • Genesis Pillars</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-heritage-maroon mt-3">
                Founding Ancestors & Heritage Pillars
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mx-auto mt-3" />
              <p className="text-xs sm:text-sm text-heritage-muted mt-3">
                The sacred beginning of our family, established through hard work, integrity, and timeless values.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#FFFDF9] via-heritage-ivory to-heritage-cream/40 rounded-3xl border-2 border-heritage-gold/60 p-4 sm:p-10 shadow-heritage-lg relative overflow-hidden">
              {/* Corner Decorative Kalasam Accents */}
              <div className="absolute top-3 right-3 text-heritage-gold-300 text-lg select-none">✦</div>
              <div className="absolute bottom-3 left-3 text-heritage-gold-300 text-lg select-none">✦</div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Couple or Founder Portrait with Museum Gilded Frame */}
                <div className="md:col-span-5 text-center">
                  <div className="relative inline-block rounded-2xl overflow-hidden border-4 border-heritage-gold/70 shadow-heritage-lg bg-heritage-cream group">
                    <div className="w-64 h-72 sm:w-72 sm:h-80 relative overflow-hidden bg-heritage-gold-50">
                      <PersonAvatar
                        photoUrl={founderPatriarch.couplePhotoUrl || founderMatriarch?.couplePhotoUrl || founderPatriarch.photoUrl || founderMatriarch?.photoUrl}
                        name={founderPatriarch.couplePhotoUrl || founderMatriarch?.couplePhotoUrl ? `${founderPatriarch.fullName} & ${founderSpouses.map(s => s.fullName).join(' & ')}` : founderPatriarch.fullName}
                        gender={founderPatriarch.gender}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="bg-heritage-maroon text-[#FAF7EE] py-2 px-3 text-xs font-serif font-bold tracking-wide border-t border-heritage-gold/40 truncate">
                      {founderPatriarch.birthDate || 'Genesis'} {founderPatriarch.deathDate ? `— ${founderPatriarch.deathDate}` : founderPatriarch.isDeceased ? '— Deceased' : '— Present'}
                      {founderPatriarch.birthPlace ? ` • ${founderPatriarch.birthPlace}` : ''}
                    </div>
                  </div>
                </div>

                {/* Founder Biography & Legacy */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-heritage-gold-100 text-heritage-gold-900 border border-heritage-gold-300">
                      Generation 1 • {founderSpouses.length > 1 ? 'Founding Patriarch & Matriarchs' : founderSpouses.length === 1 ? 'Founding Patriarch & Matriarch' : 'Founding Ancestor'}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-heritage-charcoal mt-2.5 leading-snug">
                      {founderPatriarch.fullName}
                      {founderSpouses.length > 1 ? (
                        <span> & {founderSpouses.map((s) => s.fullName).join(' & ')}</span>
                      ) : founderSpouses.length === 1 ? (
                        <span> & {founderSpouses[0].fullName}</span>
                      ) : null}
                    </h3>
                    {(() => {
                      const tamilParts = [founderPatriarch.tamilName, ...founderSpouses.map((s) => s.tamilName)].filter(Boolean);
                      return tamilParts.length > 0 ? (
                        <p className="text-sm font-tamil text-heritage-gold-700 font-semibold mt-0.5">
                          {tamilParts.join(' • ')}
                        </p>
                      ) : null;
                    })()}
                    <p className="text-sm font-display italic text-heritage-muted mt-0.5">
                      Founding Generation of the KMK Family
                    </p>
                    {founderSpouses.length > 1 && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-[11px] font-semibold text-heritage-muted">Matriarchs:</span>
                        {founderSpouses.map((sp) => (
                          <button
                            key={sp.id}
                            onClick={() => setSelectedMember(sp)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-heritage-cream text-heritage-maroon border border-heritage-gold/50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title={`View profile for ${sp.fullName}`}
                          >
                            <span>{sp.fullName}</span>
                            {sp.tamilName && <span className="font-tamil text-[10px] text-heritage-gold-800">({sp.tamilName})</span>}
                            <span className="text-[10px] text-heritage-muted bg-white/80 px-1 rounded border border-heritage-border/60">
                              {sp.childIds?.length || 0} {(sp.childIds?.length || 0) === 1 ? 'child' : 'children'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-heritage-charcoalLight leading-relaxed">
                    {founderPatriarch.coupleAbout || founderMatriarch?.coupleAbout || founderPatriarch.biography || founderMatriarch?.biography || 
                      'Founding pillar of our family lineage. Honoring their hard work, integrity, and timeless values that continue to connect all generations.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-[#FFFEFB] rounded-xl border border-heritage-border text-xs">
                      <p className="text-heritage-muted font-medium">Ancestral Native</p>
                      <p className="font-bold text-heritage-charcoal mt-0.5">
                        {founderPatriarch.birthPlace || founderPatriarch.currentCity || 'Native Ancestral Origin'}
                      </p>
                    </div>
                    <div className="p-3 bg-[#FFFEFB] rounded-xl border border-heritage-border text-xs">
                      <p className="text-heritage-muted font-medium">Living Descendants</p>
                      <p className="font-bold text-heritage-maroon mt-0.5">
                        {stats.totalMembers} Members in {stats.totalGenerations} Gen
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => locateInTree(founderPatriarch.id)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-bold shadow-heritage-sm transition-all group"
                    >
                      <span>View Profile & Trace Lineage</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: THE FLOURISHING BRANCHES (ONLY SHOWN IF BRANCHES HAVE MEMBERS)
      ========================================================================= */}
      {activeBranches.length > 0 && (
        <section className="py-16 sm:py-20 bg-heritage-ivory border-b border-heritage-border relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-heritage-maroon bg-heritage-maroon-50 border border-heritage-maroon-200">
                <Sparkles className="w-3.5 h-3.5 text-heritage-gold-600" />
                <span>Lineage Branches</span>
              </span>

              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-heritage-maroon mt-3">
                {activeBranches.length} Flourishing {activeBranches.length === 1 ? 'Branch' : 'Branches'}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mx-auto mt-3" />

              <p className="text-xs sm:text-sm text-heritage-muted mt-3 max-w-xl mx-auto leading-relaxed">
                Established family branches and their registered relatives. Tap any branch to view details and lineage.
              </p>
            </div>

            {/* Branch Cards Grid: Dynamically centered with max 5 columns */}
            <div className={`mx-auto flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 ${
              activeBranches.length === 1 ? 'max-w-xs' :
              activeBranches.length === 2 ? 'max-w-xl' :
              activeBranches.length === 3 ? 'max-w-3xl' :
              activeBranches.length === 4 ? 'max-w-5xl' :
              'max-w-7xl'
            }`}>
              {activeBranches.map(({ branch, details }, idx) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    if (details.leader) {
                      setSelectedMember(details.leader);
                    } else if (branch.rootPersonId) {
                      locateInTree(branch.rootPersonId);
                    }
                  }}
                  className="w-[calc(50%-0.5rem)] sm:w-[185px] md:w-[200px] lg:w-[215px] max-w-[230px] flex-shrink-0 bg-[#FFFEFB] hover:bg-heritage-cream/50 active:scale-98 rounded-2xl border border-heritage-border hover:border-heritage-gold shadow-heritage-sm hover:shadow-heritage p-2.5 sm:p-3 flex flex-col items-center text-center transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div
                    className="h-1 w-full absolute top-0 inset-x-0"
                    style={{ backgroundColor: branch.color || '#B6955B' }}
                  />

                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-heritage-gold/60 bg-heritage-cream shadow-2xs mb-2 relative mt-1">
                    <PersonAvatar
                      photoUrl={details.leader?.photoUrl}
                      name={details.leader?.fullName || branch.name}
                      gender={details.leader?.gender || 'female'}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[#FAF7EE] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">
                      Branch {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <h3 className="font-serif text-xs sm:text-sm font-bold text-heritage-charcoal group-hover:text-heritage-maroon leading-tight line-clamp-1 px-1">
                    {details.leader?.fullName || branch.name}
                  </h3>
                  <p className="text-[11px] text-heritage-muted mt-0.5 line-clamp-1 font-medium capitalize">
                    {branch.name}
                  </p>
                  <span className="mt-1 text-[10px] text-heritage-maroon font-bold bg-heritage-gold-50 px-2.5 py-0.5 rounded-full border border-heritage-gold/30">
                    {details.totalCount} {details.totalCount === 1 ? 'Relative' : 'Relatives'}
                  </span>
                </button>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* =========================================================================
          FOOTER (AUTHENTIC TAMIL HERITAGE FINALE)
      ========================================================================= */}
      <footer className="mt-auto bg-heritage-charcoal text-[#FAF7EE] py-12 border-t-2 border-heritage-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-heritage-gold-300" />
                <span className="font-serif text-xl font-bold text-heritage-gold-300">
                  Erode KMK Family
                </span>
              </div>
              <p className="text-xs text-white/70 max-w-sm leading-relaxed">
                Erode KMK Family Heritage Platform — Dedicated to preserving the genealogy, memories, and cultural legacy of our family for generations to come.
              </p>
              <p className="text-[11px] text-heritage-gold-400 font-serif">
                "Honoring our roots, celebrating our achievements, and inspiring future generations."
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-gold-300 mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <button onClick={() => setActiveTab('tree')} className="hover:text-heritage-gold transition-colors">
                    Interactive Family Tree
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-gold-300 mb-3">
                Heritage Registry
              </h4>
              <p className="text-xs text-white/70">
                Family Archives: Erode, Perundurai, Bhavani, Gobichettipalayam, Coimbatore, Chennai, Singapore & California.
              </p>
              <div className="mt-3 inline-block px-2.5 py-1 rounded bg-white/10 text-[10px] text-heritage-gold-300 border border-white/10 font-medium">
                Active Platform Version
              </div>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50">
            <p>© {new Date().getFullYear()} Erode KMK Family Kudumbam. All rights reserved.</p>
            <p className="mt-2 sm:mt-0 font-serif text-heritage-gold-300/80">
              Erode KMK Family Heritage & Genealogy Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
