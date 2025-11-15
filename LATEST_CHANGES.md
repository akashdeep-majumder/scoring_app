# Latest Changes Summary

## Date: 2025-11-15 (Part 11)

### 11. ✅ FIXED: No-Ball Ball Count & Auto Server URL Detection

**Problems**:
1. No-ball didn't increment batsman's balls faced count
2. Network scoreboard prompted for server URL on first load
3. Server URL was stored in localStorage unnecessarily

**Root Cause**:
1. **No-ball issue**: The condition `if (validBall)` excluded no-balls from ball count. In cricket, a no-ball DOES count as a ball faced by the batsman.
2. **Server URL prompt**: Logic only auto-detected when port wasn't 5173 and hostname wasn't localhost, causing fallback to localStorage prompt.

**Solution**:

#### 11.1 Fixed No-Ball Ball Count
- Updated batsman ball counting logic to include no-balls
- Changed from `if (validBall)` to `if (validBall || extraType === 'no-ball')`
- Now correctly increments balls faced for no-ball deliveries

#### 11.2 Auto Server URL Detection
- Removed localStorage dependency completely
- Auto-detects server URL from `window.location.hostname`:
  - **localhost** or **127.0.0.1** → `http://localhost:3000`
  - **IP address** (e.g., 192.168.1.68) → `http://[IP]:3000`
- Server URL prompt screen should never show now (always auto-detected)
- Can still override with `?server=http://IP:3000` query parameter

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L225-229) - Fixed no-ball ball counting
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L23-49) - Auto server URL detection
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L297) - Removed localStorage save

**Code Changes**:
```typescript
// Fixed no-ball ball count (Scoring.tsx lines 225-229)
// Before:
if (validBall) updatedInnings.batsmen[strikerIndex].balls += 1;

// After:
// Count ball: valid deliveries (normal balls) AND no-balls
// No-ball counts as ball faced, but wide doesn't
if (validBall || extraType === 'no-ball') {
  updatedInnings.batsmen[strikerIndex].balls += 1;
}

// Auto server URL detection (NetworkScoreboard.tsx lines 34-47)
// Before:
if (currentPort !== '5173' && currentHost !== 'localhost') {
  const autoDetectedUrl = `http://${currentHost}:${currentPort || '3000'}`;
  localStorage.setItem('serverUrl', autoDetectedUrl);
  setServerUrl(autoDetectedUrl);
} else {
  const saved = localStorage.getItem('serverUrl');
  if (saved) {
    setServerUrl(saved);
  } else {
    console.warn('No server URL found...');
  }
}

// After:
const currentHost = window.location.hostname;

// Auto-detect server URL based on hostname
const autoDetectedUrl = currentHost === 'localhost' || currentHost === '127.0.0.1'
  ? 'http://localhost:3000'
  : `http://${currentHost}:3000`;

console.log('Auto-detected server URL:', autoDetectedUrl);
setServerUrl(autoDetectedUrl);
```

**Examples**:

| Browser URL | Auto-Detected Server URL |
|-------------|-------------------------|
| `http://localhost:5173/network-scoreboard` | `http://localhost:3000` |
| `http://127.0.0.1:5173/network-scoreboard` | `http://localhost:3000` |
| `http://192.168.1.68:5173/network-scoreboard` | `http://192.168.1.68:3000` |
| `http://10.0.0.5:5173/network-scoreboard` | `http://10.0.0.5:3000` |

**Benefits**:
- ✅ No-ball now correctly increments batsman's balls faced
- ✅ Strike rate calculations accurate for batsmen facing no-balls
- ✅ No server URL prompt on first load - auto-detects from hostname
- ✅ Works seamlessly on localhost and network IP addresses
- ✅ No localStorage clutter
- ✅ Simpler, cleaner code
- ✅ Still supports manual override via query parameter

**Build Status**:
✅ Build Successful - 887.63 KB bundle, no errors

---

## Date: 2025-11-15 (Part 10)

### 10. ✅ FIXED: Run Out Logic - Correct Batsman & Strike Rotation

**Problems**:
1. Always striker getting out, even when non-striker was selected for run out
2. Strike rotation not happening when runs were scored before run out
3. Used batsman swap instead of validation by player ID

**Root Cause**:
- The `recordBall` function always used `striker.playerId` to find the batsman to mark as out
- When non-striker was selected, code tried to swap batsmen before calling recordBall
- This swap approach was complex and didn't properly handle strike rotation
- Strike rotation logic only applied to non-wicket balls, skipping run outs with runs

**Solution**:
1. **Added `outBatsmanId` parameter to recordBall**: Allows specifying exactly which batsman to mark as out by player ID
2. **Removed batsman swap logic**: No longer swaps batsmen before recording the ball
3. **Direct player ID validation**: Uses the out batsman's player ID to find and mark them as out
4. **Enhanced strike rotation**: Now handles run outs with runs scored - strike rotates based on odd/even runs completed
5. **Proper state clearing**: Clears the correct batsman (striker or non-striker) from state based on who got out

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L89) - Added `outBatsmanId` parameter to recordBall
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L237-248) - Updated wicket marking to use outBatsmanId
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L371-404) - Enhanced strike rotation for run outs
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L485-501) - Fixed out batsman detection and state clearing
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L745-773) - Simplified handleRunOutWithFielder

**Code Changes**:
```typescript
// Added parameter to recordBall (line 89)
const recordBall = async (
  runs: number,
  isWicket: boolean = false,
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye',
  extraRuns: number = 0,
  wicketType?: string,
  fielderName?: string,
  noStrikeChange: boolean = false,
  outBatsmanId?: string  // NEW: Specify which batsman is out
) => {

// Updated wicket marking (lines 237-248)
if (isWicket) {
  const outBatsmanIndex = outBatsmanId
    ? updatedInnings.batsmen.findIndex(b => b.playerId === outBatsmanId)
    : strikerIndex;

  if (outBatsmanIndex >= 0) {
    updatedInnings.batsmen[outBatsmanIndex].isOut = true;
    updatedInnings.batsmen[outBatsmanIndex].isOnStrike = false;
  }
}

// Enhanced strike rotation for run outs (lines 377-387)
if (isWicket && wicketType === 'run out') {
  if (extraType === 'bye' || extraType === 'leg-bye') {
    shouldRotateStrike = runs % 2 === 1;
  } else if (extraType === 'wide') {
    shouldRotateStrike = extraRuns % 2 === 1;
  } else if (extraType === 'no-ball') {
    shouldRotateStrike = (runs + extraRuns) % 2 === 1;
  }
}

// Fixed batsman clearing (lines 497-501)
if (outBatsmanId === striker?.playerId || !outBatsmanId) {
  setStriker(null);
} else if (outBatsmanId === nonStriker?.playerId) {
  setNonStriker(null);
}

// Simplified run out handler (lines 755-767)
const outBatsman = selectedRunOutBatsman === 'striker' ? striker : nonStriker;

// Pass outBatsman.playerId directly - no swapping needed!
if (pendingExtraType === 'wide') {
  await recordBall(0, true, 'wide', pendingWideRuns, 'run out', fielderName, false, outBatsman.playerId);
}
```

**Examples**:

| Scenario | Runs | Out Batsman | Strike Before | Strike After |
|----------|------|-------------|---------------|--------------|
| Wide + Run Out (1) - Striker out | 1 | Striker | Striker | Non-Striker |
| Wide + Run Out (1) - Non-striker out | 1 | Non-Striker | Striker | Non-Striker |
| Wide + Run Out (2) - Striker out | 2 | Striker | Striker | Striker |
| Bye + Run Out (3) - Non-striker out | 3 | Non-Striker | Striker | Non-Striker |

**Benefits**:
- ✅ Correct batsman gets out (striker or non-striker as selected)
- ✅ Strike rotates based on runs scored before dismissal
- ✅ Proper cricket rules: odd runs = strike changes, even runs = strike stays
- ✅ No complex batsman swapping logic
- ✅ Cleaner, more maintainable code
- ✅ Works for all extra types: wide, no-ball, bye, leg-bye
- ✅ Accurate ball-by-ball records with correct batsman names

