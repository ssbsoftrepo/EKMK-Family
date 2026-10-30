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

export const AdminDashboard: React.FC = () => {
  const { 
    members, 
    branches, 
    stats, 
    locateInTree, 
    deleteMember
  } = useAdmin();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [defaultParentIdForAdd, setDefaultParentIdForAdd] = useState<string | undefined>(undefined);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
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


  return (
    <div className="min-h-screen bg-heritage-ivory py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-heritage-border pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-heritage-maroon uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-heritage-gold-600" />
              <span>Family Tree Administrator</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal mt-1">
              Executive Admin Portal
            </h1>
            <p className="text-sm text-heritage-muted mt-1">
              Dedicated Family Tree Administration • Manage records, relationships, and PostgreSQL lineage archive.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-heritage-ivory border border-heritage-border hover:border-heritage-gold text-heritage-charcoal text-xs font-semibold shadow-sm transition-all"
              title="Open public genealogy & interactive tree website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-heritage-gold-600" />
              <span>View Public Website ↗</span>
            </a>

            <button
              onClick={() => {
                setDefaultParentIdForAdd(undefined);
                setAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-heritage-maroon hover:bg-heritage-maroon-800 text-[#FAF7EE] text-xs font-semibold shadow-heritage-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-heritage-gold-300" />
              <span>Add Family Member</span>
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
                {stats.totalGenerations}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-heritage-muted mt-0.5 sm:mt-1 truncate">
                Gen 1 (1912) to Gen 5
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
                {branches.filter((b) => b.id !== 'root').length || 10}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-heritage-muted mt-0.5 sm:mt-1 truncate">
                10 Branch Lineages
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
          <div className="p-4 sm:p-5 border-b border-heritage-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search member by name..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-heritage-ivory border border-heritage-border rounded-xl focus:outline-none focus:border-heritage-maroon"
              />
              <Search className="w-4 h-4 text-heritage-muted absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center space-x-2 text-xs text-heritage-muted self-end sm:self-auto">
              <span>Filter:</span>
              <button
                onClick={() => setFilterMissing('all')}
                className={`px-2.5 py-1 rounded-lg ${filterMissing === 'all' ? 'bg-heritage-maroon text-white font-medium' : 'hover:bg-heritage-cream/60'}`}
              >
                All ({members.length})
              </button>
              <button
                onClick={() => setFilterMissing('photo')}
                className={`px-2.5 py-1 rounded-lg ${filterMissing === 'photo' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-heritage-cream/60'}`}
              >
                Missing Photo ({stats.missingPhotosCount})
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-heritage-cream/40 text-heritage-charcoal border-b border-heritage-border font-serif">
                <tr>
                  <th className="py-3 px-4">Relative Name</th>
                  <th className="py-3 px-4">Gen</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Parents / Spouse</th>
                  <th className="py-3 px-4">Children</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border/60">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-heritage-cream/30 transition-colors">
                    {/* Name + Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-heritage-gold-100 flex-shrink-0 border border-heritage-border">
                          <PersonAvatar
                            photoUrl={member.photoUrl}
                            name={member.fullName}
                            gender={member.gender}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-heritage-charcoal leading-snug">
                            {member.fullName}
                          </p>
                          <p className="text-[11px] text-heritage-muted">
                            {member.profession || member.currentCity || 'Member'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Generation */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-heritage-ivory border border-heritage-border text-heritage-charcoal">
                        Gen {member.generation}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4 text-heritage-charcoal font-medium">
                      {member.branchName}
                    </td>

                    {/* Parents / Spouse */}
                    <td className="py-3 px-4 text-heritage-muted text-xs">
                      {member.spouseId ? (
                        <span className="text-heritage-charcoal">Married</span>
                      ) : (
                        <span>Single</span>
                      )}
                      {(member.fatherId || member.motherId) && (
                        <span className="ml-1 text-[10px] text-heritage-gold-700 font-medium">
                          • Has Parents
                        </span>
                      )}
                    </td>

                    {/* Children count */}
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-heritage-charcoal">
                        {member.childIds?.length || 0} Children
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        {/* Add Child Shortcut */}
                        <button
                          onClick={() => {
                            setDefaultParentIdForAdd(member.id);
                            setAddModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-heritage-ivory hover:bg-heritage-cream text-[11px] font-medium text-heritage-charcoal border border-heritage-border"
                          title="Add a child to this person"
                        >
                          + Child
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-1.5 rounded hover:bg-heritage-cream text-heritage-charcoal transition-colors"
                          title="Edit member details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Show in Tree */}
                        <button
                          onClick={() => locateInTree(member.id)}
                          className="p-1.5 rounded hover:bg-heritage-cream text-heritage-maroon transition-colors"
                          title="Show on Family Tree"
                        >
                          <TreePine className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${member.fullName}?`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-rose-50 text-heritage-muted hover:text-rose-600 transition-colors"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      </div>
    </div>
  );
};
