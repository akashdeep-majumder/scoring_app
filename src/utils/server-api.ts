// Server API for browser/network access
// This allows the app to work from any device on the network

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let matchUpdateCallback: ((match: any) => void) | null = null;

const getServerUrl = (): string => {
  // Try to auto-detect from current location if on network
  if (typeof window !== 'undefined' && window.location.port !== '5173') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  // Fall back to localStorage or default
  return localStorage.getItem('serverUrl') || 'http://localhost:3000';
};

const connectSocket = () => {
  if (!socket) {
    socket = io(getServerUrl(), {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to server via Socket.IO');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for data updates
    socket.on('match:updated', (match: any) => {
      console.log('Received match update:', match);
      if (matchUpdateCallback) {
        matchUpdateCallback(match);
      }
    });

    socket.on('tournament:added', () => {
      console.log('Tournament added - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });

    socket.on('tournament:updated', () => {
      console.log('Tournament updated - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });

    socket.on('tournament:deleted', () => {
      console.log('Tournament deleted - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });

    socket.on('ad:added', () => {
      console.log('Ad added - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });

    socket.on('ad:updated', () => {
      console.log('Ad updated - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });

    socket.on('ad:deleted', () => {
      console.log('Ad deleted - refreshing data');
      window.dispatchEvent(new CustomEvent('data-updated'));
    });
  }
  return socket;
};

export const serverAPI = {
  async getAllTournaments() {
    try {
      const response = await fetch(`${getServerUrl()}/api/tournaments`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      return { success: false, error: 'Failed to fetch tournaments' };
    }
  },

  async getTournament(id: string) {
    try {
      const response = await fetch(`${getServerUrl()}/api/tournament/${id}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      return { success: false, error: 'Failed to fetch tournament' };
    }
  },

  async addTournament(tournament: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournament)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to add tournament:', error);
      return { success: false, error: 'Failed to add tournament' };
    }
  },

  async updateTournament(id: string, updates: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/tournament/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to update tournament:', error);
      return { success: false, error: 'Failed to update tournament' };
    }
  },

  async deleteTournament(id: string) {
    try {
      const response = await fetch(`${getServerUrl()}/api/tournament/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      return { success: false, error: 'Failed to delete tournament' };
    }
  },

  async addTeam(_team: any) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async updateTeam(_id: string, _updates: any) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async deleteTeam(_id: string) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async addPlayer(_player: any) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async updatePlayer(_id: string, _updates: any) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async deletePlayer(_id: string) {
    return { success: false, data: null, error: 'Write operations only available in Electron app' };
  },

  async getCurrentMatch() {
    try {
      const response = await fetch(`${getServerUrl()}/api/match/current`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch current match:', error);
      return { success: false, error: 'Failed to fetch current match' };
    }
  },

  async addMatch(match: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to add match:', error);
      return { success: false, error: 'Failed to add match' };
    }
  },

  async updateMatch(match: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/match/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to update match:', error);
      return { success: false, error: 'Failed to update match' };
    }
  },

  async deleteMatch(id: string) {
    try {
      const response = await fetch(`${getServerUrl()}/api/match/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to delete match:', error);
      return { success: false, error: 'Failed to delete match' };
    }
  },

  async getAllAds() {
    try {
      const response = await fetch(`${getServerUrl()}/api/ads`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      return { success: false, error: 'Failed to fetch ads' };
    }
  },

  async addAd(ad: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to add ad:', error);
      return { success: false, error: 'Failed to add ad' };
    }
  },

  async updateAd(id: string, updates: any) {
    try {
      const response = await fetch(`${getServerUrl()}/api/ad/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to update ad:', error);
      return { success: false, error: 'Failed to update ad' };
    }
  },

  async deleteAd(id: string) {
    try {
      const response = await fetch(`${getServerUrl()}/api/ad/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to delete ad:', error);
      return { success: false, error: 'Failed to delete ad' };
    }
  },

  async openScoreboard() {
    window.open('/network-scoreboard', '_blank');
  },

  async backupDatabase() {
    return { success: false, error: 'Backup not available in browser mode' };
  },

  async restoreDatabase() {
    return { success: false, error: 'Restore not available in browser mode' };
  },

  async getServerInfo() {
    return null;
  },

  onMatchUpdated(callback: (match: any) => void) {
    connectSocket();
    matchUpdateCallback = callback;
  },

  removeMatchUpdatedListener() {
    matchUpdateCallback = null;
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
