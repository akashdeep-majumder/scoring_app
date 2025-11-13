# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Start the Application
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Create Your First Tournament
1. Click **"Tournaments"** on the home screen
2. Click **"New Tournament"**
3. Enter tournament name (e.g., "Local Cricket League")
4. Optionally upload a tournament logo
5. Click **"Create"**

### 3. Add Teams

**Option A: Quick Import (Recommended)**
1. Click on your newly created tournament
2. Click **"Template"** to download sample Excel file
3. Open and fill in team details in Excel
4. Click **"Import Excel"** and upload your file
5. All teams imported instantly!

**Option B: Manual Entry**
1. Click on your newly created tournament
2. Click **"Add Team"**
3. Enter team name (e.g., "Team A")
4. Optionally upload team photo
5. Click **"Add Team"**
6. Add players to the team:
   - Click **"+ Add Player"** under the team
   - Enter player name
   - Select role (Batsman, Bowler, All-Rounder, Wicket Keeper)
   - Optionally add jersey number
   - Click **"Add"**
7. Repeat to add another team (you need minimum 2 teams)

**Try the Demo Files:**
- Find pre-made Excel files in `public/demo-sheets/`
- `demo_ipl_teams.xlsx` - IPL style teams
- `demo_local_teams.xlsx` - Local league teams

### 4. Start a Match
1. After adding 2+ teams, click **"Start a Match"**
2. Select Team 1 and Team 2
3. Set number of overs (default: 20)
4. Select toss winner
5. Choose toss decision (Bat First / Bowl First)
6. Click **"Start Match"**

### 5. Score the Match
1. **Select Players:**
   - Click on "Striker", "Non-Striker", and "Bowler" boxes
   - Choose players from the respective teams

2. **Score Runs:**
   - Click buttons 0-6 to record runs
   - Click "OUT" to record a wicket
   - Use "Wide", "No Ball", "Bye", "Leg Bye" for extras

3. **Automatic Features:**
   - Strike rotation on odd runs
   - Over completion tracking
   - Innings transition
   - Statistics calculation

### 6. Display on TV
1. Click **"View Scoreboard"** button
2. A new window/tab opens with the scoreboard
3. Press **F11** for fullscreen
4. Connect your laptop to TV via HDMI
5. Drag scoreboard to TV display
6. The scoreboard updates live as you score!

## For Local TV Setup

### One-Time Setup
1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Install serve globally:**
   ```bash
   npm install -g serve
   ```

3. **Start the server:**
   ```bash
   serve -s dist -p 3000
   ```

4. **Find your IP address:**
   - Windows: Run `ipconfig` in command prompt
   - Mac/Linux: Run `ifconfig` or `hostname -I`

5. **Access from any device on your network:**
   - Main app: `http://YOUR_IP:3000`
   - Scoreboard: `http://YOUR_IP:3000/scoreboard`

### Day-of-Match Workflow
1. Connect laptop to TV via HDMI
2. Open `http://localhost:3000/scoreboard` on TV display (fullscreen)
3. Open `http://localhost:3000` on main monitor for scoring
4. Create/resume match
5. Start scoring!

## Tips & Tricks

### For Better Experience
- Use a large monitor or TV for scoreboard display
- Keep the scoring interface on your laptop/tablet
- Test your setup before the actual match
- Keep power backup for your laptop during long matches

### Data Backup
Your data is auto-saved in browser localStorage. To backup:
1. Open browser console (F12)
2. Go to Application > Local Storage
3. Copy the values for future restore

### Troubleshooting
- **Scoreboard not updating?** Refresh the scoreboard page
- **Lost data?** Don't use incognito mode; data is stored locally
- **Video ads not playing?** Check file path and format (use MP4)

## Common Scenarios

### Adding Video Ads
1. Place video files in `public/ads/` folder
2. Go to "Ads & Settings" from home
3. Add ad with path `/ads/video.mp4`
4. Set duration
5. Enable the ad

### Resuming a Match
- Your current match is auto-saved
- Go to "Start Match" and you'll see the live match
- Or access via `/scoring` route directly

### Multiple Tournaments
- Create separate tournaments for different events
- Each tournament maintains its own teams and matches
- Switch between tournaments from the Tournaments page

## Need Help?
Check the full [README.md](README.md) for detailed documentation and deployment options.

---
Happy Scoring! 🏏
