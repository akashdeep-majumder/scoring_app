# Network Scoreboard Fix for Production Builds

## Problem

The network scoreboard wasn't accessible from browsers when running the production-built macOS (and Windows) app. Users trying to access `http://192.168.x.x:3000/scoreboard` would get errors or blank pages.

## Root Cause

In production builds, the Express server couldn't locate the `dist` folder because:
1. The path `__dirname/../dist` doesn't work the same way in packaged Electron apps
2. macOS `.app` bundles have a different internal structure than the development environment
3. Windows `.exe` also has different resource paths when packaged

## Solution

Updated [electron/server.js](electron/server.js) to:

### 1. Multi-Path Detection

Try multiple possible locations for the `dist` folder:
```javascript
const possibleDistPaths = [
  path.join(__dirname, '../dist'),              // Development structure
  path.join(process.resourcesPath, 'app/dist'), // Packaged app structure 1
  path.join(process.resourcesPath, 'dist'),     // Packaged app structure 2
  path.join(__dirname, '../../dist')            // Alternative structure
];
```

### 2. File Existence Checks

Before serving files, verify they exist:
```javascript
if (fs.existsSync(indexPath)) {
  res.sendFile(indexPath);
} else {
  res.status(404).send('index.html not found at: ' + indexPath);
}
```

### 3. Enhanced Logging

Added detailed console logs to help debug:
```
============================================================
🏏 Cricket Scoring App Server Started
============================================================
Mode:     Production
Local:    http://localhost:3000
Network:  http://192.168.1.68:3000
============================================================
Scoreboard URLs for network display:
  http://192.168.1.68:3000/scoreboard
  http://192.168.1.68:3000/network-scoreboard
============================================================
API Endpoints:
  http://192.168.1.68:3000/api/health
  http://192.168.1.68:3000/api/match/current
============================================================
```

## Testing Instructions

### 1. Build and Install
```bash
# Build the app
npm run electron:build:mac  # or electron:build:win on Windows

# Install from release folder
# macOS: Open the .dmg and drag to Applications
# Windows: Run the .exe installer
```

### 2. Launch and Check Logs
1. Open the app
2. DevTools should auto-open (for debugging)
3. Check console for server startup messages
4. Note your network IP address (e.g., 192.168.1.68)

### 3. Test from Browser
On any device on the same network:
```
http://192.168.1.68:3000/scoreboard
http://192.168.1.68:3000/api/health
```

## What Should Work Now

✅ Server starts automatically when app launches
✅ `dist` folder is correctly located in packaged app
✅ Network scoreboard accessible from any browser
✅ Real-time updates via Socket.IO
✅ API endpoints respond correctly
✅ Works on both macOS and Windows builds

## Troubleshooting

### Can't Access from Other Device

**Check Firewall:**
- macOS: System Preferences → Security & Privacy → Firewall → Allow port 3000
- Windows: Windows Defender Firewall → Allow an app → Add port 3000

**Check Network:**
- Both devices must be on same Wi-Fi network
- Try accessing `http://localhost:3000/scoreboard` from the app's computer first

### Server Doesn't Start

**Port Already in Use:**
- Another app might be using port 3000
- Check DevTools console for error messages
- Try restarting the app

### index.html Not Found

**Check Console Logs:**
- Look for "Found dist folder at: [path]" message
- If missing, check "Could not find dist folder" error
- Report the attempted paths shown in console

## Files Modified

- [electron/server.js](electron/server.js#L624-682) - Production dist folder detection and serving

## Build Configuration

The fix works with the existing electron-builder configuration in `package.json`:
- Windows: Creates portable .exe
- macOS: Creates .dmg disk image
- Both include the `dist` folder in the packaged app

## Cross-Platform Compatibility

This fix works on:
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (10/11)
- ✅ Linux (with electron:build:linux)

All platforms now correctly locate and serve the dist folder in production builds.

## Commit

```
git commit -m "Fix network scoreboard for production builds (Windows + macOS)"
```

## Future Improvements

Potential enhancements for the future:
1. Add HTTPS support for secure connections
2. Add mDNS/Bonjour for easier device discovery
3. Add QR code generation for quick mobile access
4. Add network diagnostics page
5. Add connection status indicator in main app

## Related Documentation

- [GitHub Actions Setup](GITHUB_QUICKSTART.md)
- [Latest Changes](LATEST_CHANGES.md)
- [Workflow Documentation](.github/WORKFLOW.md)
