import React, { useState, useMemo } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HeritageConfirmModal } from '../Common/HeritageConfirmModal';

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
  const [adminSearch, setAdminSearch] = useState('');
  const [filterMissing, setFilterMissing] = useState<'all' | 'photo' | 'details'>('all');

  // Filtered members in Admin table
  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.tamilName.includes(q) ||
          (m.profession && m.profession.toLowerCase().includes(q))
      );
    }

    if (filterMissing === 'photo') {
      result = result.filter((m) => !m.photoUrl || m.photoUrl.trim() === '');
    } else if (filterMissing === 'details') {
      result = result.filter((m) => !m.profession || !m.education || !m.birthDate);
    }

    return result.sort((a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName));
  }, [members, adminSearch, filterMissing]);

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
            onClick={() => setFilterMissing(filterMissing === 'photo' ? 'all' : 'photo')}
            className={`p-3.5 sm:p-5 rounded-2xl border shadow-heritage-sm flex items-center justify-between cursor-pointer transition-colors ${
              filterMissing === 'photo'
                ? 'bg-amber-50 border-amber-300'
                : 'bg-[#FFFEFB] border-heritage-border hover:border-amber-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-heritage-muted truncate">Needs Portrait Photo</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-0.5 sm:mt-1">
                {stats.missingPhotosCount}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-800 font-medium mt-0.5 sm:mt-1 truncate">
                {filterMissing === 'photo' ? 'Filtered active' : 'Click to filter'}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0 ml-2">
              <ImageOff className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            ADMIN MEMBERS TABLE & CONTROLS
        ========================================================================= */}
        <div className="bg-[#FFFEFB] rounded-2xl border border-heritage-border shadow-heritage-sm overflow-hidden">
          
          {/* Table Header Filter Row */}
          <div className="p-3 sm:p-4 border-b border-heritage-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search by name…"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-heritage-ivory border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
              />
              <Search className="w-3.5 h-3.5 text-heritage-muted absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-heritage-muted self-start sm:self-auto flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide">Filter:</span>
              <button
                onClick={() => setFilterMissing('all')}
                className={`px-2 py-1 rounded-lg text-[11px] ${filterMissing === 'all' ? 'bg-heritage-maroon text-white font-medium' : 'hover:bg-heritage-cream/60'}`}
              >
                All ({members.length})
              </button>
              <button
                onClick={() => setFilterMissing('photo')}
                className={`px-2 py-1 rounded-lg text-[11px] ${filterMissing === 'photo' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-heritage-cream/60'}`}
              >
                No Photo ({stats.missingPhotosCount})
              </button>
            </div>
          </div>

          {/* Members Table — horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-left text-xs min-w-[520px]">
              <thead className="bg-heritage-cream/40 text-heritage-charcoal border-b border-heritage-border font-serif">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Gen</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Branch</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Spouse</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Children</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-heritage-muted">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="w-8 h-8 text-heritage-border" />
                        <p className="font-serif text-sm text-heritage-charcoal">No family members found</p>
                        <p className="text-xs text-heritage-muted max-w-xs">
                          {adminSearch ? 'No members match your search.' : 'Click "Add Member" to register the first relative.'}
                        </p>
                        {!adminSearch && (
                          <button
                            onClick={() => { setDefaultParentIdForAdd(undefined); setAddModalOpen(true); }}
                            className="mt-1 inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-white text-xs font-semibold shadow-heritage-sm transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-heritage-gold-300" />
                            <span>Add First Relative</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-heritage-cream/30 transition-colors">
                    {/* Name + Avatar */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-border">
                          <PersonAvatar photoUrl={member.photoUrl} name={member.fullName} gender={member.gender} className="w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-heritage-charcoal leading-snug truncate max-w-[140px] sm:max-w-none">{member.fullName}</p>
                          <p className="text-[10px] text-heritage-muted truncate">{member.profession || member.currentCity || 'Member'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-heritage-ivory border border-heritage-border text-heritage-charcoal whitespace-nowrap">G{member.generation}</span>
                    </td>

                    <td className="py-2.5 px-3 text-heritage-charcoal font-medium hidden sm:table-cell text-[11px] max-w-[100px] truncate">{member.branchName}</td>

                    <td className="py-2.5 px-3 text-heritage-muted text-[10px] hidden md:table-cell">
                      {member.spouseId ? <span className="text-heritage-charcoal">Married</span> : <span>Single</span>}
                    </td>

                    <td className="py-2.5 px-3 hidden sm:table-cell">
                      <span className="text-[11px] font-medium text-heritage-charcoal">{member.childIds?.length || 0}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => { setDefaultParentIdForAdd(member.id); setAddModalOpen(true); }}
                          className="px-1.5 py-1 rounded bg-heritage-ivory hover:bg-heritage-cream text-[10px] font-medium text-heritage-charcoal border border-heritage-border whitespace-nowrap" title="Add child">
                          +Child
                        </button>
                        <button onClick={() => setEditingMember(member)} className="p-1 rounded hover:bg-heritage-cream text-heritage-charcoal transition-colors" title="Edit">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => locateInTree(member.id)} className="p-1 rounded hover:bg-heritage-cream text-heritage-maroon transition-colors hidden sm:inline-flex" title="Show in tree">
                          <TreePine className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeletingMember(member)}
                          className="p-1 rounded hover:bg-rose-50 text-heritage-muted hover:text-rose-600 transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

        </div>

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