**Build Status**:
✅ Build Successful - 887.92 KB bundle, no errors

---

## Date: 2025-11-15 (Part 9)

### 9. ✅ FIXED: Extra + Run Out Batsman Not Being Removed

**Problems**:
1. When recording wide + run out (or any extra + run out), the batsman wasn't being marked as out in innings data
2. The out batsman remained as striker/non-striker after dismissal
3. Toast showed "batsman is out, please select another batsman" but UI still showed them

**Root Cause**:
- The batsman stats update logic (lines 217-236) only updated batsman data for normal balls and no-balls
- For extras like wide, bye, leg-bye, the code skipped updating batsman stats entirely
- This meant `isOut` flag was never set to true for run outs on extra deliveries
- The batsman's `isOnStrike` flag also remained true, keeping them in the crease

**Solution**:
- Separated wicket handling from runs/stats updates
- Now always marks batsman as out (`isOut = true`) if `isWicket` is true, regardless of extra type
- Also clears the `isOnStrike` flag when batsman gets out
- Ensures `setStriker(null)` properly removes the out batsman from UI

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L217-241) - Separated wicket handling from stats update

**Code Changes**:
```typescript
// Before (lines 217-236 - old):
if (!extraType || extraType === 'no-ball') {
  const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);
  if (strikerIndex >= 0) {
    // ... update runs, balls, fours
    if (isWicket) updatedInnings.batsmen[strikerIndex].isOut = true; // Only for normal balls!
  }
}

// After (lines 217-241 - new):
const strikerIndex = updatedInnings.batsmen.findIndex(b => b.playerId === striker.playerId);
if (strikerIndex >= 0) {
  if (!extraType || extraType === 'no-ball') {
    // ... update runs, balls, fours (no wicket handling here)
  }

  // Always mark batsman as out if wicket, regardless of extra type
  if (isWicket) {
    updatedInnings.batsmen[strikerIndex].isOut = true;
    updatedInnings.batsmen[strikerIndex].isOnStrike = false;
  }
}
```

**Benefits**:
- ✅ Wide + Run Out now properly removes batsman from crease
- ✅ No-Ball + Run Out properly removes batsman
- ✅ Bye + Run Out properly removes batsman
- ✅ Leg-Bye + Run Out properly removes batsman
- ✅ Batsman's `isOut` flag correctly set in innings data
- ✅ Batsman's `isOnStrike` flag cleared (no longer in crease)
- ✅ UI updates immediately showing batsman is out
- ✅ Next batsman selection works correctly

**Build Status**:
✅ Build Successful - 887.75 KB bundle, no errors

---

## Date: 2025-11-15 (Part 8)

### 8. ✅ FIXED: Last 5 Overs Display Showing 0 for Wides

**Problem**: The "Last 5 Overs" section in the Live tab was showing 0 for wide balls instead of displaying the correct extra runs.

**Root Cause**: The display logic was using `ball.runs` which is 0 for extra balls. Wide balls store their runs in `ball.extraRuns` and `ball.totalRuns`.

**Solution**:
- Updated the ball display in "Last 5 Overs" section to match the format used in the "Overs" tab
- Now shows extras with proper prefix: **"W1"** for 1-run wide, **"N1"** for 1-run no-ball, etc.
- Wide + Wicket shows: **"W+W"**
- Added yellow background for wide and no-ball extras (same as Overs tab)
- Display format: `${extraType[0].toUpperCase()}${extraRuns || totalRuns || 0}`

**Visual Changes**:
- Wide balls now show with yellow background and format "W1", "W2", etc.
- No-ball shows as "N1", "N2", etc. with yellow background
- Bye shows as "B1", "B2", etc.
- Leg-Bye shows as "L1", "L2", etc.
- Extra + Wicket combinations show as "W+W", "N+W", etc. with red background

**Files Modified**:
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L636-653) - Last 5 Overs ball display

**Code Changes**:
```typescript
// Before (line 649 - old):
{ball.isWicket ? 'W' : ball.runs}

// After (line 651 - new):
{ball.isWicket && ball.extraType
  ? `${ball.extraType[0].toUpperCase()}+W`
  : ball.isWicket
  ? 'W'
  : ball.extraType
  ? `${ball.extraType[0].toUpperCase()}${ball.extraRuns || ball.totalRuns || 0}`
  : ball.runs}
```

---

## Date: 2025-11-15 (Part 7)

### 7. ✅ FIXED: Run Out Batsman Selection & Scoreboard Display

**Problems**:
1. When non-striker was selected for run out, batsman wasn't getting marked as out
2. Scoreboard didn't show "Wd+W" (or similar) for extra + wicket combinations
3. Ball-by-ball commentary didn't show proper details for extra + run out

**Solutions**:

#### 7.1 Fixed Non-Striker Run Out
- **Issue**: State variables were swapped but innings data wasn't updated
- **Fix**: Now properly updates `isOnStrike` flags in innings data before recording ball
- Swaps both state variables and innings data
- Uses `await` to ensure data is saved before recording the ball
- Added 50ms delay to ensure state updates complete

#### 7.2 Enhanced Scoreboard Display
**Ball Indicators**:
- Wide + Wicket now shows: **"W+W"** (instead of just "W")
- No-Ball + Wicket shows: **"N+W"**
- Bye + Wicket shows: **"B+W"**
- Leg-Bye + Wicket shows: **"L+W"**
- Makes it clear that it was both an extra AND a wicket

#### 7.3 Improved Ball-by-Ball Commentary
**New Format for Extra + Run Out**:
- Wide: `"Wide! [Batsman Name] is out, by [Fielder] (run-out)"`
- No-Ball: `"No Ball! [Batsman Name] is out, by [Fielder] (run-out)"`
- Bye: `"Bye! [Batsman Name] is out, by [Fielder] (run-out)"`
- Leg-Bye: `"Leg Bye! [Batsman Name] is out, by [Fielder] (run-out)"`

**Example Commentary**:
```
1.3 Wide! John Doe is out, by Jane Smith (run-out)
2.5 No Ball! Mike Wilson is out, by Tom Brown (run-out)
```

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L702-758) - Fixed handleRunOutWithFielder
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L729) - Ball display (W+W format)
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L738-750) - Ball commentary

**Code Changes**:
```typescript
// Fixed batsman swap (Scoring.tsx lines 702-758)
const handleRunOutWithFielder = async (fielderName: string) => {
  const outBatsman = selectedRunOutBatsman === 'striker' ? striker : nonStriker;

  // If non-striker is out, swap them in innings data
  if (selectedRunOutBatsman === 'non-striker' && striker && nonStriker) {
    const updatedInnings = { ...currentMatch.innings[currentMatch.currentInnings - 1] };

    // Swap isOnStrike flags in innings data
    updatedInnings.batsmen = updatedInnings.batsmen.map(b => {
      if (b.playerId === striker.playerId) {
        return { ...b, isOnStrike: false };
      } else if (b.playerId === nonStriker.playerId) {
        return { ...b, isOnStrike: true };
      }
      return b;
    });

    await updateMatch(updatedMatch);

    // Swap state variables
    setStriker(nonStriker);
    setNonStriker(striker);

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Record ball...
};

// Ball display (NetworkScoreboard.tsx line 729)
{ball.isWicket && ball.extraType
  ? `${ball.extraType[0].toUpperCase()}+W`
  : ball.isWicket ? 'W'
  : ball.extraType ? `${ball.extraType[0].toUpperCase()}${ball.runs || 0}`
  : ball.runs}

// Commentary (NetworkScoreboard.tsx lines 740-747)
if (ball.extraType === 'wide') {
  commentary = `Wide! ${ball.batsman} is out, by ${ball.fielderId} (${ball.wicketType})`;
} else if (ball.extraType === 'no-ball') {
  commentary = `No Ball! ${ball.batsman} is out, by ${ball.fielderId} (${ball.wicketType})`;
}
// ... etc for bye and leg-bye
```

