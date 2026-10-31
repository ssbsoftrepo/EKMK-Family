import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { FamilyMember, FamilyBranch, ViewTab } from '../types/family';
import { INITIAL_FAMILY_MEMBERS, FAMILY_BRANCHES } from '../data/mockFamily';
import { familyApi, BackendHealth, FamilyStats } from '../api/familyApi';

interface FamilyContextType {
  members: FamilyMember[];
  branches: FamilyBranch[];
  selectedMember: FamilyMember | null;
  setSelectedMember: (member: FamilyMember | null) => void;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  highlightedMemberId: string | null;
  setHighlightedMemberId: (id: string | null) => void;
  locateInTree: (memberId: string) => void;
  addMember: (member: Omit<FamilyMember, 'id'>) => Promise<string>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  collapsedNodeIds: Set<string>;
  toggleCollapseNode: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  getMemberById: (id: string) => FamilyMember | undefined;
  stats: FamilyStats;
  isLoading: boolean;
  isBackendConnected: boolean;
  backendInfo: BackendHealth | null;
  error: string | null;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<FamilyBranch[]>([]);
  const [backendStats, setBackendStats] = useState<FamilyStats | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendInfo, setBackendInfo] = useState<BackendHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all data from Spring Boot REST API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check Backend Health
      const health = await familyApi.checkHealth();
      setBackendInfo(health);
      setIsBackendConnected(true);

      // 2. Fetch Members & Branches & Stats in parallel
      const [membersData, branchesData, statsData] = await Promise.all([
        familyApi.getAllMembers(),
        familyApi.getAllBranches(),
        familyApi.getStats(),
      ]);

      if (Array.isArray(membersData)) {
        setMembers(membersData);
      }
      if (Array.isArray(branchesData)) {
        setBranches(branchesData);
      }
      if (statsData) {
        setBackendStats(statsData);
      }
    } catch (err: unknown) {
      console.warn('Backend API connection warning (running with cached/fallback data):', err);
      setIsBackendConnected(false);
      setError(err instanceof Error ? err.message : 'Unable to connect to Spring Boot backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getMemberById = useCallback((id: string) => {
    return members.find((m) => m.id === id);
  }, [members]);

  const locateInTree = useCallback((memberId: string) => {
    const member = getMemberById(memberId);
    if (member) {
      setHighlightedMemberId(memberId);
      setActiveTab('tree');
      // Expand parents if collapsed
      setCollapsedNodeIds((prev) => {
        const next = new Set(prev);
        if (member.fatherId) next.delete(member.fatherId);
        if (member.motherId) next.delete(member.motherId);
        return next;
      });
      // Open profile modal
      setSelectedMember(member);
    }
  }, [getMemberById]);

  // Add Member: Optimistic update + Spring Boot API call
  const addMember = useCallback(async (newMemberData: Omit<FamilyMember, 'id'>): Promise<string> => {
    const temporaryId = `ekmk-${Date.now().toString().slice(-6)}`;
    const optimisticMember: FamilyMember = {
      ...newMemberData,
      id: temporaryId,
      childIds: newMemberData.childIds || [],
    };

    // Optimistic local state update
    setMembers((prev) => {
      const updated = [...prev, optimisticMember];
      if (optimisticMember.fatherId) {
        const fIdx = updated.findIndex((m) => m.id === optimisticMember.fatherId);
        if (fIdx >= 0 && !(updated[fIdx].childIds || []).includes(temporaryId)) {
          updated[fIdx] = {
            ...updated[fIdx],
            childIds: [...(updated[fIdx].childIds || []), temporaryId],
          };
        }
      }
      if (optimisticMember.motherId) {
        const mIdx = updated.findIndex((m) => m.id === optimisticMember.motherId);
        if (mIdx >= 0 && !(updated[mIdx].childIds || []).includes(temporaryId)) {
          updated[mIdx] = {
            ...updated[mIdx],
            childIds: [...(updated[mIdx].childIds || []), temporaryId],
          };
        }
      }
      if (optimisticMember.spouseId) {
        const sIdx = updated.findIndex((m) => m.id === optimisticMember.spouseId);
        if (sIdx >= 0) {
          updated[sIdx] = {
            ...updated[sIdx],
            spouseId: temporaryId,
          };
        }
      }
      return updated;
    });

    try {
      // Sync with Spring Boot Backend
      const savedFromServer = await familyApi.createMember(optimisticMember);
      const actualId = savedFromServer.id;

      // Reconcile server response (update temporaryId references if server gave a new ID)
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === temporaryId) return savedFromServer;
          if (actualId !== temporaryId) {
            let changed = false;
            let newFatherId = m.fatherId;
            let newMotherId = m.motherId;
            let newSpouseId = m.spouseId;
            let newChildIds = m.childIds;

            if (m.fatherId === temporaryId) { newFatherId = actualId; changed = true; }
            if (m.motherId === temporaryId) { newMotherId = actualId; changed = true; }
            if (m.spouseId === temporaryId) { newSpouseId = actualId; changed = true; }
            if (m.childIds && m.childIds.includes(temporaryId)) {
              newChildIds = m.childIds.map((cid) => (cid === temporaryId ? actualId : cid));
              changed = true;
            }
            if (changed) {
              return { ...m, fatherId: newFatherId, motherId: newMotherId, spouseId: newSpouseId, childIds: newChildIds };
            }
          }
          return m;
        })
      );

      // Refresh dynamic stats from backend
      familyApi.getStats().then(setBackendStats).catch(() => {});

      return actualId;
    } catch (err) {
      console.error('Failed to save new member to Spring Boot backend:', err);
      return temporaryId;
    }
  }, []);

  // Update Member: Optimistic update + Spring Boot API call
  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>): Promise<void> => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, ...updates };
        }
        return m;
      })
    );

    if (selectedMember && selectedMember.id === id) {
      setSelectedMember((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await familyApi.updateMember(id, updates);
      // Refresh dynamic stats from backend
      familyApi.getStats().then(setBackendStats).catch(() => {});
    } catch (err) {
      console.error(`Failed to update member ${id} in backend:`, err);
    }
  }, [selectedMember]);

  // Delete Member: Optimistic update + Spring Boot API call
  const deleteMember = useCallback(async (id: string): Promise<void> => {
    setMembers((prev) =>
      prev
        .filter((m) => m.id !== id)
        .map((m) => ({
          ...m,
          fatherId: m.fatherId === id ? undefined : m.fatherId,
          motherId: m.motherId === id ? undefined : m.motherId,
          spouseId: m.spouseId === id ? undefined : m.spouseId,
          childIds: (m.childIds || []).filter((cid) => cid !== id),
        }))
    );

    if (selectedMember && selectedMember.id === id) {
      setSelectedMember(null);
    }
    if (highlightedMemberId === id) {
      setHighlightedMemberId(null);
    }

    try {
      await familyApi.deleteMember(id);
      // Refresh dynamic stats from backend
      familyApi.getStats().then(setBackendStats).catch(() => {});
    } catch (err) {
      console.error(`Failed to delete member ${id} from backend:`, err);
    }
  }, [selectedMember, highlightedMemberId]);



  const toggleCollapseNode = useCallback((id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    const toCollapse = new Set<string>();
    members.forEach((m) => {
      if (m.childIds && m.childIds.length > 0 && m.generation >= 2) {
        toCollapse.add(m.id);
      }
    });
    setCollapsedNodeIds(toCollapse);
  }, [members]);

  // Dynamic statistics: uses backendStats if available, otherwise computes from live members array
  const computedStats: FamilyStats = useMemo(() => {
    if (backendStats) {
      return backendStats;
    }

    const totalMembers = members.length;
    let maxGen = members.length > 0 ? 1 : 0;
    let living = 0;
    let deceased = 0;
    let missingPhotos = 0;
    let missingDetails = 0;

    members.forEach((m) => {
      if (m.generation > maxGen) maxGen = m.generation;
      if (m.isDeceased) deceased++;
      else living++;
      if (!m.photoUrl || m.photoUrl.trim() === '') missingPhotos++;
      if (!m.profession || !m.education || !m.birthDate) missingDetails++;
    });

    return {
      totalMembers,
      totalGenerations: maxGen,
      totalBranches: branches.length,
      livingCount: living,
      deceasedCount: deceased,
      missingPhotosCount: missingPhotos,
      missingDetailsCount: missingDetails,
    };
  }, [backendStats, members, branches]);

  return (
    <FamilyContext.Provider
      value={{
        members,
        branches,
        selectedMember,
        setSelectedMember,
        activeTab,
        setActiveTab,
        highlightedMemberId,
        setHighlightedMemberId,
        locateInTree,
        addMember,
        updateMember,
        deleteMember,
        refreshData,
        collapsedNodeIds,
        toggleCollapseNode,
        expandAll,
        collapseAll,
        getMemberById,
        stats: computedStats,
        isLoading,
        isBackendConnected,
        backendInfo,
        error,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
