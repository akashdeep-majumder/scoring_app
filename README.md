# Cricket Scoring Application

A professional cricket scoring system with live scoreboard display, designed for local deployment and HDMI connection to TVs.

## Features

- **Tournament Management**: Create tournaments with custom logos
- **Team Management**: Add teams with photos and manage player lineups
- **Live Scoring**: Real-time cricket scoring with comprehensive controls
  - Run scoring (0-6 runs)
  - Wicket tracking
  - Extras (Wide, No-ball, Bye, Leg-bye)
  - Ball-by-ball commentary
  - Batsman and bowler statistics
- **TV Scoreboard Display**: Full-screen scoreboard optimized for TV viewing
  - Live score updates
  - Current batsmen and bowler stats
  - Recent balls visualization
  - Required run rate calculations
- **Advertisement System**: Display local video ads during matches
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Local Data Persistence**: All data saved in browser localStorage

## Installation

### Prerequisites
- Node.js (v20.x or higher recommended)
- npm or yarn

### Setup Steps

1. **Navigate to the project directory**
   ```bash
   cd cricket-scoring-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Main application: `http://localhost:5173`
   - Scoreboard (for TV): `http://localhost:5173/scoreboard`

## Usage Guide

### 1. Create a Tournament
- Go to "Tournaments" from home screen
- Click "New Tournament"
- Enter tournament name and optionally upload logo
- Click "Create"

### 2. Add Teams

#### Option A: Manual Entry
- Click on a tournament
- Click "Add Team"
- Enter team name and optionally upload team photo
- Add players with their roles (Batsman, Bowler, All-Rounder, Wicket Keeper)

#### Option B: Import from Excel (Recommended for Multiple Teams)
- Click on a tournament
- Click "Template" to download a sample Excel file
- Fill in your teams and players in the Excel file
  - **Required columns**: Team Name, Player Name, Role, Jersey Number
  - **Valid roles**: batsman, bowler, all-rounder, wicket-keeper
- Click "Import Excel" and select your file
- All teams and players will be imported automatically

**Demo Excel Files Included:**
- `public/demo-sheets/demo_ipl_teams.xlsx` - Mumbai Indians vs Chennai Super Kings
- `public/demo-sheets/demo_local_teams.xlsx` - Rising Stars vs Thunder Strikers

### 3. Start a Match
- Once you have at least 2 teams, click "Start a Match"
- Select both teams
- Set number of overs
- Select toss winner and decision
- Click "Start Match"

### 4. Score the Match
- Select striker, non-striker, and bowler from team lineups
- Use the scoring buttons to record runs
- Click "OUT" to record wickets
- Use extra buttons for wides, no-balls, byes, and leg-byes
- The system automatically:
  - Rotates strike on odd runs
  - Calculates strike rates and economy rates
  - Tracks overs and balls
  - Manages innings transitions

### 5. Display Scoreboard on TV
- Click "View Scoreboard" button during scoring
- Opens in new window/tab
- Press F11 for fullscreen mode
- Connect laptop/PC to TV via HDMI
- Scoreboard updates in real-time as you score

## Adding Video Advertisements

### Development Mode

1. Place video files in a local accessible folder
2. Go to "Ads & Settings" from home screen
3. Click "Add Ad"
4. Enter ad name and full file path (e.g., `/Users/yourname/videos/ad.mp4`)
5. Set duration in seconds
6. Ads will auto-rotate every 2 minutes during matches

### Production Build

1. Place video files in `public` folder:
   ```
   cricket-scoring-app/
   ├── public/
   │   ├── ads/
   │   │   ├── ad1.mp4
   │   │   ├── ad2.mp4
   ```

2. Reference as `/ads/ad1.mp4` in the ad settings

### Supported Video Formats
- MP4 (recommended)
- WebM
- OGG

## Deployment Options

### Option 1: Local Network Deployment (Recommended for TV Display)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the built application**
   ```bash
   npm install -g serve
   serve -s dist -p 3000
   ```

3. **Access on local network**
   - Find your computer's IP address:
     - Windows: `ipconfig`
     - Mac/Linux: `ifconfig` or `ip addr show`
   - On any device on the same network, open: `http://YOUR_IP:3000`
   - For TV scoreboard: `http://YOUR_IP:3000/scoreboard`