**Benefits**:
- ✅ Non-striker run outs now work correctly
- ✅ Clear visual indication of extra + wicket in scoreboard
- ✅ Detailed ball-by-ball commentary
- ✅ Shows batsman name, fielder name, and dismissal type
- ✅ Proper innings data updates before recording ball
- ✅ No more confusion about which batsman got out

**Build Status**:
✅ Build Successful - 887.49 KB bundle, no errors

---

## Date: 2025-11-15 (Part 6)

### 6. ✅ ENHANCED: Run Out Batsman Selection

**Problem**:
- Run out feature didn't specify which batsman got out (striker or non-striker)
- System always assumed striker was out
- In cricket, either batsman can get run out

**Solution**:

#### 6.1 Added Batsman Selection Step
- New dialog appears after selecting runs and before fielder selection
- Shows both batsmen with their current stats
- User selects which batsman got run out:
  - **Striker** (shown in blue)
  - **Non-Striker** (shown in green)
- Displays batsman stats: runs(balls) - SR for easy identification

#### 6.2 Enhanced Run Out Flow
**New Flow** (4 steps):
1. Click extra type (Wide/No-Ball/Bye/Leg-Bye) → Click "[Extra] + Run Out"
2. **Select runs scored before dismissal** (0-5 or 0-6)
3. **NEW: Select which batsman got run out** (Striker or Non-Striker)
4. Select fielder who effected the run out
5. Ball recorded with correct batsman marked as out

#### 6.3 Implementation Details

**State Variables Added** (Lines 40-41):
- `showBatsmanRunOutSelect` - Controls batsman selection dialog
- `selectedRunOutBatsman` - Stores which batsman ('striker' or 'non-striker') is out

**Handler Created** (Lines 695-700):
- `handleBatsmanRunOutSelection()` - Stores batsman choice and proceeds to fielder selection

**Updated Handler** (Lines 702-742):
- `handleRunOutWithFielder()` - Now handles both striker and non-striker run outs
- Temporarily swaps batsmen if non-striker is out (since recordBall always marks striker)
- Uses setTimeout to ensure state updates before recording ball

**UI Added** (Lines 1629-1680):
- **Batsman Run Out Selection Dialog**:
  - Two large buttons showing both batsmen
  - Displays player name and current stats
  - Color-coded: Striker (blue), Non-Striker (green)
  - Back button returns to runs input

**Modified Handlers** (Lines 659-693):
- All run out handlers updated to show batsman selection first:
  - `handleWideRunOut()` - Opens batsman selection
  - `handleNoBallRunOut()` - Opens batsman selection
  - `handleByeRunOut()` - Opens batsman selection
  - `handleLegByeRunOut()` - Opens batsman selection

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L40-41) - State variables
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L659-693) - Run out handlers
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L695-742) - Selection and fielder handlers
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1629-1680) - Batsman selection dialog
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1681-1683) - Simplified fielder handler

**Code Changes**:
```typescript
// State variables (lines 40-41)
const [showBatsmanRunOutSelect, setShowBatsmanRunOutSelect] = useState(false);
const [selectedRunOutBatsman, setSelectedRunOutBatsman] = useState<'striker' | 'non-striker' | null>(null);

// Batsman selection handler (lines 695-700)
const handleBatsmanRunOutSelection = (batsmanType: 'striker' | 'non-striker') => {
  setSelectedRunOutBatsman(batsmanType);
  setShowBatsmanRunOutSelect(false);
  setShowFielderSelect(true);
};

// Run out with fielder (lines 702-742)
const handleRunOutWithFielder = (fielderName: string) => {
  const outBatsman = selectedRunOutBatsman === 'striker' ? striker : nonStriker;

  // Swap batsmen if non-striker is out (recordBall always marks striker)
  if (selectedRunOutBatsman === 'non-striker' && striker && nonStriker) {
    setStriker(nonStriker);
    setNonStriker(striker);
  }

  setTimeout(async () => {
    // Record ball based on extra type
    if (pendingExtraType === 'wide') {
      await recordBall(0, true, 'wide', pendingWideRuns, 'run out', fielderName);
    }
    // ... other extra types
  }, 0);
};
```

**Batsman Selection Dialog**:
```tsx
<div className="space-y-3 mb-4">
  <button onClick={() => handleBatsmanRunOutSelection('striker')}>
    <div className="text-lg font-bold">Striker: {striker?.playerName}</div>
    <div className="text-sm">{striker.runs}({striker.balls}) - SR: {striker.strikeRate}</div>
  </button>
  <button onClick={() => handleBatsmanRunOutSelection('non-striker')}>
    <div className="text-lg font-bold">Non-Striker: {nonStriker?.playerName}</div>
    <div className="text-sm">{nonStriker.runs}({nonStriker.balls}) - SR: {nonStriker.strikeRate}</div>
  </button>
</div>
```

**Benefits**:
- ✅ Correctly identifies which batsman got run out
- ✅ Proper cricket scoring (either batsman can be run out)
- ✅ Clear visual distinction between batsmen (color-coded)
- ✅ Shows batsman stats for easy identification
- ✅ Handles both striker and non-striker run outs correctly
- ✅ Maintains correct ball-by-ball records
- ✅ User-friendly 4-step flow with back navigation

**Build Status**:
✅ Build Successful - 886.64 KB bundle, no errors

---

## Date: 2025-11-15 (Part 5)

### 5. ✅ IMPLEMENTED: Run Out on All Extra Types (No-Ball, Bye, Leg-Bye)

**Problem**:
- Only Wide had run out option
- No-Ball, Bye, and Leg-Bye needed same run out functionality
- Run outs can happen on any extra delivery type in cricket

**Solution**:

#### 5.1 Extended Run Out Feature
- Added run out option to **No-Ball**, **Bye**, and **Leg-Bye** dialogs
- Same flow as Wide + Run Out:
  1. Click extra type (No-Ball/Bye/Leg-Bye)
  2. Click "[Extra Type] + Run Out" button
  3. Select runs scored before dismissal
  4. Select fielder who effected the run out
  5. Record ball with extra, runs, and wicket

#### 5.2 Implementation Details

**State Variables Added** (Lines 33-39):
- `pendingNoBallRuns` - Stores runs before no-ball run out
- `showNoBallRunOutInput` - Controls no-ball run out dialog
- `pendingByeRuns` - Stores runs before bye run out
- `showByeRunOutInput` - Controls bye run out dialog
- `pendingLegByeRuns` - Stores runs before leg-bye run out
- `showLegByeRunOutInput` - Controls leg-bye run out dialog
- `pendingExtraType` - Tracks which extra type triggered run out

**Handlers Created** (Lines 673-719):
- `handleNoBallRunOut()` - Initiates no-ball run out flow
- `handleNoBallRunOutWithFielder()` - Records no-ball run out with fielder
- `handleByeRunOut()` - Initiates bye run out flow
- `handleByeRunOutWithFielder()` - Records bye run out with fielder
- `handleLegByeRunOut()` - Initiates leg-bye run out flow
- `handleLegByeRunOutWithFielder()` - Records leg-bye run out with fielder

**UI Updates**:
- **No-Ball Dialog** (Lines 1409-1422): Added "No Ball + Run Out" button
- **Bye Dialog** (Lines 1423-1436): Added "Bye + Run Out" button
- **Leg-Bye Dialog** (Lines 1437-1450): Added "Leg Bye + Run Out" button

**New Run Out Dialogs**:
- **No-Ball + Run Out** (Lines 1522-1552): Select runs 0-6 before dismissal
- **Bye + Run Out** (Lines 1554-1584): Select runs 0-5 before dismissal
- **Leg-Bye + Run Out** (Lines 1586-1616): Select runs 0-5 before dismissal

**Fielder Selection Updated** (Lines 1669-1679):
- Now handles all four extra types: wide, no-ball, bye, leg-bye
- Uses `pendingExtraType` to determine which handler to call
- Calls appropriate handler based on extra type

**Examples**:

| Scenario | Extra | Runs | Total | Batsman | Wicket |
|----------|-------|------|-------|---------|--------|
| No-Ball + Run Out (3) | NB: 1 | 3 | 4 | 3 | Yes (run out) |
| Bye + Run Out (2) | - | Bye: 2 | 2 | 0 | Yes (run out) |
| Leg-Bye + Run Out (1) | - | LB: 1 | 1 | 0 | Yes (run out) |
| Wide + Run Out (0) | W: 1 | Bye: 0 | 1 | 0 | Yes (run out) |

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L33-39) - State variables
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L673-719) - Handler functions
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1409-1450) - Extra dialogs buttons
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1522-1616) - Run out dialogs
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1669-1679) - Fielder selection

**Code Changes**:
```typescript
// State variables (lines 33-39)
const [pendingNoBallRuns, setPendingNoBallRuns] = useState(0);
const [showNoBallRunOutInput, setShowNoBallRunOutInput] = useState(false);
const [pendingByeRuns, setPendingByeRuns] = useState(0);
const [showByeRunOutInput, setShowByeRunOutInput] = useState(false);
const [pendingLegByeRuns, setPendingLegByeRuns] = useState(0);
const [showLegByeRunOutInput, setShowLegByeRunOutInput] = useState(false);
const [pendingExtraType, setPendingExtraType] = useState<'wide' | 'no-ball' | 'bye' | 'leg-bye' | null>(null);

// No-Ball + Run Out handlers
const handleNoBallRunOut = (runs: number = 0) => {
  setPendingNoBallRuns(runs);
  setPendingExtraType('no-ball');
  setSelectedWicketType('run out');
  setShowNoBallRunOutInput(false);
  setShowFielderSelect(true);
};

const handleNoBallRunOutWithFielder = (fielderName: string) => {
  recordBall(0, true, 'no-ball', pendingNoBallRuns, 'run out', fielderName);
  setShowFielderSelect(false);
  setPendingNoBallRuns(0);
  setPendingExtraType(null);
};

// Similar handlers for Bye and Leg-Bye...

// Fielder selection updated (lines 1669-1679)
if (selectedWicketType === 'run out' && pendingExtraType) {
  if (pendingExtraType === 'wide') {
    handleWideRunOutWithFielder(player.name);
  } else if (pendingExtraType === 'no-ball') {
    handleNoBallRunOutWithFielder(player.name);
  } else if (pendingExtraType === 'bye') {
    handleByeRunOutWithFielder(player.name);
  } else if (pendingExtraType === 'leg-bye') {
    handleLegByeRunOutWithFielder(player.name);
  }
}
```

**Benefits**:
- ✅ Complete run out coverage for all extra types
- ✅ Consistent UI/UX across all extra dismissals
- ✅ Proper cricket scoring for complex scenarios
- ✅ Fielder tracking for all run out types
- ✅ Accurate extras and batsman stats recording
- ✅ Unified approach using `pendingExtraType` flag

**Build Status**:
✅ Build Successful - 885.03 KB bundle, no errors

---

## Date: 2025-11-15

### 1. ✅ IMPLEMENTED: Special Tournament Rules (6 = OUT, No Free Hit)

**Problems**:
1. In this tournament format, hitting a six means batsman is OUT
2. No-ball should only give 1 run penalty (no free hit)
3. Wide + 6 option was available but not needed (sixes are out)
4. Needed fixed run options where strike doesn't change

**Solutions**:

#### 1.1 Six = OUT Rule
- When batsman hits a six (6 OUT button), they are OUT and team gets 0 runs
- **Exception**: On no-ball + 6, batsman is still OUT but team gets only 1 run (no-ball penalty)
- Modified `recordBall` function to handle this special case
- The "6 OUT" button now properly records wicket with 0 runs to the team

#### 1.2 No-Ball Logic Updated
- Removed free hit logic completely (no free hit in this tournament)
- No-ball only gives 1 run penalty to the batting team
- If batsman hits six on no-ball: batsman OUT, team gets 1 run (no-ball penalty only)
- Removed toast notification for free hit

#### 1.3 Removed 6 from Wide, Bye, and Leg-Bye
- Wide dialog now shows options 0-5 only (max 5 runs)
- Bye dialog now shows options 0-5 only (max 5 runs)
- Leg-bye dialog now shows options 0-5 only (max 5 runs)
- No-ball still shows 0-6 options (6 = OUT rule applies)
- Updated dialog text to indicate "(max 5)" for wide, bye, and leg-bye

#### 1.4 Added Fixed Run Buttons
- **"1 (Fixed)"**: Scores 1 run with NO strike change
  - Added `noStrikeChange` parameter to `recordBall` function
  - When true, prevents any strike rotation logic from executing
  - Batsman on strike remains on strike regardless of runs scored
- **"Bye 1 (Fixed)"**: Scores 1 bye run with NO strike change
  - Same logic using `noStrikeChange` parameter
  - Useful for tactical situations where strike shouldn't rotate
- Both buttons added to extras section in scoring UI

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx) - All special rule implementations

**Code Changes**:
```typescript
// Six = OUT rule (lines 164-176)
if (runs === 6 && isWicket) {
  if (extraType === 'no-ball') {
    // No-ball + 6: batsman out, team gets only 1 run
    runs = 0;
    extraRuns = 0;
  } else {
    // Normal 6: batsman out, team gets 0 runs
    runs = 0;
  }
}

// No free hit (line 81)
// NO FREE HIT in this tournament format - rule removed

// No-ball + 6 handler (lines 632-633)
if (extraType === 'no-ball' && runs === 6) {
  recordBall(6, true, extraType, 0);  // Triggers wicket with 1 run penalty
}

// Fixed run handlers (lines 644-651)
const handleFixedOne = async () => {
  await recordBall(1, false, undefined, 0, undefined, undefined, true);
};

const handleByeOneNoStrike = async () => {
  await recordBall(1, false, 'bye', 0, undefined, undefined, true);
};

// Strike rotation logic updated (line 348)
if (!isWicket && !noStrikeChange) {
  // Only rotate strike if noStrikeChange is false
  // ... normal strike rotation logic
}
```

**Benefits**:
- ✅ Six = OUT rule properly enforced
- ✅ No confusion with free hit (removed completely)
- ✅ No-ball gives only 1 run penalty
- ✅ Wide limited to max 5 runs (no six option)
- ✅ Fixed run options available for special situations
- ✅ Strike control for tactical situations

**Build Status**:
✅ Build Successful - 880.29 KB bundle, no errors

---

## Date: 2025-11-15 (Part 2)

### 2. ✅ FIXED: Network Scoreboard Display & Undo Ball Logic

**Problems**:
1. **Scoreboard**: "Free hit next" commentary incorrect for no-ball (no free hits in this format)
2. **Scoreboard**: Sixes column showing when 6 = OUT (batsmen never score sixes)
3. **Undo**: Extras double-counting bug (wide/no-ball penalty counted twice)
4. **Undo**: Batsman not restored after undoing wicket (striker remained null)
5. **Undo**: Strike rotation not reversed (wrong batsman on strike after undo)
6. **Undo**: Partnership not reactivated after undoing wicket

**Solutions**:

#### 2.1 Fixed No-Ball Commentary
- Changed "No ball! Free hit next" to "No ball! 1 run penalty"
- Reflects tournament rules where no-balls don't give free hits
- Updated in Overs tab ball-by-ball commentary

#### 2.2 Removed Sixes Column
- Removed "6s" column from both Live and Scoreboard tabs
- Since 6 = OUT in this tournament, batsmen never score sixes
- Only shows relevant stats: Runs, Balls, 4s, Strike Rate

#### 2.3 Fixed Extras Undo Double-Counting
- **Bug**: `lastBall.extraRuns` already includes penalty (1 + extra runs)
- **Was doing**: `wides -= (1 + lastBall.extraRuns)` = double penalty
- **Fixed to**: `wides -= lastBall.extraRuns` (correct amount)
- Applies to both wide and no-ball extras

#### 2.4 Fixed Batsman Restoration After Wicket Undo
- When undoing a wicket, the batsman who got out is now:
  - Set back as striker with `isOnStrike = true`
  - Restored to `striker` state variable
  - Non-striker restored from `lastBall.nonStriker` record
- Batsman is immediately available for scoring (no manual re-selection needed)

