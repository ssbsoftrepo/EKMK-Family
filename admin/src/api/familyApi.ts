import { FamilyMember, FamilyBranch } from '../types/family';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface FamilyStats {
  totalMembers: number;
  totalGenerations: number;
  totalBranches: number;
  livingCount: number;
  deceasedCount: number;
  missingPhotosCount: number;
  missingDetailsCount: number;
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  java: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export const familyApi = {
  // Members
  async getAllMembers(params?: { branchId?: string; generation?: number }): Promise<FamilyMember[]> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.generation) searchParams.append('generation', params.generation.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/members${query}`);
    return handleResponse<FamilyMember[]>(res);
  },

  async getMemberById(id: string): Promise<FamilyMember> {
    const res = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(id)}`);
    return handleResponse<FamilyMember>(res);
  },

  async createMember(member: Partial<FamilyMember>): Promise<FamilyMember> {
    const res = await fetch(`${API_BASE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    return handleResponse<FamilyMember>(res);
  },

  async updateMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const res = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<FamilyMember>(res);
  },

  async deleteMember(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete member: ${res.statusText}`);
    }
  },

  // Branches
  async getAllBranches(): Promise<FamilyBranch[]> {
    const res = await fetch(`${API_BASE_URL}/api/branches`);
    return handleResponse<FamilyBranch[]>(res);
  },

  async getBranchById(id: string): Promise<FamilyBranch> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${encodeURIComponent(id)}`);
    return handleResponse<FamilyBranch>(res);
  },

  // Stats
  async getStats(): Promise<FamilyStats> {
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    return handleResponse<FamilyStats>(res);
  },

  // Media Upload
  async uploadPhoto(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(res);
  },

  // Admin & Health
  async checkHealth(): Promise<BackendHealth> {
    const res = await fetch(`${API_BASE_URL}/api/admin/health`);
    return handleResponse<BackendHealth>(res);
  },
};