### Option 2: Desktop Application (Electron)

To package as a standalone desktop app:

1. **Install electron dependencies**
   ```bash
   npm install -D electron electron-builder
   ```

2. **Create electron config** (electron.js in root)
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: true
       }
     });

     // In production, load the built files
     win.loadFile(path.join(__dirname, 'dist/index.html'));
   }

   app.whenReady().then(createWindow);
   ```

3. **Add to package.json**
   ```json
   {
     "main": "electron.js",
     "scripts": {
       "electron": "electron .",
       "electron-build": "electron-builder"
     },
     "build": {
       "appId": "com.cricket.scoring",
       "files": ["dist/**/*", "electron.js"]
     }
   }
   ```

### Option 3: Direct File Access

After building, you can:
1. Copy the entire `dist` folder to any computer
2. Open `dist/index.html` directly in a browser
3. Note: Some features may be limited due to browser security restrictions

## HDMI Connection to TV

### Setup
1. Connect your laptop/PC to TV via HDMI cable
2. Configure display settings:
   - **Windows**: Win + P → Select "Extend" or "Duplicate"
   - **Mac**: System Preferences → Displays → Arrangement
3. Open scoreboard URL in browser on TV display
4. Press F11 for fullscreen mode

### Dual Monitor Workflow
1. **Main Monitor**: Run scoring interface
2. **TV/Second Monitor**: Display scoreboard in fullscreen
3. Drag scoreboard window to TV display before going fullscreen

## Data Management

### Backup Data
Data is stored in browser localStorage. To backup:

1. Open browser console (F12)
2. Go to Application/Storage tab
3. Expand Local Storage
4. Copy the data or export using:
   ```javascript
   // Export all data
   const data = {
     tournaments: localStorage.getItem('tournaments'),
     currentMatch: localStorage.getItem('currentMatch'),
     ads: localStorage.getItem('ads')
   };
   console.log(JSON.stringify(data));
   ```

### Restore Data
```javascript
// Restore data
localStorage.setItem('tournaments', '[your data]');
localStorage.setItem('currentMatch', '[your data]');
localStorage.setItem('ads', '[your data]');
```

### Clear All Data
Go to Settings in browser and clear site data, or:
```javascript
localStorage.clear();
```

## Keyboard Shortcuts (Future Enhancement)

Future versions could include:
- Number keys 0-6 for quick run scoring
- W for wicket
- Space for dot ball
- Arrow keys for navigation

## Technical Details

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API
- **Data Persistence**: localStorage
- **Excel Handling**: SheetJS (xlsx) - Import/Export team lineups

### Browser Compatibility
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Any modern browser with localStorage support

## Troubleshooting

### Videos not playing
- Ensure video files are in supported format (MP4 recommended)
- Check file path is correct and accessible
- Try using absolute paths in development
- For production, place videos in public folder

### Data not persisting
- Check browser localStorage is enabled
- Don't use private/incognito mode
- Check browser storage quota hasn't been exceeded

### Scoreboard not updating
- Ensure both scoring and scoreboard pages are from same origin
- Refresh scoreboard page
- Check browser console for errors

### Performance issues
- Clear old match data
- Limit number of tournaments/matches
- Use optimized video files for ads

## Regenerating Demo Excel Files

If you need to regenerate the demo Excel files:

```bash
node generate-demo-sheets.js
```

This will recreate:
- `public/demo-sheets/demo_ipl_teams.xlsx`
- `public/demo-sheets/demo_local_teams.xlsx`

## Future Enhancements

Potential features for future versions:
- Export teams to Excel
- Cloud sync support
- Match highlights/replays
- Advanced statistics and analytics
- Player photos and profiles
- Multiple match formats (Test, ODI, T20)
- Manual scoreboard editing
- Print scorecards
- Export match data
- Undo/redo functionality
- Audio commentary
- Custom themes
- CSV file support

## Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Ensure all dependencies are installed
4. Try clearing cache and data

## License

This project is open source and available for personal and commercial use.

---

Built with ❤️ for cricket enthusiasts