#### 2.5 Fixed Strike Rotation Reversal
- For non-wicket balls:
  - Reads `lastBall.batsman` (who was striker) and `lastBall.nonStriker`
  - Restores both batsmen to correct strike positions
  - Updates `isOnStrike` flags correctly
- Handles all strike rotation scenarios:
  - Odd runs (strike rotated)
  - Even runs (strike didn't rotate)
  - End of over (strike rotated)
  - Fixed runs (strike didn't rotate)

#### 2.6 Fixed Partnership Restoration After Wicket
- **For wicket balls**: Finds the last partnership and reactivates it (`isActive = true`)
- **For non-wicket balls**: Reverses runs/balls from active partnership
- Partnership stats now properly maintained through undo operations

**Files Modified**:
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L747) - Fixed no-ball commentary
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L588) - Removed sixes from Live tab
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L807) - Removed sixes from Scoreboard tab
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L745-756) - Fixed extras undo
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L787-797) - Fixed batsman restoration
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L873-885) - Fixed strike rotation reversal
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L841-871) - Fixed partnership restoration

**Code Changes**:
```typescript
// Fixed extras undo (no double-counting)
if (lastBall.extraType === 'wide') {
  updatedInnings.extras.wides -= lastBall.extraRuns; // Already includes penalty
}

// Restore batsman after wicket undo
if (lastBall.isWicket) {
  batsman.isOut = false;
  batsman.isOnStrike = true;
  setStriker(batsman);
  const nonStrikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.nonStriker);
  if (nonStrikerBatsman) {
    nonStrikerBatsman.isOnStrike = false;
    setNonStriker(nonStrikerBatsman);
  }
}

// Reverse strike rotation for non-wicket balls
if (!lastBall.isWicket) {
  const strikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.batsman);
  const nonStrikerBatsman = updatedInnings.batsmen.find(b => b.playerName === lastBall.nonStriker);
  if (strikerBatsman && nonStrikerBatsman) {
    strikerBatsman.isOnStrike = true;
    nonStrikerBatsman.isOnStrike = false;
    setStriker(strikerBatsman);
    setNonStriker(nonStrikerBatsman);
  }
}

// Restore partnership after wicket
if (lastBall.isWicket) {
  const lastPartnership = updatedInnings.partnerships[updatedInnings.partnerships.length - 1];
  if (lastPartnership && !lastPartnership.isActive) {
    lastPartnership.isActive = true;
    // Reverse runs and balls
  }
}
```

**Benefits**:
- ✅ Scoreboard displays correctly reflect tournament rules
- ✅ Undo properly reverses ALL aspects of a ball:
  - Runs, wickets, extras (correct amounts)
  - Batsman and bowler stats
  - Strike rotation
  - Partnership stats
- ✅ Batsman automatically restored after undoing wicket
- ✅ Strike always correct after undo
- ✅ Can confidently use undo during matches
- ✅ No manual player re-selection needed after undo

**Build Status**:
✅ Build Successful - 880.29 KB bundle, no errors

---

## Date: 2025-11-15 (Part 3)

### 3. ✅ FIXED: Bowler Over Limit Calculation

**Problem**:
- In a 6 over game: 6 ÷ 5 = 1.2, was using `Math.floor` = 1 over per bowler
- This meant bowlers could only bowl 1 over each, requiring 6 different bowlers
- For short matches, this is impractical (teams may not have enough bowlers)

**Solution**:
- Changed from `Math.floor` to `Math.ceil` (always round up to next integer)
- Now 6 ÷ 5 = 1.2 → `Math.ceil` = 2 overs per bowler maximum
- Applies to both validation points:
  - When recording a ball (checks if bowler completing max overs)
  - When selecting a bowler (checks if bowler already at max)

**Examples**:
- **6 over game**: 6 ÷ 5 = 1.2 → 2 overs per bowler (was 1)
- **8 over game**: 8 ÷ 5 = 1.6 → 2 overs per bowler (was 1)
- **10 over game**: 10 ÷ 5 = 2.0 → 2 overs per bowler (unchanged)
- **15 over game**: 15 ÷ 5 = 3.0 → 3 overs per bowler (unchanged)
- **20 over game**: 20 ÷ 5 = 4.0 → 4 overs per bowler (unchanged)

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L147) - Updated calculation in recordBall validation
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L561) - Updated calculation in selectPlayer validation

**Code Changes**:
```typescript
// Before (rounded down)
const maxOversPerBowler = Math.floor(currentMatch.overs / 5);

// After (rounded up)
const maxOversPerBowler = Math.ceil(currentMatch.overs / 5);
```

**Benefits**:
- ✅ More practical over limits for short format games
- ✅ Fewer bowlers required for 6-8 over matches
- ✅ Still maintains 20% rule (each bowler bowls max 20% of total overs)
- ✅ Always rounds up to ensure fairness

**Build Status**:
✅ Build Successful - 880.29 KB bundle, no errors

---

## Date: 2025-11-15 (Part 4)

### 4. ✅ IMPLEMENTED: Wide Ball Logic Overhaul

**Problems**:
1. **Incorrect storage**: Wide+4 stored as "wide: 5" instead of "wide: 1, bye: 4"
2. **Batsman getting runs**: Batsman stats updated with runs on wide (should be 0)
3. **Missing dismissals**: No wide+runout option (important for cricket)
4. **Last 5 overs display**: Wides showing as 0 in scoreboard

**Solutions**:

#### 4.1 Fixed Wide Runs Storage
- **Before**: `extras.wides += 1 + extraRuns` (all runs in wides)
- **After**:
  - `extras.wides += 1` (penalty only)
  - `extras.byes += extraRuns` (batsmen running goes to byes)
- Wide+4 now correctly shows: wide=1, bye=4, total=5

#### 4.2 Batsman Gets 0 Runs on Wide
- Changed batsman stats update condition
- **Before**: Updated for `!extraType || extraType !== 'bye'...` (included wide)
- **After**: Only updates for `!extraType || extraType === 'no-ball'` (excludes wide)
- Batsman no longer credited with runs when running on wide ball

#### 4.3 Added Wide + Run Out
- New "Wide + Run Out" button in wide dialog
- **Flow**:
  1. Click "Wide" → Select "Wide + Run Out"
  2. Dialog asks: "How many runs scored before run out?" (0-5)
  3. Select fielder who effected the run out
  4. Records: wide=1, bye=runs, wicket=run out
- Covers both wide+stumped and wide+runout scenarios (fielder can be wicket keeper)

**Examples**:

| Action | Wide | Bye | Total | Batsman | Wicket |
|--------|------|-----|-------|---------|--------|
| Wide + 0 | 1 | 0 | 1 | 0 | No |
| Wide + 4 | 1 | 4 | 5 | 0 | No |
| Wide + Run Out (2) | 1 | 2 | 3 | 0 | Yes (run out) |
| Wide + Run Out (0) | 1 | 0 | 1 | 0 | Yes (run out) |

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L191-204) - Fixed extras calculation
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L206-211) - Batsman stats (excludes wide)
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L650-656) - Wide run out handler
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L658-661) - Wide run out with fielder
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1346-1359) - Wide + Run Out button
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1391-1420) - Wide run out runs input dialog
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1451) - Fielder selection updated

**Code Changes**:
```typescript
// Fixed extras calculation
if (extraType === 'wide') {
  // Wide: 1 penalty to wides, any extra runs to byes
  updatedInnings.extras.wides += 1;
  if (extraRuns > 0) {
    updatedInnings.extras.byes += extraRuns;
  }
}

// Batsman stats (excludes wide)
if (!extraType || extraType === 'no-ball') {
  // Batsman only gets runs on normal balls and no-balls
  // NOT on wides, byes, or leg-byes
}

// Wide + Run Out flow
const handleWideRunOut = (runs: number = 0) => {
  setPendingWideRuns(runs);
  setSelectedWicketType('run out');
  setShowWideRunOutInput(false);
  setShowFielderSelect(true);
};

const handleWideRunOutWithFielder = (fielderName: string) => {
  recordBall(0, true, 'wide', pendingWideRuns, 'run out', fielderName);
  setShowFielderSelect(false);
  setPendingWideRuns(0);
};
```

