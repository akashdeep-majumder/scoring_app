const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Tournament operations
  getAllTournaments: () => ipcRenderer.invoke('get-all-tournaments'),
  getTournament: (id) => ipcRenderer.invoke('get-tournament', id),
  addTournament: (tournament) => ipcRenderer.invoke('add-tournament', tournament),
  updateTournament: (id, updates) => ipcRenderer.invoke('update-tournament', id, updates),
  deleteTournament: (id) => ipcRenderer.invoke('delete-tournament', id),

  // Team operations
  addTeam: (team) => ipcRenderer.invoke('add-team', team),
  updateTeam: (id, updates) => ipcRenderer.invoke('update-team', id, updates),
  deleteTeam: (id) => ipcRenderer.invoke('delete-team', id),

  // Player operations
  addPlayer: (player) => ipcRenderer.invoke('add-player', player),
  updatePlayer: (id, updates) => ipcRenderer.invoke('update-player', id, updates),
  deletePlayer: (id) => ipcRenderer.invoke('delete-player', id),

  // Match operations
  getCurrentMatch: () => ipcRenderer.invoke('get-current-match'),
  addMatch: (match) => ipcRenderer.invoke('add-match', match),
  updateMatch: (match) => ipcRenderer.invoke('update-match', match),
  deleteMatch: (id) => ipcRenderer.invoke('delete-match', id),

  // Ad operations
  getAllAds: () => ipcRenderer.invoke('get-all-ads'),
  addAd: (ad) => ipcRenderer.invoke('add-ad', ad),
  updateAd: (id, updates) => ipcRenderer.invoke('update-ad', id, updates),
  deleteAd: (id) => ipcRenderer.invoke('delete-ad', id),

  // Utility operations
  openScoreboard: () => ipcRenderer.invoke('open-scoreboard'),
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: () => ipcRenderer.invoke('restore-database'),

  // Server operations
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  broadcastShowAd: (ad) => ipcRenderer.invoke('broadcast-show-ad', ad),
  broadcastCloseAd: () => ipcRenderer.invoke('broadcast-close-ad'),

  // Listen for match updates (for scoreboard)
  onMatchUpdated: (callback) => {
    ipcRenderer.on('match-updated', (event, match) => callback(match));
  },

  // Remove listener
  removeMatchUpdatedListener: () => {
    ipcRenderer.removeAllListeners('match-updated');
  }
});

// Indicate we're running in Electron
contextBridge.exposeInMainWorld('isElectron', true);
