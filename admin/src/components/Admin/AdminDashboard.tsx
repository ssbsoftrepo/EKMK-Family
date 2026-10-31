import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FamilyMember } from '../../types/family';
import { PersonAvatar } from '../Common/PersonAvatar';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  TreePine, 
  AlertCircle, 
  Users, 
  Layers, 
  ImageOff,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HeritageConfirmModal } from '../Common/HeritageConfirmModal';

const PAGE_SIZE = 10;

export const AdminDashboard: React.FC = () => {
  const { 
    members, 
    branches, 
    stats, 
    locateInTree, 
    deleteMember
  } = useAdmin();

  const toast = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [defaultParentIdForAdd, setDefaultParentIdForAdd] = useState<string | undefined>(undefined);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters and search state
  const [adminSearch, setAdminSearch] = useState('');
  const [filterGen, setFilterGen] = useState<number | 'all'>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'living' | 'deceased' | 'photo' | 'details'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch, filterGen, filterBranch, filterGender, filterStatus]);

  // Available generations from database
  const availableGenerations = useMemo(() => {
    const gens = Array.from(new Set(members.map((m) => m.generation).filter(Boolean))).sort((a, b) => a - b);
    return gens;
  }, [members]);

  // Available branches from both branches list and registered members
  const availableBranches = useMemo(() => {
    const branchMap = new Map<string, string>();
    branches.forEach((b) => branchMap.set(b.id, b.name));
    members.forEach((m) => {
      if (m.branchId && m.branchName && !branchMap.has(m.branchId)) {
        branchMap.set(m.branchId, m.branchName);
      }
    });
    return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }));
  }, [branches, members]);

  // Filtered members in Admin table
  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.tamilName && m.tamilName.toLowerCase().includes(q)) ||
          (m.profession && m.profession.toLowerCase().includes(q)) ||
          (m.branchName && m.branchName.toLowerCase().includes(q)) ||
          (m.currentCity && m.currentCity.toLowerCase().includes(q)) ||
          (m.birthPlace && m.birthPlace.toLowerCase().includes(q))
      );
    }

    if (filterGen !== 'all') {
      result = result.filter((m) => m.generation === filterGen);
    }

    if (filterBranch !== 'all') {
      result = result.filter((m) => m.branchId === filterBranch);
    }

    if (filterGender !== 'all') {
      result = result.filter((m) => m.gender === filterGender);
    }

    if (filterStatus === 'living') {
      result = result.filter((m) => !m.isDeceased);
    } else if (filterStatus === 'deceased') {
      result = result.filter((m) => !!m.isDeceased);
    } else if (filterStatus === 'photo') {
      result = result.filter((m) => !m.photoUrl || m.photoUrl.trim() === '');
    } else if (filterStatus === 'details') {
      result = result.filter((m) => !m.profession || !m.education || !m.birthDate);
    }

    return result.sort((a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName));
  }, [members, adminSearch, filterGen, filterBranch, filterGender, filterStatus]);

  // Dynamic calculations from active database members
  const gen1Members = useMemo(() => members.filter((m) => m.generation === 1), [members]);
  const founder = gen1Members[0];
  const estYear = useMemo(() => {
    if (founder?.birthDate) {
      const match = founder.birthDate.match(/\d{4}/);
      if (match) return match[0];
    }
    return null;
  }, [founder]);

  const generationsDepth = useMemo(() => {
    if (members.length === 0) return 0;
    return Math.max(...members.map((m) => m.generation || 1), 1);
  }, [members]);

  const activeBranches = useMemo(() => {
    return branches.filter((b) => b.id !== 'root' && members.some((m) => m.branchId === b.id));
  }, [branches, members]);

  return (
    <div className="min-h-screen bg-heritage-ivory py-5 sm:py-8 px-3 sm:px-5 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-heritage-border pb-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-heritage-maroon uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-heritage-gold-600" />
              <span>Family Tree Administrator</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal mt-0.5">
              Admin Portal
            </h1>
            <p className="text-xs text-heritage-muted mt-0.5 hidden sm:block">
              Manage records, relationships &amp; lineage archive.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-heritage-ivory border border-heritage-border hover:border-heritage-gold text-heritage-charcoal text-[11px] font-semibold shadow-sm transition-all"
              title="Open public website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-heritage-gold-600" />
              <span className="hidden sm:inline">View Site ↗</span>
            </a>

            <button
              onClick={() => {
                setDefaultParentIdForAdd(undefined);
                setAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-semibold shadow-heritage-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-heritage-gold-300" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            ADMIN SUMMARY METRICS CARDS
        ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-5 bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-heritage-sm flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-heritage-muted truncate">Total Registered</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-maroon mt-0.5 sm:mt-1">
                {stats.totalMembers}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium mt-0.5 sm:mt-1 truncate">
                {stats.livingCount} Living • {stats.deceasedCount} Deceased
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-heritage-maroon-100 flex items-center justify-center text-heritage-maroon flex-shrink-0 ml-2">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="p-3.5 sm:p-5 bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-heritage-sm flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-heritage-muted truncate">Generations Depth</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-gold-700 mt-0.5 sm:mt-1">
                {generationsDepth}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-heritage-muted mt-0.5 sm:mt-1 truncate">
                {generationsDepth === 0
                  ? 'No generations registered'
                  : generationsDepth === 1
                  ? estYear ? `Gen 1 (${estYear}) Founding` : 'Gen 1 Founding'
                  : estYear ? `Gen 1 (${estYear}) to Gen ${generationsDepth}` : `Gen 1 to Gen ${generationsDepth}`}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-heritage-gold-100 flex items-center justify-center text-heritage-gold-900 flex-shrink-0 ml-2">
              <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="p-3.5 sm:p-5 bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-heritage-sm flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-heritage-muted truncate">Main Branches</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal mt-0.5 sm:mt-1">
                {activeBranches.length}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-heritage-muted mt-0.5 sm:mt-1 truncate">
                {activeBranches.length === 0
                  ? '0 Branch Lineages'
                  : `${activeBranches.length} ${activeBranches.length === 1 ? 'Branch Lineage' : 'Branch Lineages'}`}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-heritage-green-light/20 flex items-center justify-center text-heritage-green-dark flex-shrink-0 ml-2">
              <TreePine className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div 
            onClick={() => setFilterStatus(filterStatus === 'photo' ? 'all' : 'photo')}
            className={`p-3.5 sm:p-5 rounded-2xl border shadow-heritage-sm flex items-center justify-between cursor-pointer transition-colors ${
              filterStatus === 'photo'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-[#FFFEFB] border-heritage-border hover:border-amber-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-heritage-muted truncate">Needs Portrait Photo</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-0.5 sm:mt-1">
                {stats.missingPhotosCount}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-800 font-medium mt-0.5 sm:mt-1 truncate">
                {filterStatus === 'photo' ? 'Filtered active (click to clear)' : 'Click to filter'}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0 ml-2">
              <ImageOff className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            ADMIN MEMBERS TABLE & HERITAGE CONTROLS
        ========================================================================= */}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
          const validCurrentPage = Math.min(currentPage, totalPages);
          const paginatedMembers = filteredMembers.slice((validCurrentPage - 1) * PAGE_SIZE, validCurrentPage * PAGE_SIZE);
          const startIndex = filteredMembers.length === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1;
          const endIndex = Math.min(validCurrentPage * PAGE_SIZE, filteredMembers.length);
          const isFiltered = adminSearch.trim() !== '' || filterGen !== 'all' || filterBranch !== 'all' || filterStatus !== 'all' || filterGender !== 'all';

          const resetAllFilters = () => {
            setAdminSearch('');
            setFilterGen('all');
            setFilterBranch('all');
            setFilterStatus('all');
            setFilterGender('all');
            setCurrentPage(1);
          };

          return (
            <div className="bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-heritage-sm overflow-hidden">
              
              {/* Table Filter Toolbar */}
              <div className="p-3.5 sm:p-4 border-b border-heritage-border bg-heritage-ivory/30 space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-full lg:max-w-xs">
                    <input
                      type="text"
                      placeholder="Search name, city, job…"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon focus:ring-1 focus:ring-heritage-maroon/20 text-heritage-charcoal placeholder-heritage-muted shadow-sm transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-heritage-muted absolute left-2.5 top-2.5" />
                    {adminSearch && (
                      <button
                        onClick={() => setAdminSearch('')}
                        className="absolute right-2.5 top-2 text-heritage-muted hover:text-heritage-charcoal text-xs font-bold"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns Grid */}
                  <div className="flex items-center gap-2 flex-wrap flex-1 justify-start lg:justify-end">
                    
                    {/* Generation Filter */}
                    <div className="flex items-center">
                      <select
                        value={filterGen}
                        onChange={(e) => setFilterGen(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-2.5 py-1.5 text-xs bg-white border border-heritage-border rounded-xl text-heritage-charcoal font-medium focus:outline-none focus:border-heritage-maroon shadow-sm"
                        title="Filter by Generation"
                      >
                        <option value="all">All Generations</option>
                        {availableGenerations.map((g) => (
                          <option key={g} value={g}>
                            Gen {g} {g === 1 ? '(Roots)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Branch Filter */}
                    <div className="flex items-center">
                      <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-heritage-border rounded-xl text-heritage-charcoal font-medium focus:outline-none focus:border-heritage-maroon shadow-sm max-w-[140px] truncate"
                        title="Filter by Branch"
                      >
                        <option value="all">All Branches</option>
                        {availableBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gender Filter */}
                    <div className="flex items-center">
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value as 'all' | 'male' | 'female')}
                        className="px-2.5 py-1.5 text-xs bg-white border border-heritage-border rounded-xl text-heritage-charcoal font-medium focus:outline-none focus:border-heritage-maroon shadow-sm"
                        title="Filter by Gender"
                      >
                        <option value="all">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-heritage-border rounded-xl text-heritage-charcoal font-medium focus:outline-none focus:border-heritage-maroon shadow-sm"
                        title="Filter by Status"
                      >
                        <option value="all">All Status</option>
                        <option value="living">Living Only</option>
                        <option value="deceased">Deceased Only</option>
                        <option value="photo">Needs Photo</option>
                        <option value="details">Missing Details</option>
                      </select>
                    </div>

                    {/* Reset Filters Button */}
                    {isFiltered && (
                      <button
                        onClick={resetAllFilters}
                        className="flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-heritage-cream/80 hover:bg-heritage-cream text-heritage-maroon border border-heritage-border/80 rounded-xl font-medium transition-colors shadow-sm"
                        title="Reset all active filters"
                      >
                        <RotateCcw className="w-3 h-3 text-heritage-maroon" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter Pills / Counter Bar */}
                <div className="flex items-center justify-between text-xs text-heritage-muted pt-1 border-t border-heritage-border/40">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-[11px] font-semibold text-heritage-charcoal">
                      {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
                    </span>
                    {isFiltered && (
                      <span className="text-[10px] text-heritage-muted">
                        (of {members.length} total)
                      </span>
                    )}
                    {filterGen !== 'all' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-heritage-maroon/10 text-heritage-maroon border border-heritage-maroon/20">
                        Gen {filterGen}
                        <button onClick={() => setFilterGen('all')} className="ml-1 text-heritage-maroon hover:text-black">×</button>
                      </span>
                    )}
                    {filterBranch !== 'all' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-heritage-gold-100 text-heritage-charcoal border border-heritage-gold-300">
                        {availableBranches.find((b) => b.id === filterBranch)?.name || 'Branch'}
                        <button onClick={() => setFilterBranch('all')} className="ml-1 hover:text-black">×</button>
                      </span>
                    )}
                    {filterGender !== 'all' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                        {filterGender}
                        <button onClick={() => setFilterGender('all')} className="ml-1 hover:text-black">×</button>
                      </span>
                    )}
                    {filterStatus !== 'all' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                        {filterStatus === 'living' ? 'Living' : filterStatus === 'deceased' ? 'Deceased' : filterStatus === 'photo' ? 'No Photo' : 'Missing Details'}
                        <button onClick={() => setFilterStatus('all')} className="ml-1 hover:text-black">×</button>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-heritage-muted hidden sm:block">
                    Page {validCurrentPage} of {totalPages}
                  </div>
                </div>
              </div>

              {/* Members Table — horizontally scrollable on mobile */}
              <div className="overflow-x-auto -mx-0">
                <table className="w-full text-left text-sm min-w-[620px]">
                  <thead className="bg-heritage-cream/40 text-heritage-charcoal border-b border-heritage-border font-serif text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-bold">Name</th>
                      <th className="py-3 px-4 font-bold">Gen</th>
                      <th className="py-3 px-4 font-bold hidden sm:table-cell">Branch</th>
                      <th className="py-3 px-4 font-bold hidden md:table-cell">Marital Status</th>
                      <th className="py-3 px-4 font-bold hidden sm:table-cell">Children</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-heritage-border/60">
                    {paginatedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-heritage-muted">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Users className="w-9 h-9 text-heritage-border" />
                            <p className="font-serif text-base text-heritage-charcoal">No family members found</p>
                            <p className="text-xs text-heritage-muted max-w-xs">
                              {isFiltered ? 'No members match the selected filters.' : 'Click "Add Member" to register the first relative.'}
                            </p>
                            {isFiltered ? (
                              <button
                                onClick={resetAllFilters}
                                className="mt-1 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-heritage-ivory border border-heritage-border hover:bg-heritage-cream text-heritage-charcoal text-xs font-semibold shadow-sm transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-heritage-maroon" />
                                <span>Clear Filters</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => { setDefaultParentIdForAdd(undefined); setAddModalOpen(true); }}
                                className="mt-1 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-white text-xs font-semibold shadow-heritage-sm transition-all"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-heritage-gold-300" />
                                <span>Add First Relative</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-heritage-cream/30 transition-colors">
                          {/* Name + Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-border/80 shadow-xs">
                                <PersonAvatar photoUrl={member.photoUrl} name={member.fullName} gender={member.gender} className="w-full h-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-heritage-charcoal leading-snug truncate max-w-[160px] sm:max-w-none">{member.fullName}</p>
                                <p className="text-xs text-heritage-muted truncate mt-0.5">{member.profession || member.currentCity || 'Family Member'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-heritage-ivory border border-heritage-border text-heritage-charcoal whitespace-nowrap shadow-xs">G{member.generation}</span>
                          </td>

                          <td className="py-3 px-4 text-heritage-charcoal font-medium hidden sm:table-cell text-xs max-w-[140px] truncate">{member.branchName}</td>

                          <td className="py-3 px-4 text-xs hidden md:table-cell">
                            {(() => {
                              const sIds = ((member.spouseIds && member.spouseIds.length > 0)
                                ? member.spouseIds
                                : (member.spouseId ? [member.spouseId] : []))
                                .filter((id) => id !== member.id && id !== member.fatherId && id !== member.motherId);
                              if (sIds.length > 1) {
                                return (
                                  <span className="text-heritage-maroon font-semibold bg-heritage-maroon/10 px-2 py-0.5 rounded text-xs border border-heritage-maroon/20">
                                    Married ({sIds.length})
                                  </span>
                                );
                              }
                              if (sIds.length === 1) {
                                return <span className="text-heritage-charcoal font-medium">Married</span>;
                              }
                              return <span className="text-heritage-muted">Single</span>;
                            })()}
                          </td>

                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold bg-heritage-cream/60 border border-heritage-border/60 text-heritage-charcoal">
                              {member.childIds?.length || 0}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button onClick={() => { setDefaultParentIdForAdd(member.id); setAddModalOpen(true); }}
                                className="px-2.5 py-1.5 rounded-lg bg-heritage-ivory hover:bg-heritage-cream text-xs font-medium text-heritage-charcoal border border-heritage-border shadow-xs whitespace-nowrap transition-all" title="Add child">
                                +Child
                              </button>
                              <button onClick={() => setEditingMember(member)} className="p-1.5 rounded-lg hover:bg-heritage-cream text-heritage-charcoal transition-colors" title="Edit">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeletingMember(member)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-heritage-muted hover:text-rose-600 transition-colors cursor-pointer" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer (10 records per page) */}
              <div className="p-3 sm:p-4 border-t border-heritage-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5]">
                <div className="text-xs text-heritage-muted text-center sm:text-left">
                  Showing <span className="font-semibold text-heritage-charcoal">{startIndex}</span> to{' '}
                  <span className="font-semibold text-heritage-charcoal">{endIndex}</span> of{' '}
                  <span className="font-semibold text-heritage-charcoal">{filteredMembers.length}</span> records
                  <span className="text-[10px] text-heritage-muted ml-1.5">(10 per page)</span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-xl border border-heritage-border bg-white text-heritage-charcoal text-xs font-medium hover:bg-heritage-cream/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1 shadow-sm transition-all"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                            validCurrentPage === pageNum
                              ? 'bg-heritage-maroon text-white shadow-heritage-sm font-bold'
                              : 'bg-white border border-heritage-border text-heritage-charcoal hover:bg-heritage-cream/60'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-xl border border-heritage-border bg-white text-heritage-charcoal text-xs font-medium hover:bg-heritage-cream/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1 shadow-sm transition-all"
                      title="Next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* Modals */}
        {addModalOpen && (
          <AddMemberModal
            onClose={() => {
              setAddModalOpen(false);
              setDefaultParentIdForAdd(undefined);
            }}
            defaultParentId={defaultParentIdForAdd}
          />
        )}

        {editingMember && (
          <EditMemberModal
            member={editingMember}
            onClose={() => setEditingMember(null)}
          />
        )}

        {/* Themed Deletion Confirmation Modal */}
        {deletingMember && (
          <HeritageConfirmModal
            isOpen={true}
            title="Remove Family Member"
            message={`Are you sure you want to remove "${deletingMember.fullName}" from the family tree archive?`}
            confirmLabel="Yes, Delete Member"
            cancelLabel="Keep Record"
            isDestructive={true}
            isLoading={isDeleting}
            member={{
              fullName: deletingMember.fullName,
              tamilName: deletingMember.tamilName,
              generation: deletingMember.generation,
              gender: deletingMember.gender,
              photoUrl: deletingMember.photoUrl,
              branchName: deletingMember.branchName,
            }}
            onConfirm={async () => {
              setIsDeleting(true);
              try {
                await deleteMember(deletingMember.id);
                toast.success('Member Removed', `"${deletingMember.fullName}" was removed from the tree.`);
                setDeletingMember(null);
              } catch (err: unknown) {
                toast.error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete member');
              } finally {
                setIsDeleting(false);
              }
            }}
            onClose={() => setDeletingMember(null)}
          />
        )}

      </div>
    </div>
  );
};