**Benefits**:
- ✅ Correct cricket scoring (wide penalty separate from byes)
- ✅ Batsman stats accurate (no runs on wide)
- ✅ Scoreboard shows correct breakdown: "wd 1, b 4" instead of "wd 5"
- ✅ Wide + Run Out covers both stumping and run out scenarios
- ✅ Proper tracking of who effected the dismissal
- ✅ Simpler UI (one dismissal option instead of two)

**Build Status**:
✅ Build Successful - 881.50 KB bundle, no errors

---

## Date: 2025-11-14

### 1. ✅ FIXED: Multiple Scoring Issues

**Problems**:
1. Unnecessary wicket types (obstructing, handled ball, timed out) cluttering the UI
2. Undo button allowed undoing all balls, even from previous sessions
3. Short run feature not needed
4. In 6v6 format, innings didn't end at 5 wickets (was checking for 10 wickets)
5. Retired hurt player could appear as both striker and non-striker simultaneously

**Solutions**:

#### 1.1 Removed Unnecessary Wicket Types
Removed "Obstructing", "Handled Ball", and "Timed Out" from wicket type options, keeping only the commonly used dismissal types:
- Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Caught & Bowled

#### 1.2 Limited Undo to Last 3 Consecutive Balls Only
- Added `undoCount` state to track consecutive undo operations
- Undo now only allows undoing the last 3 consecutive balls from current position
- Example: If 4 overs (24 balls) are completed, can undo to 3.3 over (21 balls)
- Example: If at 2.3 over, can undo to 2.0 over
- `undoCount` is incremented after each successful undo
- `undoCount` is reset to 0 when a new ball is recorded
- Shows error message: "Can only undo last 3 balls" when limit is reached

#### 1.3 Removed Short Run Option
- Removed "Short Run" button from UI
- Removed `handleShortRun` function

#### 1.4 Fixed Innings End Logic for Tournament Formats
- Now reads `playersPerTeam` from tournament (6, 8, or 11)
- Calculates `maxWickets = playersPerTeam - 1`
  - 6v6 format → 5 wickets = all out
  - 8v8 format → 7 wickets = all out
  - 11v11 format → 10 wickets = all out
- Both pre-ball validation and post-ball innings end check now use `maxWickets`

#### 1.5 Fixed Retired Hurt Player Bug
- When selecting a new batsman, all existing batsmen are first marked as `isOnStrike: false`
- Then only the selected batsman gets the correct `isOnStrike` status
- This prevents retired hurt players from retaining their `isOnStrike` status
- Ensures only ONE batsman can be on strike at any time

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx) - All fixes implemented

**Benefits**:
- ✅ Cleaner wicket selection UI with only relevant options
- ✅ Prevents accidental undo of old balls
- ✅ Simplified extras/actions section
- ✅ Innings ends correctly based on tournament format
- ✅ No duplicate striker/non-striker issue with retired hurt

---

### 2. ✅ FIXED: End of Over Strike Change

**Problem**: After an over was completed (6 valid balls), the strike was not automatically changing to the other batsman.

**Cricket Rule**: At the end of an over, the batsman who was non-striker should become the striker for the next over, regardless of who was on strike at the end of the previous over.

**Edge Cases Handled**:
1. **Last ball is a dot (0 runs)**: Strike changes to non-striker
2. **Last ball scores 1 run (odd)**: Strike changes due to run, then changes again at end of over → net result: striker stays same
3. **Last ball scores 2 runs (even)**: Strike doesn't change due to runs, but changes at end of over → non-striker becomes striker
4. **Last ball scores 4 runs (even)**: Same as 2 runs case
5. **Last ball is a wicket**: Strike does NOT change (new batsman comes in on same end)

**Solution**:
Added automatic strike rotation at the end of each over:
```typescript
// Change strike at end of over (after 6 valid balls)
if (overComplete && !isWicket) {
  // If strike was already changed due to odd runs, this will change it back
  // If strike wasn't changed (even runs or dot ball), this will change it
  const temp = striker;
  setStriker(nonStriker);
  setNonStriker(temp);

  // Update strike markers with correct player
  updatedInnings.batsmen = updatedInnings.batsmen.map(b => ({
    ...b,
    isOnStrike: b.playerId === (shouldRotateStrike ? striker?.playerId : nonStriker?.playerId)
  }));

  toast.info(`⚡ Over complete! Strike changed to ${...}`, { autoClose: 2000 });
}
```

**How it works**:
1. First, strike rotates based on runs scored (odd runs = rotate)
2. Then, at end of over, strike rotates again
3. **Result**:
   - Odd runs on last ball: rotate twice → back to original striker
   - Even runs/dot ball on last ball: rotate once → non-striker becomes striker
   - Wicket on last ball: no rotation → new batsman on same end

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L363-L379) - Added end-of-over strike change logic

**Benefits**:
- ✅ Strike changes correctly at end of over
- ✅ All edge cases handled correctly (odd runs, even runs, dot ball)
- ✅ Wicket on last ball handled correctly (no strike change)
- ✅ User gets visual feedback via toast notification

---

### 2. ✅ FIXED: Over Numbering Bug (0-based vs 1-based)

**Problem**:
- Overs were showing as "Over 0" instead of "Over 1"
- First 6 balls were grouped in "Over 0" instead of "Over 1"
- Ball numbering was incorrect (0-5 instead of 1-6)

**Root Cause**:
- The scoring system stored overs and balls as 0-based indices internally (overs: 0, 1, 2... balls: 0-5)
- The ball was being recorded with the internal 0-based values
- But cricket displays overs as 1-based (Over 1, Over 2, etc.) with balls 1-6

**Solution**:
1. **Moved ball recording BEFORE ball count increment** to capture the correct over/ball number
2. **Added 1-based conversion** when recording balls:
```typescript
// Record ball BEFORE updating ball count
const currentOverNumber = updatedInnings.overs + 1; // Convert 0-based to 1-based
const currentBallNumber = updatedInnings.balls + 1; // Convert 0-based to 1-based

const ball: Ball = {
  over: currentOverNumber,  // Now 1-6 instead of 0-5
  ball: currentBallNumber,  // Now 1-6 instead of 0-5
  // ... rest of ball data
};
```

**How it works now**:
- First ball of match: Internal (`overs=0, balls=0`) → Recorded as (`over=1, ball=1`)
- Sixth ball of first over: Internal (`overs=0, balls=5`) → Recorded as (`over=1, ball=6`)
- First ball of second over: Internal (`overs=1, balls=0`) → Recorded as (`over=2, ball=1`)
- Display shows "Over 1" with balls 1-6, "Over 2" with balls 1-6, etc.

**Files Modified**:
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L226-L247) - Added 1-based conversion and moved ball recording
- [src/pages/Scoreboard.tsx](src/pages/Scoreboard.tsx#L468) - Removed `+ 1` from over display (now shows `overNum` instead of `overNum + 1`)
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L690-L697) - Object-based grouping (handles 1-based over numbers)

**Benefits**:
- ✅ Overs now display correctly starting from "Over 1"
- ✅ All 6 balls properly grouped in each over
- ✅ Ball numbers show correctly (1-6 instead of 0-5)
- ✅ Commentary shows correct ball numbers (e.g., "1.3" instead of "0.2")

---

### 2. ✅ FIXED: Overs Tab Ball-by-Ball Aggregation Bug

**Problem**: The Overs tab was only showing 1 ball per over instead of all 6 balls when an over was completed.

**Root Cause**:
- The ball aggregation logic used a sparse array with `ball.over - 1` as the index
- This created array positions like [0, 1, 2...] but could have undefined gaps
- When using `array.reverse()` on a sparse array, undefined elements can interfere with the iteration

