const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const dbOperations = require('./db-operations');

let io = null;
let server = null;
let httpServer = null;

// Get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Create HTTP server
    httpServer = http.createServer(app);

    // Initialize Socket.IO
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // ==================== BROADCAST FUNCTIONS ====================

    const broadcastMatchUpdate = (match) => {
      if (io) {
        io.emit('match:updated', match);
        console.log('Broadcasting match update to all clients');
      }
    };

    const broadcastShowAd = (ad) => {
      if (io) {
        io.emit('ad:show', ad);
        console.log('Broadcasting show ad to all clients');
      }
    };

    const broadcastCloseAd = () => {
      if (io) {
        io.emit('ad:close');
        console.log('Broadcasting close ad to all clients');
      }
    };

    const broadcastDataUpdate = (event, data) => {
      if (io) {
        io.emit(event, data);
        console.log(`Broadcasting ${event} to all clients`);
      }
    };

    // ==================== API ROUTES ====================

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get current match
    app.get('/api/match/current', (req, res) => {
      try {
        const match = dbOperations.getCurrentMatch();
        res.json({ success: true, data: match });
      } catch (error) {
        console.error('Error getting current match:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get all tournaments (for match selection)
    app.get('/api/tournaments', (req, res) => {
      try {
        const tournaments = dbOperations.getAllTournaments();
        res.json({ success: true, data: tournaments });
      } catch (error) {
        console.error('Error getting tournaments:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get specific match by ID
    app.get('/api/match/:matchId', (req, res) => {
      try {
        const { matchId } = req.params;
        const tournaments = dbOperations.getAllTournaments();

        // Search for match across all tournaments
        let foundMatch = null;
        for (const tournament of tournaments) {
          const match = tournament.matches.find(m => m.id === matchId);
          if (match) {
            foundMatch = match;
            break;
          }
        }

        if (foundMatch) {
          res.json({ success: true, data: foundMatch });
        } else {
          res.status(404).json({ success: false, error: 'Match not found' });
        }
      } catch (error) {
        console.error('Error getting match:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get all ads
    app.get('/api/ads', (req, res) => {
      try {
        const ads = dbOperations.getAllAds();
        res.json({ success: true, data: ads });
      } catch (error) {
        console.error('Error getting ads:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get enabled ads for a tournament
    app.get('/api/ads/tournament/:tournamentId', (req, res) => {
      try {
        const { tournamentId } = req.params;
        const allAds = dbOperations.getAllAds();
        const tournamentAds = allAds.filter(ad =>
          ad.tournamentId === tournamentId && ad.enabled
        );
        res.json({ success: true, data: tournamentAds });
      } catch (error) {
        console.error('Error getting tournament ads:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get tournament by ID
    app.get('/api/tournament/:id', (req, res) => {
      try {
        const { id } = req.params;
        const tournament = dbOperations.getTournamentById(id);
        res.json({ success: true, data: tournament });
      } catch (error) {
        console.error('Error getting tournament:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Serve ad video files
    app.get('/api/ad/video/:adId', (req, res) => {
      try {
        const { adId } = req.params;
        console.log(`Video request for ad ID: ${adId}`);

        const allAds = dbOperations.getAllAds();
        console.log(`Total ads in database: ${allAds.length}`);

        const ad = allAds.find(a => a.id === adId);

        if (!ad || !ad.filePath) {
          console.error(`Ad not found or no filePath. Ad exists: ${!!ad}, Has filePath: ${!!ad?.filePath}`);
          return res.status(404).json({ success: false, error: 'Ad not found' });
        }

        console.log(`Ad found: ${ad.name}, filePath: ${ad.filePath}`);

        // Convert file:// URL to actual file path
        let filePath = ad.filePath;
        if (filePath.startsWith('file://')) {
          filePath = filePath.replace('file://', '');
          // Handle Windows paths
          if (process.platform === 'win32' && filePath.startsWith('/')) {
            filePath = filePath.substring(1);
          }
        }

        console.log(`Resolved file path: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.error(`Video file not found at path: ${filePath}`);
          return res.status(404).json({ success: false, error: 'Video file not found' });
        }

        console.log(`Video file exists, preparing to stream...`);

        // Stream the video file
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(206, head);
          file.pipe(res);
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(200, head);
          fs.createReadStream(filePath).pipe(res);
        }
      } catch (error) {
        console.error('Error serving ad video:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== WRITE API ENDPOINTS ====================

    // Tournament operations
    app.post('/api/tournaments', (req, res) => {
      try {
        const tournament = dbOperations.addTournament(req.body);
        broadcastDataUpdate('tournament:added', tournament);
        res.json({ success: true, data: tournament });
      } catch (error) {
        console.error('Error adding tournament:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.put('/api/tournament/:id', (req, res) => {
      try {
        const { id } = req.params;
        const tournament = dbOperations.updateTournament(id, req.body);
        broadcastDataUpdate('tournament:updated', tournament);
        res.json({ success: true, data: tournament });
      } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/tournament/:id', (req, res) => {
      try {
        const { id } = req.params;
        dbOperations.deleteTournament(id);
        broadcastDataUpdate('tournament:deleted', { id });
        res.json({ success: true, data: { success: true } });
      } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Match operations
    app.post('/api/matches', (req, res) => {
      try {
        const match = dbOperations.addMatch(req.body);
        broadcastMatchUpdate(match);
        res.json({ success: true, data: match });
      } catch (error) {
        console.error('Error adding match:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.put('/api/match/:id', (req, res) => {
      try {
        const match = dbOperations.updateMatch(req.body);
        broadcastMatchUpdate(match);
        res.json({ success: true, data: match });
      } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/match/:id', (req, res) => {
      try {
        const { id } = req.params;
        dbOperations.deleteMatch(id);
        broadcastDataUpdate('match:deleted', { id });
        res.json({ success: true, data: { success: true } });
      } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Ad operations
    app.post('/api/ads', (req, res) => {
      try {
        const ad = dbOperations.addAd(req.body);
        broadcastDataUpdate('ad:added', ad);
        res.json({ success: true, data: ad });
      } catch (error) {
        console.error('Error adding ad:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.put('/api/ad/:id', (req, res) => {
      try {
        const { id } = req.params;
        const ad = dbOperations.updateAd(id, req.body);
        broadcastDataUpdate('ad:updated', ad);
        res.json({ success: true, data: ad });
      } catch (error) {
        console.error('Error updating ad:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/ad/:id', (req, res) => {
      try {
        const { id } = req.params;
        dbOperations.deleteAd(id);
        broadcastDataUpdate('ad:deleted', { id });
        res.json({ success: true, data: { success: true } });
      } catch (error) {
        console.error('Error deleting ad:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Broadcast show ad
    app.post('/api/ad/show', (req, res) => {
      try {
        const ad = req.body;

        let modifiedAd = { ...ad };

        // Only convert to HTTP URL if it's a file:// URL
        // Leave data URLs as-is since they work directly in the browser
        if (ad.filePath && ad.filePath.startsWith('file://')) {
          const localIP = getLocalIP();
          const port = httpServer.address().port;
          modifiedAd.filePath = `http://${localIP}:${port}/api/ad/video/${ad.id}`;
          console.log(`Converting file:// to HTTP URL: ${modifiedAd.filePath}`);
        } else if (ad.filePath && ad.filePath.startsWith('data:')) {
          console.log(`Using data URL directly (length: ${ad.filePath.length} chars)`);
        } else {
          console.log(`Broadcasting ad with original filePath: ${ad.filePath}`);
        }

        broadcastShowAd(modifiedAd);
        res.json({ success: true, message: 'Ad broadcasted' });
      } catch (error) {
        console.error('Error broadcasting ad:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Broadcast close ad
    app.post('/api/ad/close', (req, res) => {
      try {
        broadcastCloseAd();
        res.json({ success: true, message: 'Ad close broadcasted' });
      } catch (error) {
        console.error('Error broadcasting ad close:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== SERVE HTML PAGES ====================

    // Check if we're in development mode (Vite running)
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // In development, we need to proxy requests to Vite
      // But we can't redirect to localhost:5173 because network devices won't reach it
      // Instead, we'll serve a simple HTML page that loads from the current server's IP

      app.get('/network-scoreboard', (req, res) => {
        const host = req.headers.host; // This will be the IP:port that the client connected to
        // Serve a simple scoreboard that fetches from API
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cricket Scoreboard</title>
              <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'Arial', sans-serif;
                  background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #4c1d95 100%);
                  color: white;
                  min-height: 100vh;
                  padding: 20px;
                }
                .container { max-width: 1400px; margin: 0 auto; }
                .header {
                  background: rgba(0,0,0,0.3);
                  padding: 20px;
                  border-radius: 15px;
                  text-align: center;
                  margin-bottom: 20px;
                }
                .score {
                  background: rgba(0,0,0,0.3);
                  padding: 30px;
                  border-radius: 15px;
                  text-align: center;
                  margin-bottom: 20px;
                }
                .score h1 { font-size: 5rem; margin-bottom: 10px; }
                .batsmen {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 20px;
                }
                .batsman {
                  background: rgba(0,0,0,0.3);
                  padding: 20px;
                  border-radius: 15px;
                }
                .message {
                  text-align: center;
                  padding: 40px;
                  font-size: 1.5rem;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 id="tournament">Cricket Scoreboard</h2>
                  <h3 id="teams">Loading...</h3>
                </div>
                <div class="score">
                  <h1 id="score">-/-</h1>
                  <p id="overs" style="font-size: 2rem; opacity: 0.8;"></p>
                </div>
                <div class="batsmen">
                  <div class="batsman">
                    <h3>Striker</h3>
                    <p id="striker">-</p>
                  </div>
                  <div class="batsman">
                    <h3>Non-Striker</h3>
                    <p id="nonStriker">-</p>
                  </div>
                </div>
              </div>

              <script>
                const socket = io('http://${host}');

                socket.on('connect', () => {
                  console.log('Connected to server');
                  fetchMatch();
                });

                socket.on('match:updated', (match) => {
                  updateScoreboard(match);
                });

                async function fetchMatch() {
                  try {
                    const res = await fetch('http://${host}/api/match/current');
                    const data = await res.json();
                    if (data.success && data.data) {
                      updateScoreboard(data.data);
                    } else {
                      document.querySelector('.container').innerHTML = '<div class="message">No active match</div>';
                    }
                  } catch (err) {
                    console.error('Failed to fetch match:', err);
                  }
                }

                function updateScoreboard(match) {
                  const innings = match.innings[match.currentInnings - 1];
                  const battingTeam = match.team1.id === innings.battingTeamId ? match.team1 : match.team2;
                  const bowlingTeam = match.team1.id === innings.bowlingTeamId ? match.team1 : match.team2;

                  document.getElementById('teams').textContent = \`\${battingTeam.name} vs \${bowlingTeam.name}\`;
                  document.getElementById('score').textContent = \`\${innings.runs}/\${innings.wickets}\`;

                  const totalBalls = innings.overs * 6 + innings.balls;
                  const overs = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
                  document.getElementById('overs').textContent = \`(\${overs.toFixed(1)} overs)\`;

                  const striker = innings.batsmen.find(b => b.isOnStrike && !b.isOut);
                  const nonStriker = innings.batsmen.find(b => !b.isOnStrike && !b.isOut);

                  document.getElementById('striker').textContent = striker ?
                    \`\${striker.playerName} - \${striker.runs}(\${striker.balls})\` : '-';
                  document.getElementById('nonStriker').textContent = nonStriker ?
                    \`\${nonStriker.playerName} - \${nonStriker.runs}(\${nonStriker.balls})\` : '-';
                }

                fetchMatch();
              </script>
            </body>
          </html>
        `);
      });

      // Dev notice page
      app.get('/dev-notice', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Development Mode Notice</title>
              <style>
                body {
                  margin: 0;
                  padding: 40px;
                  font-family: Arial, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  min-height: 100vh;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: rgba(0,0,0,0.3);
                  padding: 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                }
                h1 { margin-top: 0; }
                .instructions {
                  background: rgba(255,255,255,0.1);
                  padding: 20px;
                  border-radius: 10px;
                  margin: 20px 0;
                }
                .instructions ol {
                  text-align: left;
                  line-height: 1.8;
                }
                .note {
                  background: rgba(255,200,0,0.2);
                  padding: 15px;
                  border-radius: 10px;
                  border-left: 4px solid #ffc800;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🏏 Development Mode</h1>
                <p>To use the network scoreboard in development mode:</p>
                <div class="instructions">
                  <ol>
                    <li>Build the app first: <code>npm run build</code></li>
                    <li>Then run: <code>npm run electron:dev</code></li>
                    <li>Or use the "View Scoreboard" button in the main app</li>
                  </ol>
                </div>
                <div class="note">
                  <strong>Note:</strong> Network scoreboard works automatically in production builds (.exe files).
                  For development, the easiest way is to click "View Scoreboard" in the Electron app.
                </div>
              </div>
            </body>
          </html>
        `);
      });

      // Serve regular scoreboard (for use within Electron app)
      app.get('/scoreboard', (req, res) => {
        // For scoreboard accessed from within the app, redirect to Vite
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta http-equiv="refresh" content="0; url=http://localhost:5173/#/scoreboard">
              <title>Redirecting...</title>
            </head>
            <body>
              <p>Redirecting to scoreboard...</p>
              <script>window.location.href = 'http://localhost:5173/#/scoreboard';</script>
            </body>
          </html>
        `);
      });
    } else {
      // In production, serve the built files
      // Try multiple possible locations for dist folder in packaged app
      const possibleDistPaths = [
        path.join(__dirname, '../dist'),
        path.join(process.resourcesPath, 'app/dist'),
        path.join(process.resourcesPath, 'dist'),
        path.join(__dirname, '../../dist')
      ];

      let distPath = null;
      for (const testPath of possibleDistPaths) {
        if (fs.existsSync(testPath)) {
          distPath = testPath;
          console.log(`Found dist folder at: ${distPath}`);
          break;
        }
      }

      if (!distPath) {
        console.error('Could not find dist folder in any expected location!');
        console.error('Tried locations:', possibleDistPaths);
        distPath = path.join(__dirname, '../dist'); // Fallback
      }

      // Serve static files
      app.use(express.static(distPath));

      // Serve network-scoreboard and scoreboard routes
      app.get('/network-scoreboard', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('index.html not found at: ' + indexPath);
        }
      });

      app.get('/scoreboard', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('index.html not found at: ' + indexPath);
        }
      });

      // Fallback to index.html for client-side routing
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          const indexPath = path.join(distPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send('index.html not found at: ' + indexPath);
          }
        }
      });
    }

    // ==================== REAL-TIME EVENTS ====================

    // Start server
    httpServer.listen(port, '0.0.0.0', () => {
      const localIP = getLocalIP();
      console.log('='.repeat(60));
      console.log('🏏 Cricket Scoring App Server Started');
      console.log('='.repeat(60));
      console.log(`Mode:     ${isDevelopment ? 'Development' : 'Production'}`);
      console.log(`Local:    http://localhost:${port}`);
      console.log(`Network:  http://${localIP}:${port}`);
      console.log('='.repeat(60));
      console.log('Scoreboard URLs for network display:');
      console.log(`  http://${localIP}:${port}/scoreboard`);
      console.log(`  http://${localIP}:${port}/network-scoreboard`);
      console.log('='.repeat(60));
      console.log('API Endpoints:');
      console.log(`  http://${localIP}:${port}/api/health`);
      console.log(`  http://${localIP}:${port}/api/match/current`);
      console.log('='.repeat(60));

      resolve({
        port,
        localIP,
        broadcastMatchUpdate,
        broadcastShowAd,
        broadcastCloseAd
      });
    });

    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(error);
      }
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (io) {
      io.close();
      io = null;
    }
    if (httpServer) {
      httpServer.close(() => {
        console.log('Server stopped');
        httpServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function getServerInfo() {
  if (!httpServer || !httpServer.listening) {
    return null;
  }

  const address = httpServer.address();
  return {
    port: address.port,
    ip: getLocalIP(),
    localIP: getLocalIP(), // Keep for backward compatibility
    isRunning: true
  };
}

module.exports = {
  startServer,
  stopServer,
  getServerInfo
};
