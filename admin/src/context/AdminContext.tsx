import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FamilyMember, FamilyBranch } from '../types/family';
import { familyApi, BackendHealth, FamilyStats } from '../api/familyApi';

interface AdminContextType {
  members: FamilyMember[];
  branches: FamilyBranch[];
  selectedMember: FamilyMember | null;
  setSelectedMember: (member: FamilyMember | null) => void;
  locateInTree: (memberId: string) => void;
  addMember: (member: Omit<FamilyMember, 'id'>) => Promise<string>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getMemberById: (id: string) => FamilyMember | undefined;
  stats: FamilyStats;
  isLoading: boolean;
  isBackendConnected: boolean;
  backendInfo: BackendHealth | null;
  error: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<FamilyBranch[]>([]);
  const [backendStats, setBackendStats] = useState<FamilyStats | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendInfo, setBackendInfo] = useState<BackendHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const health = await familyApi.checkHealth();
      setBackendInfo(health);
      setIsBackendConnected(true);

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
      console.error('Failed to load data from Spring Boot backend:', err);
      setIsBackendConnected(false);
      setError(err instanceof Error ? err.message : 'Unable to connect to Spring Boot backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getMemberById = useCallback((id: string) => {
    return members.find((m) => m.id === id);
  }, [members]);

  const locateInTree = useCallback((memberId: string) => {
    // Open public interactive tree focusing on member
    window.open(`http://localhost:5173/?focusMember=${memberId}`, '_blank');
  }, []);

  const addMember = useCallback(async (newMemberData: Omit<FamilyMember, 'id'>): Promise<string> => {
    try {
      const savedFromServer = await familyApi.createMember(newMemberData);
      await refreshData();
      return savedFromServer.id;
    } catch (err) {
      console.error('Failed to create member in backend:', err);
      throw err;
    }
  }, [refreshData]);

  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>): Promise<void> => {
    // Optimistic local update
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    try {
      await familyApi.updateMember(id, updates);
      await refreshData();
    } catch (err) {
      console.error('Failed to update member in backend:', err);
      await refreshData();
      throw err;
    }
  }, [refreshData]);

  const deleteMember = useCallback(async (id: string): Promise<void> => {
    setMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      await familyApi.deleteMember(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete member from backend:', err);
      await refreshData();
      throw err;
    }
  }, [refreshData]);

  const computedStats: FamilyStats = useMemo(() => {
    if (backendStats) return backendStats;

    const totalMembers = members.length;
    let maxGen = 1;
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
    <AdminContext.Provider
      value={{
        members,
        branches,
        selectedMember,
        setSelectedMember,
        locateInTree,
        addMember,
        updateMember,
        deleteMember,
        refreshData,
        getMemberById,
        stats: computedStats,
        isLoading,
        isBackendConnected,
        backendInfo,
        error,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
