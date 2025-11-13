# Cricket Scoring App - Electron Desktop Application

## What Changed?

Your cricket scoring application has been converted from a web-based app to a **full-featured desktop application** with these major improvements:

### Key Upgrades

✅ **SQLite Database** - Data stored in a proper database file instead of browser localStorage
✅ **Desktop Application** - Runs as a native app (.exe, .app, .AppImage)
✅ **Data Persistence** - Your data is safe and won't be lost when clearing browser cache
✅ **Backup & Restore** - Built-in database backup and restore functionality
✅ **Unlimited Storage** - No more 5-10MB localStorage limits
✅ **Professional Deployment** - Install on any computer like a normal application
✅ **Offline-First** - Works completely offline with no internet required
✅ **Cross-Platform** - Build for Windows, macOS, and Linux

### Database Features

- All tournaments, teams, players, matches, and ads stored in SQLite
- Automatic data synchronization between scoring and scoreboard windows
- Ball-by-ball tracking with full history
- Advanced querying capabilities for future statistics features
- Database file located in app data folder (safe from accidental deletion)

---

## Quick Start

### Development Mode

To run the app in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server on port 5173
2. Launch the Electron desktop app
3. Enable hot-reload for instant updates

### Building the Desktop App

#### Build for All Platforms (Current OS)
```bash
npm run electron:build
```

#### Build for Specific Platforms

**Windows (.exe installer)**
```bash
npm run electron:build:win
```

**macOS (.dmg)**
```bash
npm run electron:build:mac
```

**Linux (AppImage + .deb)**
```bash
npm run electron:build:linux
```

### Installation Location

Built applications will be in the `release` folder:
- Windows: `release/Cricket Scoring App Setup 1.0.0.exe`
- macOS: `release/Cricket Scoring App-1.0.0.dmg`
- Linux: `release/cricket-scoring-app-1.0.0.AppImage`

---

## Architecture Overview

### File Structure

```
cricket-scoring-app/
├── electron/                    # Electron backend files
│   ├── main.js                  # Main process (app entry point)
│   ├── preload.js               # IPC bridge (security layer)
│   ├── database.js              # SQLite database setup
│   └── db-operations.js         # Database CRUD operations
│
├── src/                         # React frontend (unchanged)
│   ├── contexts/
│   │   └── AppContext.tsx       # Now uses IPC instead of localStorage
│   ├── utils/
│   │   └── api.ts               # API bridge (Electron/Web compatibility)
│   └── ...
│
├── dist/                        # Built React app
├── release/                     # Built Electron installers
└── package.json                 # Updated with Electron scripts
```

### How It Works

1. **Main Process (electron/main.js)**
   - Manages app lifecycle
   - Creates windows (main app + scoreboard)
   - Handles IPC communication
   - Manages SQLite database

2. **Renderer Process (React App)**
   - Your existing React UI
   - Calls Electron IPC via `window.electronAPI`
   - Falls back to localStorage in web mode

3. **Preload Script (electron/preload.js)**
   - Security bridge between frontend and backend
   - Exposes safe APIs to React

4. **Database Layer**
   - SQLite database in user data folder
   - Automatic schema creation
   - CRUD operations for all entities

---

## Database Schema

### Tables Created

- **tournaments** - Tournament information
- **teams** - Teams with tournament relationships
- **players** - Player details with team relationships
- **matches** - Match configurations and status
- **innings** - Innings data with runs, wickets, overs
- **batsman_stats** - Individual batsman statistics
- **bowler_stats** - Individual bowler statistics
- **balls** - Ball-by-ball commentary
- **ads** - Advertisement configurations

### Database Location

The database file is automatically created at:

- **Windows**: `C:\Users\[Username]\AppData\Roaming\cricket-scoring-app\cricket-scoring.db`
- **macOS**: `~/Library/Application Support/cricket-scoring-app/cricket-scoring.db`
- **Linux**: `~/.config/cricket-scoring-app/cricket-scoring.db`

---

## New Features

### Backup & Restore

Built-in UI for database backup and restore:

**To Backup:**
1. Go to Settings
2. Click "Backup Database"
3. Choose save location
4. Database file is copied with timestamp

**To Restore:**
1. Go to Settings
2. Click "Restore Database"
3. Select backup file
4. App reloads with restored data

### Dual Window Support

The app supports two windows simultaneously:
- **Main Window**: Scoring interface
- **Scoreboard Window**: TV display (auto-syncs via IPC)

