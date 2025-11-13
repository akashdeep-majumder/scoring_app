# Quick Start Guide - Electron Cricket Scoring App

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher installed
- All dependencies already installed

---

## Development Mode

### Option 1: Run Electron App (Recommended)

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron desktop app
3. Enable hot-reload for development
4. Use SQLite database

**What to expect:**
- Main window opens automatically
- DevTools enabled for debugging
- Database created at: `~/Library/Application Support/cricket-scoring-app/cricket-scoring.db` (macOS)

---

### Option 2: Run Web Version

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

**What to expect:**
- Works in browser
- Uses localStorage instead of SQLite
- Same UI and features

---

## Building Desktop App

### Build for Your Platform

```bash
# For Windows
npm run electron:build:win

# For macOS
npm run electron:build:mac

# For Linux
npm run electron:build:linux
```

**Output location:** `release/` folder

**File sizes:**
- Windows: ~150-200 MB (.exe)
- macOS: ~150-200 MB (.dmg)
- Linux: ~150-200 MB (.AppImage)

---

## Quick Test Workflow

### 1. Create a Tournament
1. Launch app → Click "Tournaments"
2. Click "New Tournament"
3. Enter name (e.g., "IPL 2024")
4. Optionally upload logo
5. Click "Create"

### 2. Add Teams (Two Options)

#### Option A: Manual Entry
1. Click on your tournament
2. Click "Add Team"
3. Enter team name (e.g., "Mumbai Indians")
4. Add players one by one

#### Option B: Import Excel (Faster)
1. Click "Template" to download sample
2. Fill in teams and players in Excel
3. Click "Import Excel" and select file
4. Teams imported automatically!

**Demo files available:**
- `public/demo-sheets/demo_ipl_teams.xlsx`
- `public/demo-sheets/demo_local_teams.xlsx`

### 3. Start a Match
1. Go to tournament detail
2. Click "Start a Match" (need 2+ teams)
3. Select Team 1 and Team 2
4. Set overs (e.g., 20)
5. Select toss winner and decision
6. Click "Start Match"

### 4. Score the Match
1. Select striker, non-striker, and bowler
2. Click run buttons (0-6) to score
3. Click "OUT" for wickets
4. Use extras buttons (W, NB, B, LB)
5. Watch stats update automatically!

### 5. View Scoreboard on TV
1. Click "View Scoreboard" button
2. Opens in new window
3. Press F11 for fullscreen
4. Connect to TV via HDMI
5. Scoreboard updates in real-time!

---

## Database Location

### Electron Mode
Your database is stored at:

- **macOS**: `~/Library/Application Support/cricket-scoring-app/cricket-scoring.db`
- **Windows**: `C:\Users\[You]\AppData\Roaming\cricket-scoring-app\cricket-scoring.db`
- **Linux**: `~/.config/cricket-scoring-app/cricket-scoring.db`

### Web Mode
Data stored in browser localStorage (Application tab in DevTools)

---

## Backup & Restore

### In Electron App
1. Go to Settings
2. Click "Backup Database"
3. Choose save location
4. File saved with timestamp

**To Restore:**
1. Go to Settings
2. Click "Restore Database"
3. Select backup file
4. App reloads with restored data

---

## Troubleshooting

### App won't start
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
npm run electron:dev
```

### Port 5173 already in use
```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
```

### Database errors
1. Delete database file (location above)
2. Restart app (will recreate database)

### Build errors
```bash
# Make sure build succeeds first
npm run build

# Check for TypeScript errors
npm run lint

# Then build Electron
npm run electron:build
```

---

## Development Tips

### Enable DevTools
DevTools automatically open in development mode.

**To toggle:**
- macOS: `Cmd + Option + I`
- Windows/Linux: `Ctrl + Shift + I`

### Check Database
Use a SQLite viewer to inspect database:
- **DB Browser for SQLite** (free, cross-platform)
- **TablePlus** (macOS)
- **DBeaver** (cross-platform)

### Hot Reload
Changes to React code auto-reload.

**Note:** Changes to Electron files (main.js, preload.js) require restart.

---

## Project Structure

```
cricket-scoring-app/
├── electron/           # Electron backend
│   ├── main.js        # Main process
│   ├── preload.js     # IPC bridge
│   ├── database.js    # SQLite setup
│   └── db-operations.js  # CRUD operations
│
├── src/               # React frontend
│   ├── pages/         # Page components
│   ├── contexts/      # State management
│   ├── utils/         # Helper functions
│   └── types/         # TypeScript types
│
├── dist/              # Built React app
├── release/           # Built Electron installers
└── public/            # Static assets
```

---

## Commands Reference

```bash
# Development
npm run dev              # Web version (Vite only)
npm run electron:dev     # Electron version

# Building
npm run build            # Build React app
npm run electron:build   # Build Electron (current OS)
npm run electron:build:win    # Windows installer
npm run electron:build:mac    # macOS DMG
npm run electron:build:linux  # Linux AppImage

# Other
npm run lint             # Check for errors
npm run preview          # Preview built web version
```

---

## Features Summary

✅ Tournament management
✅ Team & player management
✅ Excel import/export
✅ Live match scoring
✅ Ball-by-ball tracking
✅ Auto-calculated statistics
✅ TV scoreboard display
✅ Advertisement rotation
✅ Database backup/restore
✅ Cross-platform support

---

## Next Steps

1. ✅ Run `npm run electron:dev`
2. ✅ Create a test tournament
3. ✅ Import demo teams
4. ✅ Start a match
5. ✅ Test scoring
6. ✅ View scoreboard
7. ✅ Build installer
8. ✅ Share with users!

---

## Documentation

- **ELECTRON_README.md** - Complete Electron documentation
- **MIGRATION_SUMMARY.md** - What changed from web to Electron
- **INTEGRATION_GUIDE.md** - Component integration details
- **COMPONENT_UPDATE_SUMMARY.md** - Async update details

---

## Support

If you encounter issues:
1. Check console for errors
2. Review documentation files
3. Delete database and try again
4. Reinstall dependencies

---

**Ready to go! 🏏**

Start the app and begin scoring your matches!

```bash
npm run electron:dev
```

---

*Enjoy your professional cricket scoring application!*
