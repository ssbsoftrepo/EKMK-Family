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

export interface ImportReport {
  totalRows: number;
  added: number;
  updated: number;
  unchanged: number;
  skippedEmpty: number;
  addedIds: string[];
  fixes: string[];
  possibleDuplicates: { firstId: string; firstName: string; secondId: string; secondName: string; reason: string }[];
}

/** Editable site settings. WhatsApp messages use {name} and {site}. */
export interface SiteSettings {
  siteUrl: string;
  homePhotoUrl: string;
  secretNote: string;
  secretPhotoUrl: string;
  whatsappBirthday: string;
  whatsappHello: string;
  whatsappShare: string;
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  java: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await res.text().catch(() => res.statusText);
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.message) {
        message = parsed.message;
      } else if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // not json, keep raw text
    }
    throw new Error(message || `API error (${res.status})`);
  }
  return res.json();
}

// Reads use /api/admin/members (full records); the public /api/members leaves out addresses and emails.
export const familyApi = {
  // Members
  async getAllMembers(params?: {
    q?: string;
    branchId?: string;
    generation?: number;
    gender?: string;
    isDeceased?: boolean;
  }): Promise<FamilyMember[]> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.generation) searchParams.append('generation', params.generation.toString());
    if (params?.gender) searchParams.append('gender', params.gender);
    if (params?.isDeceased !== undefined) searchParams.append('isDeceased', String(params.isDeceased));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/admin/members${query}`);
    return handleResponse<FamilyMember[]>(res);
  },

  async searchMembers(query: string): Promise<FamilyMember[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE_URL}/api/admin/members/search?q=${encodeURIComponent(query.trim())}`);
    return handleResponse<FamilyMember[]>(res);
  },

  async getMemberById(id: string): Promise<FamilyMember> {
    const res = await fetch(`${API_BASE_URL}/api/admin/members/${encodeURIComponent(id)}`);
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

  // Google Form import (.xlsx / .csv). Safe to repeat: only new people are added.
  async importResponses(file: File): Promise<ImportReport> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/admin/import`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ImportReport>(res);
  },

  // Settings (WhatsApp messages, website link)
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE_URL}/api/settings`);
    return handleResponse<SiteSettings>(res);
  },

  async saveSettings(changes: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    return handleResponse<SiteSettings>(res);
  },

  // Admin & Health
  async checkHealth(): Promise<BackendHealth> {
    const res = await fetch(`${API_BASE_URL}/api/admin/health`);
    return handleResponse<BackendHealth>(res);
  },
};
