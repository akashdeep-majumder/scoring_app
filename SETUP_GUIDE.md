# Cricket Scoring App - Setup & Usage Guide

## Understanding the Architecture

Your app has **TWO modes**:

### 1. Web Development Mode (Current - NO SERVER)
```bash
npm run dev
```
- Only runs the React frontend on `http://localhost:5173`
- **NO Express server**
- **NO Socket.IO**
- **Ad broadcasting will NOT work**
- Good for: UI development, testing basic features

### 2. Electron Mode (FULL FEATURES - WITH SERVER)
```bash
npm run electron:dev
```
- Runs the full Electron app
- **Starts Express server on port 3000**
- **Socket.IO enabled**
- **Ad broadcasting WORKS**
- **Single application** (all features work)

---

## How to Test Everything

### Step 1: Stop Web Dev Mode
If you have `npm run dev` running, **stop it** (Ctrl+C).

### Step 2: Start Electron Dev Mode
```bash
npm run electron:dev
```

This command does:
1. Starts Vite dev server (port 5173)
2. Waits for it to be ready
3. Starts Electron app
4. **Starts Express server (port 3000)** inside Electron
5. Opens DevTools automatically

### Step 3: Test Ad Broadcasting

1. **In the Electron window:**
   - Create a tournament
   - Add teams
   - Start a match
   - Go to scoring page

2. **Click "View Scoreboard"**
   - Opens scoreboard in a new window
   - This scoreboard connects to `localhost:3000` via Socket.IO

3. **Click "Show Ad"**
   - Ad is sent via HTTP to `localhost:3000/api/ad/show`
   - Server broadcasts via Socket.IO
   - Scoreboard window receives it and displays the ad

### Step 4: Test Network Scoreboard (Multiple Devices)

**IMPORTANT:** Network scoreboard requires a production build. In development mode (`npm run electron:dev`), the React app runs on Vite which is only accessible on localhost.

**Option A: Build and Test (Recommended for network testing)**
```bash
# 1. Build the app
npm run build

# 2. Start Electron in development mode (it will serve the built files)
npm run electron:dev
```

**Option B: Use "View Scoreboard" in Electron**
- Click the "View Scoreboard" button in the Electron app
- This opens a local scoreboard window that works in both dev and production

**To access from network devices:**

1. **After building**, find your network IP from console:
   - It will show: `Network: http://192.168.1.100:3000`

2. **On another device (phone/tablet/TV):**
   - Open browser
   - Go to: `http://192.168.1.100:3000/network-scoreboard`
   - You'll see the scoreboard
   - When you click "Show Ad" in the main app, it appears here too!

3. **If you can't connect from network devices:**
   - Make sure both devices are on the same WiFi network
   - Check your firewall settings:
     - **Mac:** System Preferences → Security & Privacy → Firewall
     - **Windows:** Control Panel → Windows Defender Firewall
   - Make sure "Block all incoming connections" is OFF
   - Add Electron/Node to allowed apps if needed

---

## Building for Production

### Build Single .exe File (Windows)
```bash
npm run electron:build:win
```

Output: `release/Cricket Scoring App.exe` (portable)

### Build for Mac
```bash
npm run electron:build:mac
```

Output: `release/Cricket Scoring App.dmg`

---

## Troubleshooting

### Issue: "Ad broadcasting not working"
**Solution:** Make sure you're running `npm run electron:dev`, NOT `npm run dev`

### Issue: "ERR_CONNECTION_REFUSED on localhost:3000"
**Solution:** The server only runs in Electron mode. Use `npm run electron:dev`

### Issue: "Port 5173 already in use"
**Solution:**
```bash
# Kill the process
lsof -i :5173 | grep node | awk '{print $2}' | xargs kill -9
# Then restart
npm run electron:dev
```

### Issue: "Can't connect from network device"
**Solutions:**
1. Make sure both devices are on the same WiFi network
2. Check firewall settings (allow port 3000)
3. Use the exact IP shown in Electron console

---

## File Structure

```
electron/
├── main.js          # Main Electron process (starts server)
├── server.js        # Express server with Socket.IO
├── database.js      # SQLite database
├── db-operations.js # Database operations
└── preload.js       # IPC bridge

src/
├── pages/
│   ├── Scoring.tsx         # Scoring page (broadcasts ads via HTTP)
│   ├── Scoreboard.tsx      # Local scoreboard (receives via Socket.IO)
│   └── NetworkScoreboard.tsx # Network scoreboard
└── contexts/
    └── AppContext.tsx      # React context

server/               # ❌ IGNORE THIS (standalone server - not used)
```

---

## How Everything Connects

```
┌─────────────────────────────────────────────────────────────┐
│                    Single .exe File                          │
│                                                               │
│  ┌──────────────────┐        ┌─────────────────────┐        │
│  │  Electron UI     │        │  Express Server      │        │
│  │  (Main Window)   │───────▶│  Port 3000          │        │
│  │                  │  HTTP  │  - REST API          │        │
│  │  - Scoring       │  POST  │  - Socket.IO         │        │
│  │  - Teams         │        │  - Match data        │        │
│  │  - Tournaments   │        │  - Ad broadcasting   │        │
│  └──────────────────┘        └─────────────────────┘        │
│         │                              │                     │
│         │ Opens new window             │ WebSocket          │
│         ▼                              ▼                     │
│  ┌──────────────────┐        ┌─────────────────────┐        │
│  │  Scoreboard      │◀───────│  Socket.IO          │        │
│  │  Window          │        │  io.emit('ad:show') │        │
│  └──────────────────┘        └─────────────────────┘        │
│                                       │                      │
└───────────────────────────────────────┼──────────────────────┘
                                        │ WebSocket over network
                                        │
                    ┌───────────────────▼───────────────────┐
                    │   Network Device                       │
                    │   (Phone/Tablet/TV)                   │
                    │                                        │
                    │   Browser: http://192.168.1.x:3000    │
                    │   /network-scoreboard                  │
                    │                                        │
                    │   - Receives live match updates        │
                    │   - Shows ads when broadcast           │
                    │   - Can switch between multiple matches│
                    └────────────────────────────────────────┘
```

---

## Important Commands

| Command | Purpose | Server Running? |
|---------|---------|-----------------|
| `npm run dev` | Web dev mode | ❌ NO |
| `npm run electron:dev` | Electron dev mode | ✅ YES (port 3000) |
| `npm run electron:build:win` | Build Windows .exe | ✅ YES (in built app) |

---

## Summary

✅ **For Development:** Use `npm run electron:dev`
✅ **For Testing Ad Broadcasting:** Use Electron mode
✅ **For Building Single .exe:** Use `npm run electron:build:win`
✅ **Server Port:** 3000 (only in Electron mode)
✅ **One .exe?** YES! Everything is embedded in the Electron app

❌ **Don't use:** `npm run dev` for testing ad features
❌ **Don't use:** Standalone `server/` folder (it's not needed)
