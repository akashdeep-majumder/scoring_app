// API Bridge for Electron IPC
// This provides a unified API whether running in Electron or web browser

declare global {
  interface Window {
    electronAPI?: {
      // Tournament operations
      getAllTournaments: () => Promise<{ success: boolean; data: any; error?: string }>;
      getTournament: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;
      addTournament: (tournament: any) => Promise<{ success: boolean; data: any; error?: string }>;
      updateTournament: (id: string, updates: any) => Promise<{ success: boolean; data: any; error?: string }>;
      deleteTournament: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;

      // Team operations
      addTeam: (team: any) => Promise<{ success: boolean; data: any; error?: string }>;
      updateTeam: (id: string, updates: any) => Promise<{ success: boolean; data: any; error?: string }>;
      deleteTeam: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;

      // Player operations
      addPlayer: (player: any) => Promise<{ success: boolean; data: any; error?: string }>;
      updatePlayer: (id: string, updates: any) => Promise<{ success: boolean; data: any; error?: string }>;
      deletePlayer: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;

      // Match operations
      getCurrentMatch: () => Promise<{ success: boolean; data: any; error?: string }>;
      addMatch: (match: any) => Promise<{ success: boolean; data: any; error?: string }>;
      updateMatch: (match: any) => Promise<{ success: boolean; data: any; error?: string }>;
      deleteMatch: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;

      // Ad operations
      getAllAds: () => Promise<{ success: boolean; data: any; error?: string }>;
      addAd: (ad: any) => Promise<{ success: boolean; data: any; error?: string }>;
      updateAd: (id: string, updates: any) => Promise<{ success: boolean; data: any; error?: string }>;
      deleteAd: (id: string) => Promise<{ success: boolean; data: any; error?: string }>;

      // Utility operations
      openScoreboard: () => Promise<void>;
      backupDatabase: () => Promise<{ success: boolean; message?: string; error?: string }>;
      restoreDatabase: () => Promise<{ success: boolean; message?: string; error?: string }>;
      getServerInfo: () => Promise<{ ip: string; port: number } | null>;

      // Event listeners
      onMatchUpdated: (callback: (match: any) => void) => void;
      removeMatchUpdatedListener: () => void;
    };
    isElectron?: boolean;
  }
}

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.isElectron === true;
};

// Fallback localStorage functions for web version
const localStorageAPI = {
  async getAllTournaments() {
    const data = localStorage.getItem('tournaments');
    return { success: true, data: data ? JSON.parse(data) : [] };
  },

  async getTournament(id: string) {
    const { data: tournaments } = await localStorageAPI.getAllTournaments();
    const tournament = tournaments.find((t: any) => t.id === id);
    return { success: true, data: tournament || null };
  },

  async addTournament(tournament: any) {
    const { data: tournaments} = await localStorageAPI.getAllTournaments();
    tournaments.push(tournament);
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    return { success: true, data: tournament };
  },

  async updateTournament(id: string, updates: any) {
    const { data: tournaments } = await localStorageAPI.getAllTournaments();
    const index = tournaments.findIndex((t: any) => t.id === id);
    if (index !== -1) {
      tournaments[index] = { ...tournaments[index], ...updates };
      localStorage.setItem('tournaments', JSON.stringify(tournaments));
      return { success: true, data: tournaments[index] };
    }
    return { success: false, error: 'Tournament not found' };
  },

  async deleteTournament(id: string) {
    const { data: tournaments } = await localStorageAPI.getAllTournaments();
    const filtered = tournaments.filter((t: any) => t.id !== id);
    localStorage.setItem('tournaments', JSON.stringify(filtered));
    return { success: true, data: { success: true } };
  },

  async getCurrentMatch() {
    const data = localStorage.getItem('currentMatch');
    return { success: true, data: data ? JSON.parse(data) : null };
  },

  async addMatch(match: any) {
    localStorage.setItem('currentMatch', JSON.stringify(match));
    return { success: true, data: match };
  },

  async updateMatch(match: any) {
    localStorage.setItem('currentMatch', JSON.stringify(match));
    return { success: true, data: match };
  },

  async deleteMatch() {
    localStorage.removeItem('currentMatch');
    return { success: true, data: { success: true } };
  },

  async getAllAds() {
    const data = localStorage.getItem('ads');
    return { success: true, data: data ? JSON.parse(data) : [] };
  },

  async addAd(ad: any) {
    const { data: ads } = await localStorageAPI.getAllAds();
    ads.push(ad);
    localStorage.setItem('ads', JSON.stringify(ads));
    return { success: true, data: ad };
  },

  async updateAd(id: string, updates: any) {
    const { data: ads } = await localStorageAPI.getAllAds();
    const index = ads.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      ads[index] = { ...ads[index], ...updates };
      localStorage.setItem('ads', JSON.stringify(ads));
      return { success: true, data: ads[index] };
    }
    return { success: false, error: 'Ad not found' };
  },

  async deleteAd(id: string) {
    const { data: ads } = await localStorageAPI.getAllAds();
    const filtered = ads.filter((a: any) => a.id !== id);
    localStorage.setItem('ads', JSON.stringify(filtered));
    return { success: true, data: { success: true } };
  },

  async openScoreboard() {
    window.open('/scoreboard', '_blank');
  },

  async backupDatabase() {
    return { success: false, error: 'Backup not available in web version' };
  },

  async restoreDatabase() {
    return { success: false, error: 'Restore not available in web version' };
  },

  onMatchUpdated() {
    // Fallback: use storage events or polling
  },

  removeMatchUpdatedListener() {
    // No-op for web version
  }
};

// Import server API
import { serverAPI } from './server-api';

// Export unified API
// Priority: ElectronAPI -> ServerAPI (for browser on network) -> LocalStorageAPI (fallback)
export const api = isElectron() && window.electronAPI ? window.electronAPI : serverAPI;

export default api;
