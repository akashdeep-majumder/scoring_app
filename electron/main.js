const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, closeDatabase } = require('./database');
const dbOps = require('./db-operations');
const { startServer, stopServer, getServerInfo } = require('./server');

let mainWindow = null;
let scoreboardWindow = null;
let serverBroadcast = null;

app.whenReady().then(async () => {
  try {
    initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Database Error', 'Failed to initialize database: ' + error.message);
  }

  // Start Express server
  try {
    const server = await startServer(3000);
    serverBroadcast = {
      matchUpdate: server.broadcastMatchUpdate,
      showAd: server.broadcastShowAd,
      closeAd: server.broadcastCloseAd
    };
    console.log('Express server started successfully');
  } catch (error) {
    console.error('Failed to start Express server:', error);
    // Continue without server - app will work in local mode
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

function createMainWindow() {
  console.log('Creating main window...');
  console.log('__dirname:', __dirname);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/cricket-icon.png')
  });

  // Always open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading development URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, the path is different when packaged
    // Try multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(process.resourcesPath, 'app/dist/index.html'),
      path.join(process.resourcesPath, 'dist/index.html'),
      path.join(__dirname, '../../dist/index.html')
    ];

    console.log('Searching for index.html in possible locations:');
    let indexPath = null;
    for (const testPath of possiblePaths) {
      console.log(`  Testing: ${testPath} - exists: ${fs.existsSync(testPath)}`);
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        break;
      }
    }

    if (indexPath) {
      console.log('Loading production file:', indexPath);
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load index.html:', err);
        dialog.showErrorBox('Load Error', 'Failed to load application: ' + err.message);
      });
    } else {
      console.error('index.html not found in any location!');
      console.error('__dirname:', __dirname);
      console.error('resourcesPath:', process.resourcesPath);
      dialog.showErrorBox('File Not Found', 'Could not find index.html in any expected location');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create scoreboard window
ipcMain.handle('open-scoreboard', () => {
  if (scoreboardWindow) {
    scoreboardWindow.focus();
    return;
  }

  scoreboardWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Hide menu bar
  scoreboardWindow.setMenuBarVisibility(false);

  if (process.env.NODE_ENV === 'development') {
    scoreboardWindow.loadURL('http://localhost:5173/#/scoreboard');
  } else {
    scoreboardWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/scoreboard'
    });
  }

  scoreboardWindow.on('closed', () => {
    scoreboardWindow = null;
  });
});

// ==================== TOURNAMENT IPC HANDLERS ====================