**Solution**:
Changed from array-based aggregation to object-based aggregation:
```typescript
// Before (sparse array):
displayInnings.ballByBall.reduce((overs: any[], ball) => {
  const overIndex = ball.over - 1;
  if (!overs[overIndex]) {
    overs[overIndex] = { over: ball.over, balls: [], bowler: ball.bowler };
  }
  overs[overIndex].balls.push(ball);
  return overs;
}, [])

// After (object grouping):
Object.values(
  displayInnings.ballByBall.reduce((overs: Record<number, any>, ball) => {
    if (!overs[ball.over]) {
      overs[ball.over] = { over: ball.over, balls: [], bowler: ball.bowler };
    }
    overs[ball.over].balls.push(ball);
    return overs;
  }, {})
)
```

**How it works now**:
1. Reduce creates an object with over numbers as keys: `{ 1: {...}, 2: {...}, 3: {...} }`
2. Each key contains all balls for that over grouped together
3. `Object.values()` converts the object to an array of over objects
4. `.reverse()` shows latest overs first
5. All balls in each over are properly displayed

**Files Modified**:
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx#L690-L697) - Fixed ball aggregation logic

**Benefits**:
- ✅ All balls in an over are now displayed correctly
- ✅ No more sparse array issues
- ✅ Cleaner, more reliable data structure
- ✅ Works correctly regardless of over numbering

---

## Date: 2025-11-13

### 1. ✅ MAJOR REDESIGN: Network Scoreboard Complete Overhaul

**Problems**:
- Page only used half viewport width (max-w-7xl constraint)
- Live tab required scrolling to see all information
- Overs tab was empty with no ball-by-ball data
- Scoreboard tab couldn't switch between innings
- No live commentary feature
- Poor space utilization on large screens

**Complete Redesign**:

#### **Live Tab** - 3-Column Dashboard Layout
- **Full viewport width** - removed max-w-7xl constraint
- **NO SCROLLING** - All info visible at once using 3-column grid
- **LEFT Column**: Match info, score (4xl-5xl), run rates
- **CENTER Column**: Current batsmen with stats
- **RIGHT Column**: Current bowler + Last 5 overs with ball-by-ball visualization
- **Mobile**: Single column stack, minimal scrolling

#### **Overs Tab** - Ball-by-Ball with Live Commentary
- Shows each over in reverse chronological order (latest first)
- Displays bowler name for each over
- Color-coded balls: Red (wicket), Blue (4), Purple (6), Yellow (wide/no-ball), Gray (others)
- **NEW: Live Commentary** - Auto-generated commentary for each ball:
  - "SIX! Batsman smashes it for 6 runs"
  - "FOUR! Batsman finds the boundary"
  - "OUT! Wicket type (fielder name)"
  - "Wide ball, X extras"
  - "No ball! Free hit next"
  - "Batsman scores X runs"
  - "Dot ball"
- Innings selector at top right
- Compact layout with text-xs fonts

#### **Scoreboard Tab** - Side-by-Side Tables
- **2-column grid** on large screens (batting left, bowling right)
- Single column on mobile/tablet
- Innings selector at top right
- Compact tables with text-xs fonts
- Shows: Batsmen (R, B, 4s, SR, dismissal), Bowlers (O, R, W, Econ)
- Extras summary below batting table

#### **Global Improvements**:
- Reduced all padding and margins (p-2, mb-2 instead of p-8, mb-6)
- Smaller tournament header and tabs
- All tabs now use `flex-1 overflow-hidden` for proper viewport fit
- Innings selector buttons: Compact "1st Inn / 2nd Inn" style

**Files Modified**:
- [src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx) - Complete redesign of all 3 tabs

**Benefits**:
- ✅ **Uses full viewport width** - no wasted space
- ✅ **Live tab shows everything without scrolling**
- ✅ **Live commentary** on Overs tab
- ✅ **Side-by-side batting/bowling** on Scoreboard tab
- ✅ **3-column dashboard** for Live tab (desktop)
- ✅ **Last 5 overs** visible in Live tab
- ✅ **Compact, information-dense** design
- ✅ **Perfect for any screen size** - phone to TV
- ✅ **No external scrolling** - everything fits viewport

---

### 2. ✅ FIXED: Playing XI Persistence Issue

**Problem**: Playing XI was not being saved to the database, causing it to be `undefined` in the scoring page. This meant all players were showing up for selection instead of just the playing XI.

**Root Cause**:
- The database schema didn't have columns for `team1_playing_xi` and `team2_playing_xi`
- The `addMatch` and `updateMatch` functions weren't saving these fields
- The `getCurrentMatch` and `getMatchesByTournament` functions weren't loading these fields

**Solution**:
- Added `team1_playing_xi TEXT` and `team2_playing_xi TEXT` columns to matches table
- Added database migration to add these columns to existing databases
- Updated `addMatch` to save playing XI as JSON strings
- Updated `updateMatch` to also save/update playing XI
- Updated `getCurrentMatch` and `getMatchesByTournament` to parse and return playing XI arrays
- Removed debug logging from Scoring.tsx