Real-time updates between windows without polling!

---

## Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run electron:dev
```

### Debug

- Main Process: Console output in terminal
- Renderer Process: DevTools opened automatically
- Database Logs: Check terminal for SQL operations

### Environment Variables

```bash
NODE_ENV=development  # Enables DevTools, uses localhost:5173
NODE_ENV=production   # Uses built files from dist/
```

---

## Building & Distribution

### Build Configuration

Configuration in `package.json` under `"build"`:

```json
{
  "build": {
    "appId": "com.cricket.scoring",
    "productName": "Cricket Scoring App",
    "files": ["dist/**/*", "electron/**/*", "node_modules/**/*"],
    "win": { "target": ["nsis"] },
    "mac": { "target": ["dmg"] },
    "linux": { "target": ["AppImage", "deb"] }
  }
}
```

### Windows Installer Options

- Not one-click (user can choose install location)
- Creates desktop shortcut
- Creates start menu shortcut
- Uninstaller included

### Code Signing (Optional)

For production distribution, you may want to code-sign your app:

**Windows**: Get a code signing certificate
**macOS**: Use Apple Developer certificate
**Linux**: Not required

---

## Compatibility

### Backward Compatibility

The app works in **both modes**:

1. **Electron Mode** (Desktop)
   - Uses SQLite database
   - IPC communication
   - Full features

2. **Web Mode** (Browser)
   - Falls back to localStorage
   - Works as before
   - No Electron features

API layer in `src/utils/api.ts` automatically detects the environment.

### Migrating Existing Data

If you had data in localStorage (web version), you can:

1. Export from browser localStorage (F12 console):
```javascript
console.log(JSON.stringify({
  tournaments: localStorage.getItem('tournaments'),
  currentMatch: localStorage.getItem('currentMatch'),
  ads: localStorage.getItem('ads')
}));
```

2. Import into Electron app via database operations

(Future enhancement: Auto-migration UI)

---

## Troubleshooting

### App won't start

- Check if port 5173 is available
- Delete `node_modules` and run `npm install`
- Check terminal for error messages

### Database errors

- Delete database file and restart app (will recreate)
- Check write permissions in app data folder
- Review database logs in terminal

### Build errors

- Ensure `npm run build` completes successfully
- Check electron-builder logs in terminal
- Verify all dependencies are installed

### SQLite native module errors

```bash
# Rebuild for Electron
npm rebuild better-sqlite3
```

---

## Performance Tips

1. **Database is fast** - No need for aggressive caching
2. **IPC is synchronous** - Use sparingly in loops
3. **Batch updates** - Update match once per ball, not per stat
4. **Indexes created** - Queries are optimized

---

## Future Enhancements

With SQLite backend, these features are now easy to add:

- 📊 Historical match statistics
- 🏆 Tournament leaderboards
- 📈 Player performance graphs
- 📄 PDF scorecard export
- 📊 Excel export with rich data
- 🔍 Advanced search and filtering
- 👥 Multi-season support
- 📱 Optional cloud sync
- 🌐 Multi-device support

---

## Security

### IPC Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload script provides controlled API

### Database Security

- File stored in protected app data folder
- No SQL injection (prepared statements)
- Backup encryption (future enhancement)

---

## Support & Issues

If you encounter issues:

1. Check terminal logs for errors
2. Try deleting database and restarting
3. Rebuild native modules: `npm rebuild`
4. Check Electron version compatibility

---

## Command Reference

```bash
# Development
npm run dev              # Web version (Vite only)
npm run electron:dev     # Electron version with hot-reload

# Building
npm run build            # Build React app only
npm run electron:build   # Build Electron app (current OS)
npm run electron:build:win    # Build for Windows
npm run electron:build:mac    # Build for macOS
npm run electron:build:linux  # Build for Linux

# Other
npm run lint             # Lint code
npm run preview          # Preview built web version
```

---

## File Sizes

Approximate sizes:
- Windows installer: ~150-200 MB
- macOS DMG: ~150-200 MB
- Linux AppImage: ~150-200 MB

(Includes Chromium + Node.js + your app)

---

## License

Same as original project.

---

## Credits

Built with:
- Electron
- React 19
- TypeScript
- SQLite (better-sqlite3)
- Vite
- Tailwind CSS

---

**Enjoy your new professional desktop cricket scoring application! 🏏**