ipcMain.handle('get-all-tournaments', async () => {
  try {
    return { success: true, data: dbOps.getAllTournaments() };
  } catch (error) {
    console.error('Error getting tournaments:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-tournament', async (event, id) => {
  try {
    return { success: true, data: dbOps.getTournamentById(id) };
  } catch (error) {
    console.error('Error getting tournament:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-tournament', async (event, tournament) => {
  try {
    return { success: true, data: dbOps.addTournament(tournament) };
  } catch (error) {
    console.error('Error adding tournament:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-tournament', async (event, id, updates) => {
  try {
    return { success: true, data: dbOps.updateTournament(id, updates) };
  } catch (error) {
    console.error('Error updating tournament:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-tournament', async (event, id) => {
  try {
    return { success: true, data: dbOps.deleteTournament(id) };
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return { success: false, error: error.message };
  }
});

// ==================== TEAM IPC HANDLERS ====================

ipcMain.handle('add-team', async (event, team) => {
  try {
    return { success: true, data: dbOps.addTeam(team) };
  } catch (error) {
    console.error('Error adding team:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-team', async (event, id, updates) => {
  try {
    return { success: true, data: dbOps.updateTeam(id, updates) };
  } catch (error) {
    console.error('Error updating team:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-team', async (event, id) => {
  try {
    return { success: true, data: dbOps.deleteTeam(id) };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
});

// ==================== PLAYER IPC HANDLERS ====================

ipcMain.handle('add-player', async (event, player) => {
  try {
    return { success: true, data: dbOps.addPlayer(player) };
  } catch (error) {
    console.error('Error adding player:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-player', async (event, id, updates) => {
  try {
    return { success: true, data: dbOps.updatePlayer(id, updates) };
  } catch (error) {
    console.error('Error updating player:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-player', async (event, id) => {
  try {
    return { success: true, data: dbOps.deletePlayer(id) };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { success: false, error: error.message };
  }
});

// ==================== MATCH IPC HANDLERS ====================

ipcMain.handle('get-current-match', async () => {
  try {
    return { success: true, data: dbOps.getCurrentMatch() };
  } catch (error) {
    console.error('Error getting current match:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-match', async (event, match) => {
  try {
    return { success: true, data: dbOps.addMatch(match) };
  } catch (error) {
    console.error('Error adding match:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-match', async (event, match) => {
  try {
    const result = dbOps.updateMatch(match);

    // Notify scoreboard window if it's open
    if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
      scoreboardWindow.webContents.send('match-updated', result);
    }

    // Broadcast to network clients via Socket.IO
    if (serverBroadcast && serverBroadcast.matchUpdate) {
      serverBroadcast.matchUpdate(result);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating match:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-match', async (event, id) => {
  try {
    return { success: true, data: dbOps.deleteMatch(id) };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { success: false, error: error.message };
  }
});

// ==================== AD IPC HANDLERS ====================

ipcMain.handle('get-all-ads', async () => {
  try {
    return { success: true, data: dbOps.getAllAds() };
  } catch (error) {
    console.error('Error getting ads:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-ad', async (event, ad) => {
  try {
    return { success: true, data: dbOps.addAd(ad) };
  } catch (error) {
    console.error('Error adding ad:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-ad', async (event, id, updates) => {
  try {
    return { success: true, data: dbOps.updateAd(id, updates) };
  } catch (error) {
    console.error('Error updating ad:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-ad', async (event, id) => {
  try {
    return { success: true, data: dbOps.deleteAd(id) };
  } catch (error) {
    console.error('Error deleting ad:', error);
    return { success: false, error: error.message };
  }
});

// ==================== SERVER HANDLERS ====================

// Get server information
ipcMain.handle('get-server-info', async () => {
  try {
    const info = getServerInfo();
    return { success: true, data: info };
  } catch (error) {
    console.error('Error getting server info:', error);
    return { success: false, error: error.message };
  }
});

// Broadcast ad to display clients
ipcMain.handle('broadcast-show-ad', async (event, ad) => {
  try {
    if (serverBroadcast && serverBroadcast.showAd) {
      serverBroadcast.showAd(ad);
      return { success: true, message: 'Ad broadcasted to displays' };
    }
    return { success: false, error: 'Server not running' };
  } catch (error) {
    console.error('Error broadcasting ad:', error);
    return { success: false, error: error.message };
  }
});

// Broadcast close ad to display clients
ipcMain.handle('broadcast-close-ad', async () => {
  try {
    if (serverBroadcast && serverBroadcast.closeAd) {
      serverBroadcast.closeAd();
      return { success: true, message: 'Ad close broadcasted to displays' };
    }
    return { success: false, error: 'Server not running' };
  } catch (error) {
    console.error('Error broadcasting ad close:', error);
    return { success: false, error: error.message };
  }
});

// ==================== BACKUP/RESTORE HANDLERS ====================

ipcMain.handle('backup-database', async () => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup Database',
      defaultPath: `cricket-scoring-backup-${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }]
    });

    if (filePath) {
      const dbPath = path.join(app.getPath('userData'), 'cricket-scoring.db');
      fs.copyFileSync(dbPath, filePath);
      return { success: true, message: 'Database backed up successfully' };
    }

    return { success: false, message: 'Backup cancelled' };
  } catch (error) {
    console.error('Error backing up database:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-database', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Restore Database',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const dbPath = path.join(app.getPath('userData'), 'cricket-scoring.db');

      // Close current database
      closeDatabase();

      // Restore backup
      fs.copyFileSync(filePaths[0], dbPath);

      // Reinitialize database
      initDatabase();

      // Reload all windows
      if (mainWindow) mainWindow.reload();
      if (scoreboardWindow) scoreboardWindow.reload();

      return { success: true, message: 'Database restored successfully' };
    }

    return { success: false, message: 'Restore cancelled' };
  } catch (error) {
    console.error('Error restoring database:', error);
    return { success: false, error: error.message };
  }
});

// Clean up on quit
app.on('before-quit', async () => {
  closeDatabase();
  await stopServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Application Error', error.message);
});