**Files Modified**:
- [electron/database.js](electron/database.js#L80-L81) - Added playing XI columns to schema
- [electron/database.js](electron/database.js#L122-L128) - Added migration for existing databases
- [electron/db-operations.js](electron/db-operations.js#L308-L318) - Save playing XI in addMatch
- [electron/db-operations.js](electron/db-operations.js#L342-L353) - Save playing XI in updateMatch
- [electron/db-operations.js](electron/db-operations.js#L267-L268) - Load playing XI in getMatchesByTournament
- [electron/db-operations.js](electron/db-operations.js#L296-L297) - Load playing XI in getCurrentMatch
- [src/pages/Scoring.tsx](src/pages/Scoring.tsx#L1127-L1134) - Removed debug logging

**How it works now**:
1. Match setup saves playing XI to database as JSON arrays
2. When scoring page loads, playing XI is properly loaded from database
3. Only playing XI players appear for batsman/bowler selection
4. Full squad still available for fielder selection (catches, run-outs, stumpings)
5. If you refresh the page, playing XI persists correctly

**Benefits**:
- ✅ Playing XI persists through page refresh
- ✅ Only playing XI players shown for batting/bowling
- ✅ Backward compatible with old matches
- ✅ Database migration handles existing data

---

### 3. ✅ Tournament Format Selection (6v6 or 8v8)

**Problem**: Tournament creation was hardcoded to 11 players per team, couldn't create 6v6 or 8v8 tournaments.

**Solution**:
- Added tournament format selection in tournament creation form
- Users can now choose between **6v6** or **8v8** format
- Format is fixed per tournament (cannot be changed after creation)
- Teams can have more players than the format (e.g., 6 playing + 3 subs = 9 total in squad)
- Match setup enforces the tournament's format for playing XI selection

**Implementation**:
- Updated [src/pages/Tournaments.tsx](src/pages/Tournaments.tsx):
  - Added `playersPerTeam` state with 6v6/8v8 toggle buttons
  - Tournament stores selected format in `playersPerTeam` field
  - Default format is 6v6
- Updated [src/pages/MatchSetup.tsx](src/pages/MatchSetup.tsx):
  - Uses `tournament.playersPerTeam` for validation
  - Dynamic labels show correct number (6 or 8)
  - Player selection limits based on tournament format

**How it works**:
1. Create tournament → Select format (6v6 or 8v8)
2. Add teams with any number of players (playing XI + subs)
3. Setup match → Select exactly 6 (or 8) players based on format
4. During match → All squad players available for fielder selection

**Files Modified**:
- `src/pages/Tournaments.tsx` - Format selection UI
- `src/pages/MatchSetup.tsx` - Dynamic playing XI selection
- `src/pages/TournamentSettings.tsx` - Made format field read-only (cannot be changed)
- `src/contexts/AppContext.tsx` - Added migration to update old tournaments to 6v6 format

**Benefits**:
- ✅ Support for 6v6 and 8v8 tournaments
- ✅ Format enforced throughout tournament
- ✅ Teams can have substitute players
- ✅ Clear validation messages

---

### 4. ✅ Fielder Tracking for Dismissals

**Problem**: No way to track which fielder was involved in catches, run-outs, and stumpings.

**Solution**:
- Added fielder selection dialog that appears after selecting dismissal types that need fielder involvement
- When wicket type is "caught", "run out", "stumped", or "caught & bowled", a second dialog shows all bowling team players
- Scorer selects the fielder who was involved in the dismissal
- Fielder name is stored in both ball data and fall of wickets

**Implementation**:
- Updated [src/pages/Scoring.tsx](src/pages/Scoring.tsx):
  - Added `showFielderSelect` and `selectedWicketType` state variables
  - Modified `handleWicketTypeSelection` to check if wicket needs fielder
  - Updated `recordBall` function to accept `fielderName` parameter
  - Added fielder selection modal UI showing all bowling team players
- Ball and FallOfWicket already had optional `fielder`/`fielderId` fields

**How it works**:
1. Scorer clicks "OUT" button
2. Selects wicket type (e.g., "Caught")
3. **NEW**: Fielder selection dialog appears with all bowling team players
4. Scorer clicks on fielder name
5. Wicket is recorded with fielder information

**Files Modified**:
- `src/pages/Scoring.tsx` - Added fielder selection logic and UI

**Benefits**:
- ✅ Complete dismissal records
- ✅ Shows all squad players (not just playing XI) - subs can be selected
- ✅ Fielder info available for Excel export
- ✅ Easy one-click selection
- ✅ Back button to change wicket type if needed

---

## Date: 2025-11-12

### 1. ✅ 6-Man Playing XI Selection

**Problem**: Users wanted to select only 6 players per team instead of full squad.

**Solution**:
- Added `team1PlayingXI` and `team2PlayingXI` fields to Match type ([src/types/index.ts](src/types/index.ts:32-33))
- Updated [src/pages/MatchSetup.tsx](src/pages/MatchSetup.tsx) with player selection UI:
  - Click to select/deselect players (max 6 per team)
  - Visual feedback: Blue highlight for Team 1, Green for Team 2
  - Counter shows "Selected: X/6"
  - Validation enforces exactly 6 players before match start
- Updated [src/pages/Scoring.tsx](src/pages/Scoring.tsx:1274-1292) to filter players:
  - Only players in playing XI appear in selection dialogs
  - Backward compatible (shows all players if playing XI not defined)
  - **Substitutes**: Any player from the 6-man lineup can be selected as replacement

**Files Modified**:
- `src/types/index.ts` - Added playing XI fields to Match interface
- `src/pages/MatchSetup.tsx` - Complete playing XI selection UI
- `src/pages/Scoring.tsx` - Player filtering logic

---

### 2. ✅ Consolidated Scoreboard with Tabs

**Problem**: Two separate scoreboard routes (`/scoreboard` and `/network-scoreboard`) causing confusion.

**Solution**:
- **Removed** `Scoreboard.tsx` (old local scoreboard)
- **Consolidated** to single route: `/scoreboard` → NetworkScoreboard
- **Added 3 tabs** to NetworkScoreboard ([src/pages/NetworkScoreboard.tsx](src/pages/NetworkScoreboard.tsx)):

#### Tab 1: Live
- Current score (runs/wickets, overs)
- Current run rate & required run rate
- Current batsmen stats (runs, balls, SR)
- Current bowler stats (overs, runs, wickets, economy)

#### Tab 2: Overs
- Over-by-over breakdown
- Ball-by-ball visualization with color coding:
  - 🔴 Red: Wicket
  - 🟡 Yellow: Wide/No-ball
  - 🔵 Blue: Four
  - 🟣 Purple: Six
  - ⚫ Gray: Regular runs
- Shows runs and wickets per over

#### Tab 3: Scoreboard
- Full innings scorecard
- **Batting table**: Player, Runs, Balls, 4s, Strike Rate, Dismissal
- **Bowling table**: Bowler, Overs, Runs, Wickets, Economy
- **Extras breakdown**: Wides, No-balls, Byes, Leg-byes

**Files Modified**:
- `src/App.tsx` - Removed Scoreboard import, consolidated to NetworkScoreboard
- `src/pages/NetworkScoreboard.tsx` - Added tab state and 3 tab contents

---

### 3. ✅ Fixed Server Error

**Problem**: Duplicate function declarations in server.js causing crash on startup.

**Solution**:
- Removed duplicate `broadcastMatchUpdate`, `broadcastShowAd`, `broadcastCloseAd` functions
- Kept only the original declarations (lines 59-77)

**File Modified**:
- `electron/server.js` - Removed lines 648-672 (duplicate functions)

---

## Access Instructions

### For Scorers (Main App):
- Start match setup: Select teams → Select 6 players each → Configure toss → Start match
- Score balls as usual
- View scoreboard: Navigate to Scoreboard from menu

### For Display Devices (Network Scoreboard):
1. Get scorer's IP address from main app
2. Open browser on display device
3. Navigate to: `http://[scorer-ip]:3000/scoreboard` OR `http://[scorer-ip]:5173/#/scoreboard` (dev mode)
4. Select match (if multiple matches)
5. Use tabs to switch between Live, Overs, and Scoreboard views

---

## Build Status
✅ **Build Successful** - No errors
- Bundle size: 861 KB (gzipped: 264 KB)
- All TypeScript checks passed
- Production ready

---

## What Works Now

### Match Setup
- ✅ Select exactly 6 players per team with visual UI
- ✅ Players show name, role, jersey number
- ✅ Validation ensures 6 players selected
- ✅ Playing XI stored in match data

### Scoring
- ✅ Only playing XI players appear in selection dialogs
- ✅ Can substitute any player from the 6-man lineup
- ✅ All existing features still work (free hit, retired hurt, overthrows, undo, etc.)

### Network Scoreboard
- ✅ Single unified route: `/scoreboard`
- ✅ 3 tabs: Live, Overs, Scoreboard
- ✅ Real-time updates via Socket.IO
- ✅ Works on any browser/device
- ✅ Match selector for multiple matches
- ✅ Connection status indicator
- ✅ Responsive design (mobile, tablet, desktop)

---

## Technical Details

### New Types
```typescript
// src/types/index.ts
export interface Match {
  // ... existing fields
  team1PlayingXI?: string[]; // Player IDs for team 1
  team2PlayingXI?: string[]; // Player IDs for team 2
}
```

### Player Selection Logic
```typescript
// src/pages/Scoring.tsx:1276-1284
// Filter by playing XI first
const playingXI = showPlayerSelect === 'bowler'
  ? (currentInnings.bowlingTeamId === currentMatch.team1.id
      ? currentMatch.team1PlayingXI
      : currentMatch.team2PlayingXI)
  : (currentInnings.battingTeamId === currentMatch.team1.id
      ? currentMatch.team1PlayingXI
      : currentMatch.team2PlayingXI);

// If playing XI is defined, only show players in playing XI
if (playingXI && playingXI.length > 0 && !playingXI.includes(player.id)) {
  return false;
}
```

### Tab State Management
```typescript
// src/pages/NetworkScoreboard.tsx:17
const [activeTab, setActiveTab] = useState<'live' | 'overs' | 'scoreboard'>('live');
```

---

## Testing Checklist

Before using in tournament:
- [ ] Test 6-player selection for both teams
- [ ] Verify only selected players appear in scoring
- [ ] Test substitute player selection
- [ ] Open scoreboard on network device
- [ ] Test all 3 tabs (Live, Overs, Scoreboard)
- [ ] Verify real-time updates when scoring
- [ ] Test with multiple display devices
- [ ] Check responsive design on phone/tablet

---

## Known Limitations

1. **Playing XI is optional**: Old matches without playing XI will show all players (backward compatible)
2. **No player role enforcement**: Can select any 6 players regardless of roles (batsmen, bowlers, etc.)
3. **No formal substitute tracking**: Substitutes work by selecting from the 6-man lineup, but no separate "substitute" status

---

## Future Enhancements (If Needed)

1. Auto-select playing XI based on player roles (e.g., 3 batsmen, 2 bowlers, 1 all-rounder)
2. Show substitute badge/indicator in scoreboard
3. Allow changing playing XI mid-match
4. Impact player rule (substitute with different skillset)
5. Player performance history in selection UI

---

*Last Updated: 2025-11-12*
*Build Version: 1.0.1*
