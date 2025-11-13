# Cricket Scoring Application - Complete Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Application Flow](#application-flow)
4. [Features Implemented](#features-implemented)
5. [Features Remaining](#features-remaining)
6. [Architecture & Code Structure](#architecture--code-structure)
7. [Database Schema](#database-schema)
8. [Key Components](#key-components)
9. [Future Enhancements](#future-enhancements)

---

## Application Overview

### Goal
A comprehensive **Cricket Scoring Application** built with Electron for local tournaments, featuring:
- Real-time ball-by-ball scoring
- Multi-device live scoreboards
- Advanced cricket statistics (partnerships, fall of wickets, over summaries)
- Ad broadcasting system
- Complete match management

### Target Users
- Local tournament organizers
- Cricket scorers
- Match commentators
- Spectators (via live scoreboard displays)

---

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite 5.4** - Build tool and dev server
- **React Router** (HashRouter for Electron compatibility)
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Electron** - Desktop application framework
- **SQLite (better-sqlite3)** - Embedded database
- **Express** - HTTP server for multi-device sync
- **Socket.IO** - Real-time scoreboard updates
- **Node.js** - Runtime environment

### Build & Development
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Electron Builder** - Application packaging

---

## Application Flow

### 1. Tournament Setup
```
Create Tournament
  ├─ Set tournament name
  ├─ Upload logo (optional)
  ├─ Configure overs per innings
  └─ Set players per team

Add Teams
  ├─ Team name
  ├─ Team photo (optional)
  └─ Add players (name, role, jersey number)

Create Match
  ├─ Select Team 1 & Team 2
  ├─ Configure toss (winner, decision)
  └─ Set overs for match
```

### 2. Match Scoring Flow
```
Match Starts
  │
  ├─ Select Opening Batsmen (Striker & Non-Striker)
  ├─ Select Opening Bowler
  │
  ├─ Record Ball-by-Ball
  │   ├─ Runs: 0, 1, 2, 3, 4, 5
  │   ├─ Wickets: OUT, 6 OUT (local rule)
  │   ├─ Extras: Wide, No-Ball, Bye, Leg-Bye
  │   ├─ Special: Free Hit, Overthrow, Short Run
  │   └─ Actions: Retired Hurt, Undo Ball
  │
  ├─ Auto Track:
  │   ├─ Batsman stats (runs, balls, SR, 4s)
  │   ├─ Bowler stats (overs, runs, wickets, economy)
  │   ├─ Partnerships (current & historical)
  │   ├─ Fall of wickets (with dismissal details)
  │   └─ Ball-by-ball commentary
  │
  ├─ Over Complete → Change Bowler
  │
  ├─ Innings Complete → Show Summary
  │
  └─ 2nd Innings → Repeat Process
      │
      └─ Match Complete → Show Result
```

### 3. Live Scoreboard Flow
```
Scoring Page (Main Device)
  │
  ├─ Updates saved to SQLite database
  │
  ├─ HTTP Server (Express on port 3000)
  │   └─ Broadcasts match updates
  │
  └─ Socket.IO Server
      └─ Real-time push to displays

Display Devices
  │
  ├─ Open http://[scorer-ip]:3000/display
  │
  └─ Receive Real-time Updates:
      ├─ Live scores
      ├─ Current batsmen stats
      ├─ Current bowler stats
      ├─ Over summaries
      └─ Ads (image/video)
```

---

## Features Implemented

### ✅ Phase 1: Core Functionality (COMPLETE)

#### Database Schema
- ✅ Enhanced `innings` table with `is_declared`, `is_all_out`, `target_score`, `extras_penalties`
- ✅ Enhanced `batsman_stats` table with `is_retired_hurt`, `can_return`, `dismissal_over`, `dismissal_ball`
- ✅ Created `fall_of_wickets` table
- ✅ Created `partnerships` table
- ✅ All CRUD operations in `db-operations.js`

#### Fall of Wickets Tracking
- ✅ Automatic recording on wicket
- ✅ Stores: wicket number, player out, runs at fall, overs, balls, how out, bowler
- ✅ Display in innings summary

#### Partnership Tracking
- ✅ Automatic creation when new batsman arrives
- ✅ Updates on every ball (runs, balls faced)
- ✅ Marks previous partnership as inactive
- ✅ Display current and historical partnerships

#### Innings Summary Component
- ✅ Shows between 1st and 2nd innings
- ✅ Displays: total score, batsmen performance, bowler performance, extras breakdown
- ✅ Fall of wickets timeline
- ✅ Partnership details

#### TypeScript Types
- ✅ Complete type definitions for all cricket entities
- ✅ `Ball`, `FallOfWicket`, `Partnership`, `Extras` interfaces
- ✅ Comprehensive `BatsmanStats` and `BowlerStats`

---

### ✅ Phase 2: Advanced Scoring Features (COMPLETE)

#### Free Hit After No-Ball
- ✅ Automatically triggered after no-ball
- ✅ Batsman cannot be out except run-out
- ✅ Visual indicator with animated badge (🎯 FREE HIT)
- ✅ Ball data includes `isFreeHit` flag
- ✅ Auto-clears after valid delivery

**Location**: `src/pages/Scoring.tsx`
- Lines 26, 75-77: Free hit state and validation
- Lines 313-320: Free hit trigger logic
- Lines 650-654: Visual indicator UI

#### Retired Hurt Handling
- ✅ "Retired Hurt" button for batsman on strike
- ✅ Marks batsman with `isRetiredHurt: true`, `canReturn: true`
- ✅ Player can return from selection list (shows "Retired Hurt" badge)
- ✅ Stats preserved when returning
- ✅ Dismissal details recorded (over, ball)

**Location**: `src/pages/Scoring.tsx`
- Lines 511-559: `handleRetiredHurt()` function
- Lines 440-455: Return from retired hurt logic

#### Overthrows Tracking
- ✅ "+ Overthrow" button (enabled after balls bowled)
- ✅ Dialog to select 1-4 overthrow runs
- ✅ Adds runs to last ball's total
- ✅ Marks ball with `isOverthrow: true` and `overthrowRuns`
- ✅ Automatic strike rotation if odd runs
- ✅ Updates partnerships

**Location**: `src/pages/Scoring.tsx`
- Lines 572-622: `handleOverthrow()` function
- Lines 1236-1262: Overthrow dialog UI

#### Short Run Detection
- ✅ "Short Run" button (enabled after balls bowled)
- ✅ Deducts 1 run from innings total
- ✅ Marks ball with `shortRun: true`
- ✅ Prevents double marking
- ✅ Validates ball had runs before allowing
- ✅ Updates partnerships

**Location**: `src/pages/Scoring.tsx`
- Lines 625-669: `handleShortRun()` function

#### Run Out on Wide/No-Ball with Batsmen Crossed
- ✅ Handled in ball recording logic
- ✅ `batsmenCrossed` field in Ball type
- ✅ Proper strike rotation after dismissal

---

### ✅ Phase 3: Professional Features (COMPLETE)

#### Wicket Type Selector Dialog
- ✅ Modal dialog on OUT button click
- ✅ 10 wicket types with emojis:
  - 🎯 Bowled
  - 🤲 Caught
  - 🦵 LBW
  - 🏃 Run Out
  - 🧤 Stumped
  - 💥 Hit Wicket
  - 🎯🤲 Caught & Bowled
  - 🚫 Obstructing
  - ✋ Handled Ball
  - ⏰ Timed Out
- ✅ Wicket type stored in fall of wickets
- ✅ Works for both "OUT" and "6 OUT" buttons

**Location**: `src/pages/Scoring.tsx`
- Lines 28-29: State variables
- Lines 671-679: Handler functions
- Lines 1264-1303: Wicket type selector UI
- Line 247: Wicket type storage in fall of wickets

#### Undo Last Ball Functionality
- ✅ "Undo Ball" button (orange, in actions section)
- ✅ Complete state reversal:
  - ✅ Innings runs
  - ✅ Extras (wides, no-balls, byes, leg-byes)
  - ✅ Batsman stats (runs, balls, fours, strike rate)
  - ✅ Bowler stats (runs, balls, wickets, economy, overs)
  - ✅ Ball count and over count
  - ✅ Wickets (removes fall of wicket entry)
  - ✅ Partnerships (runs and balls)
  - ✅ Free hit state
- ✅ Disabled when no balls bowled
- ✅ Success/error notifications

**Location**: `src/pages/Scoring.tsx`
- Lines 681-809: `handleUndoLastBall()` function
- Lines 1065-1071: Undo Ball button UI

---

### ✅ User-Requested Custom Features (COMPLETE)

#### Ball-by-Ball Commentary (Live Tab)
- ✅ Shows current score, striker, non-striker, bowler
- ✅ Ball-by-ball logs with ball number and outcome
- ✅ Real-time updates
- ✅ Scrollable history

**Location**: `src/pages/Scoreboard.tsx` - Live tab

#### Over-by-Over Summary
- ✅ Complete over breakdown
- ✅ Shows: over number, runs scored, wickets fallen
- ✅ Ball-by-ball details for each over
- ✅ Bowler for each over

**Location**: `src/pages/Scoreboard.tsx` - Overs tab

#### Scoreboard Tabs
- ✅ **Live Tab**: Current match state, ball-by-ball commentary
- ✅ **Overs Tab**: Over-by-over breakdown
- ✅ **Scoreboard Tab**: Full innings details for 1st and 2nd innings
  - Batsmen performance table
  - Bowler performance table
  - Extras breakdown

**Location**: `src/pages/Scoreboard.tsx`

#### Local Tournament Rules
- ✅ **6 = OUT**: Hitting a 6 results in automatic dismissal
- ✅ **"6 OUT" button**: Dedicated button for this rule
- ✅ No strike change on catch (already implemented)
- ✅ Sixes not counted in batsman stats

**Location**: `src/pages/Scoring.tsx` - Lines 891-908

---

### ✅ Ad Broadcasting System (COMPLETE)

#### Ad Management
- ✅ Upload image/video ads
- ✅ Set ad duration
- ✅ Enable/disable ads per tournament
- ✅ Chunked storage in database (10MB chunks)

#### Broadcasting
- ✅ Broadcast to all display devices
- ✅ Auto-stop after duration
- ✅ HTTP API + Socket.IO for real-time delivery
- ✅ Local preview on scorer device

**Location**:
- `src/pages/Ads.tsx` - Ad management
- `electron/server.js` - Broadcasting server
- `src/pages/Display.tsx` - Display device receiver

---

### ✅ Live Scoreboard System (COMPLETE)

#### Display Page
- ✅ Accessible at `http://[scorer-ip]:3000/display`
- ✅ Real-time score updates via Socket.IO
- ✅ Shows: current score, batsmen, bowler, over progress
- ✅ Recent balls visualization
- ✅ Full-screen ad display
- ✅ Auto-reconnect on connection loss

#### Server Infrastructure
- ✅ Express HTTP server (port 3000)
- ✅ Socket.IO for real-time updates
- ✅ API endpoints: `/api/match/current`, `/api/ad/show`, `/api/ad/close`
- ✅ CORS enabled for multi-device access

**Location**:
- `electron/server.js` - Backend server
- `src/pages/Display.tsx` - Frontend display

---

## Features Remaining

### ⏳ Optional Advanced Analytics (NOT IMPLEMENTED)

These features are **optional** and not critical for tournament operation:

#### 1. DLS/VJD Method for Rain Interruptions
**Status**: Not Started
**Priority**: Low
**Description**: Calculate revised target using Duckworth-Lewis-Stern or VJD method

**Implementation Notes**:
- Requires complex DLS tables or algorithm
- Only needed if rain interruptions are common
- Can be added later if required

---

#### 2. Wagon Wheel Visualization
**Status**: Not Started
**Priority**: Low
**Description**: Visual representation of where batsman hit boundaries

**Implementation Notes**:
- Requires shot direction tracking on each ball
- Ball type needs `shotDirection` field (e.g., "cover", "mid-wicket", "fine-leg")
- Canvas or SVG for cricket field visualization
- Interactive UI to record shot direction during scoring

**Files to Modify**:
- `src/types/index.ts` - Add `shotDirection` to Ball interface
- `src/pages/Scoring.tsx` - Add shot direction selector
- Create `src/components/WagonWheel.tsx` - Visualization component

---

#### 3. Manhattan Chart (Over-by-Over Runs)
**Status**: Not Started
**Priority**: Low
**Description**: Bar chart showing runs scored per over

**Implementation Notes**:
- Data already available in `ballByBall` array
- Group balls by over and sum runs
- Use Chart.js or Recharts library
- Add to Scoreboard page

**Files to Modify**:
- Add chart library: `npm install recharts`
- Create `src/components/ManhattanChart.tsx`
- Import in `src/pages/Scoreboard.tsx`

---

#### 4. Worm Chart (Cumulative Runs)
**Status**: Not Started
**Priority**: Low
**Description**: Line chart showing cumulative score progression

**Implementation Notes**:
- Similar to Manhattan but cumulative
- Compare 1st vs 2nd innings
- Useful for chasing team

**Files to Modify**:
- Create `src/components/WormChart.tsx`
- Import in `src/pages/Scoreboard.tsx`

---

#### 5. Bowling Analysis Heatmap
**Status**: Not Started
**Priority**: Low
**Description**: Visual heatmap of where bowler bowled (length/line)

**Implementation Notes**:
- Requires ball tracking: length (full, good, short) + line (off, middle, leg)
- Ball type needs `ballLength` and `ballLine` fields
- Canvas visualization of bowling area
- Advanced feature for detailed analysis

**Files to Modify**:
- `src/types/index.ts` - Add `ballLength`, `ballLine` to Ball interface
- `src/pages/Scoring.tsx` - Add ball tracking selector
- Create `src/components/BowlingHeatmap.tsx`

---

## Architecture & Code Structure

### Project Structure
```
cricket-scoring-app/
├── src/                          # React frontend source
│   ├── components/              # Reusable UI components
│   │   ├── AdPlayer.tsx         # Ad playback component
│   │   ├── ConfirmDialog.tsx    # Confirmation modals
│   │   └── InningsSummary.tsx   # Innings summary display
│   │
│   ├── contexts/                # React contexts
│   │   └── AppContext.tsx       # Global app state
│   │
│   ├── pages/                   # Main application pages
│   │   ├── Tournaments.tsx      # Tournament management
│   │   ├── Teams.tsx            # Team & player management
│   │   ├── Matches.tsx          # Match setup
│   │   ├── Scoring.tsx          # **MAIN SCORING INTERFACE**
│   │   ├── Scoreboard.tsx       # Scoreboard tabs (Live/Overs/Full)
│   │   ├── Display.tsx          # Live scoreboard display
│   │   └── Ads.tsx              # Ad management
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # All cricket types
│   │
│   ├── utils/                   # Helper functions
│   │   └── helpers.ts           # Cricket calculations
│   │
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # React entry point
│
├── electron/                     # Electron backend
│   ├── main.js                  # Electron main process
│   ├── preload.js               # IPC bridge
│   ├── database.js              # SQLite schema & initialization
│   ├── db-operations.js         # **ALL DATABASE OPERATIONS**
│   └── server.js                # Express + Socket.IO server
│
├── public/                       # Static assets
├── dist/                         # Build output
└── package.json                  # Dependencies
```

---

### Key Files Deep Dive

#### 1. `src/pages/Scoring.tsx` (Main Scoring Interface)
**Lines of Code**: ~1400
**Purpose**: Complete match scoring functionality

**Key Sections**:
- **Lines 1-30**: State management (batsmen, bowler, dialogs, free hit, etc.)
- **Lines 72-336**: `recordBall()` - Core ball recording logic
  - Validates cricket rules
  - Updates batsman/bowler stats
  - Tracks partnerships
  - Records fall of wickets
  - Handles strike rotation
  - Manages extras
- **Lines 338-509**: Player selection logic
- **Lines 511-559**: Retired hurt handler
- **Lines 572-622**: Overthrow handler
- **Lines 625-669**: Short run handler
- **Lines 671-679**: Wicket type selector handlers
- **Lines 681-809**: Undo last ball handler
- **Lines 811-825**: Ad broadcasting handlers
- **Lines 827-1400**: UI rendering
  - Scoreboard display
  - Player selection dialogs
  - Run buttons (0-5, OUT, 6 OUT)
  - Extras buttons (Wide, No-Ball, Bye, Leg-Bye)
  - Action buttons (Overthrow, Short Run, Retired Hurt, Undo)
  - Wicket type selector modal
  - Overthrow input modal
  - Bowler change modal

**Critical Functions**:
- `recordBall(runs, isWicket, extraType, extraRuns, wicketType)` - Records every ball
- `handleRetiredHurt()` - Retire batsman
- `handleOverthrow(runs)` - Add overthrow runs
- `handleShortRun()` - Mark short run
- `handleUndoLastBall()` - Undo last delivery
- `handleWicketTypeSelection(type)` - Select dismissal type

---

#### 2. `electron/db-operations.js` (Database Layer)
**Lines of Code**: ~730
**Purpose**: All CRUD operations for SQLite database

**Key Sections**:
- **Lines 1-100**: Tournament operations (CRUD)
- **Lines 102-200**: Team operations (CRUD)
- **Lines 202-300**: Player operations (CRUD)
- **Lines 302-370**: Match operations (CRUD)
- **Lines 372-518**: **Innings operations** (most critical)
  - `getInningsByMatch()` - Lines 372-407
  - `addInnings()` - Lines 409-461
  - `updateInnings()` - Lines 463-518
- **Lines 520-555**: Batsman stats operations
- **Lines 557-595**: Bowler stats operations
- **Lines 597-622**: Ball-by-ball operations
- **Lines 624-658**: **Fall of wickets operations**
- **Lines 660-699**: **Partnership operations**
- **Lines 701-750**: Ad operations

**Critical Functions**:
- `updateInnings()` - Called on every ball, updates entire innings state
- `getFallOfWicketsByInnings()` - Retrieves wicket timeline
- `getPartnershipsByInnings()` - Retrieves partnership history
- `addFallOfWicket()` - Records wicket details
- `addPartnership()` - Creates new partnership

---

#### 3. `electron/database.js` (Schema Definition)
**Purpose**: SQLite database schema and initialization

**Tables**:
1. **tournaments** - Tournament metadata
2. **teams** - Team details
3. **players** - Player profiles
4. **matches** - Match setup
5. **innings** - Innings totals, extras, flags
6. **batsman_stats** - Individual batsman performance
7. **bowler_stats** - Individual bowler performance
8. **balls** - Ball-by-ball records
9. **fall_of_wickets** - Wicket timeline
10. **partnerships** - Partnership records
11. **ads** - Ad metadata
12. **ad_chunks** - Chunked ad files (10MB per chunk)
13. **ad_display_log** - Ad broadcast history

---

#### 4. `src/pages/Scoreboard.tsx` (Multi-Tab Display)
**Purpose**: Three-tab scoreboard interface

**Tabs**:
1. **Live**: Current match state + ball-by-ball commentary
2. **Overs**: Over-by-over breakdown with ball details
3. **Scoreboard**: Full innings details (batsmen, bowlers, extras) for both innings

---

#### 5. `electron/server.js` (Multi-Device Server)
**Purpose**: HTTP + Socket.IO server for live scoreboard

**Endpoints**:
- `GET /api/match/current` - Current match data
- `POST /api/ad/show` - Broadcast ad
- `POST /api/ad/close` - Stop ad

**Socket.IO Events**:
- `matchUpdate` - Sent on every ball
- `adShow` - Sent when ad starts
- `adClose` - Sent when ad stops

---

## Database Schema

### Core Tables

#### innings
```sql
CREATE TABLE innings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  innings_number INTEGER NOT NULL,
  batting_team_id TEXT NOT NULL,
  bowling_team_id TEXT NOT NULL,
  runs INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  extras_wides INTEGER DEFAULT 0,
  extras_no_balls INTEGER DEFAULT 0,
  extras_byes INTEGER DEFAULT 0,
  extras_leg_byes INTEGER DEFAULT 0,
  extras_penalties INTEGER DEFAULT 0,        -- Phase 1 addition
  is_declared INTEGER DEFAULT 0,             -- Phase 1 addition
  is_all_out INTEGER DEFAULT 0,              -- Phase 1 addition
  target_score INTEGER,                      -- Phase 1 addition
  FOREIGN KEY (match_id) REFERENCES matches(id)
)
```

#### batsman_stats
```sql
CREATE TABLE batsman_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  is_out INTEGER DEFAULT 0,
  how_out TEXT,
  strike_rate REAL DEFAULT 0,
  is_on_strike INTEGER DEFAULT 0,
  is_retired_hurt INTEGER DEFAULT 0,         -- Phase 1 addition
  can_return INTEGER DEFAULT 1,              -- Phase 1 addition
  dismissal_over INTEGER,                    -- Phase 1 addition
  dismissal_ball INTEGER,                    -- Phase 1 addition
  FOREIGN KEY (innings_id) REFERENCES innings(id)
)
```

#### fall_of_wickets (Phase 1)
```sql
CREATE TABLE fall_of_wickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id INTEGER NOT NULL,
  wicket_number INTEGER NOT NULL,
  player_out TEXT NOT NULL,
  runs INTEGER NOT NULL,
  overs INTEGER NOT NULL,
  balls INTEGER NOT NULL,
  how_out TEXT NOT NULL,
  fielder TEXT,
  bowler TEXT,
  FOREIGN KEY (innings_id) REFERENCES innings(id)
)
```

#### partnerships (Phase 1)
```sql
CREATE TABLE partnerships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id INTEGER NOT NULL,
  batsman1 TEXT NOT NULL,
  batsman2 TEXT NOT NULL,
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (innings_id) REFERENCES innings(id)
)
```

---

## Key Components

### 1. Ball Recording Logic Flow

```javascript
recordBall(runs, isWicket, extraType, extraRuns, wicketType)
  │
  ├─ Validate Cricket Rules
  │   ├─ Free hit check (no wicket except run-out)
  │   ├─ Batsmen selected check
  │   ├─ Match not complete check
  │   └─ Innings not complete check
  │
  ├─ Calculate Runs
  │   ├─ Wide/No-ball: runs + extraRuns + 1 penalty
  │   ├─ Bye/Leg-bye: only runs (no penalty)
  │   └─ Normal: just runs
  │
  ├─ Update Innings Total
  │
  ├─ Update Extras
  │
  ├─ Update Batsman Stats
  │   ├─ Add runs (not for bye/leg-bye)
  │   ├─ Increment balls (only valid deliveries)
  │   ├─ Count fours
  │   ├─ Mark out if wicket
  │   └─ Recalculate strike rate
  │
  ├─ Update Bowler Stats
  │   ├─ Increment balls (only valid deliveries)
  │   ├─ Add runs conceded
  │   ├─ Increment wickets
  │   └─ Recalculate economy
  │
  ├─ Update Ball Count
  │   ├─ Increment balls (only valid deliveries)
  │   └─ Check over complete (6 balls)
  │
  ├─ Record Fall of Wicket (if wicket)
  │   └─ Store: wicket #, player, runs, overs, balls, how out, bowler
  │
  ├─ Update Partnership
  │   ├─ If no partnership, create new one
  │   ├─ Add runs and balls to active partnership
  │   └─ If wicket, mark partnership inactive
  │
  ├─ Create Ball Record
  │   └─ Store complete ball details
  │
  ├─ Strike Rotation Logic
  │   ├─ Odd runs: swap striker/non-striker
  │   ├─ Over complete: swap striker/non-striker
  │   └─ Wicket: no swap (new batsman selection)
  │
  ├─ Free Hit Logic
  │   ├─ If no-ball: set next ball as free hit
  │   └─ If free hit ball complete: clear free hit
  │
  ├─ Check Innings Complete
  │   ├─ 10 wickets down: show innings summary
  │   ├─ Overs complete: show innings summary
  │   └─ Target chased: complete match
  │
  └─ Save to Database
```

---

### 2. Undo Ball Logic Flow

```javascript
handleUndoLastBall()
  │
  ├─ Get Last Ball from ballByBall array
  │
  ├─ Reverse Innings Runs
  │   └─ Subtract ball's totalRuns
  │
  ├─ Reverse Extras
  │   ├─ Wide: subtract (1 + extraRuns)
  │   ├─ No-ball: subtract (1 + extraRuns)
  │   ├─ Bye: subtract runs
  │   └─ Leg-bye: subtract runs
  │
  ├─ Reverse Batsman Stats
  │   ├─ Subtract runs (if not bye/leg-bye)
  │   ├─ Decrement balls (if valid delivery)
  │   ├─ Decrement fours (if applicable)
  │   ├─ Reverse wicket (mark not out)
  │   └─ Recalculate strike rate
  │
  ├─ Reverse Bowler Stats
  │   ├─ Decrement balls (if valid delivery)
  │   ├─ Subtract runs
  │   ├─ Decrement wickets (if applicable)
  │   └─ Recalculate economy
  │
  ├─ Reverse Ball Count
  │   ├─ Decrement balls
  │   └─ Handle over boundary (5 → 0, decrement over)
  │
  ├─ Remove Fall of Wicket (if wicket)
  │   └─ Pop last entry from fallOfWickets array
  │
  ├─ Reverse Partnership
  │   ├─ Subtract runs
  │   └─ Decrement balls
  │
  ├─ Clear Free Hit (if applicable)
  │   └─ If ball was no-ball that triggered free hit
  │
  ├─ Remove Ball from ballByBall array
  │
  └─ Save to Database
```

---

## Future Enhancements

### Priority: High (If Requested)
1. **Export Match Report** - PDF/Excel export of complete scorecard
2. **Match History & Statistics** - Tournament-wide stats (top scorers, wicket-takers)
3. **Player Profiles** - Career statistics across multiple matches
4. **DRS System** - Decision Review System tracking
5. **Multi-Language Support** - Hindi, regional languages

### Priority: Medium
1. **Audio Commentary** - Text-to-speech ball-by-ball commentary
2. **Score Prediction** - ML-based score prediction
3. **Player Comparison** - Compare batsmen/bowlers in real-time
4. **Custom Tournament Rules** - Powerplays, strategic timeouts
5. **Weather Integration** - Live weather updates

### Priority: Low (Nice to Have)
1. **Wagon Wheel** - Shot direction visualization
2. **Manhattan Chart** - Over-by-over runs graph
3. **Worm Chart** - Cumulative runs comparison
4. **Bowling Heatmap** - Ball tracking visualization
5. **Social Media Integration** - Auto-post match updates

---

## Development Guidelines

### Adding New Features

1. **Update Types First**
   ```typescript
   // src/types/index.ts
   export interface NewFeature { ... }
   ```

2. **Update Database Schema**
   ```javascript
   // electron/database.js
   CREATE TABLE new_feature ( ... )
   ```

3. **Add Database Operations**
   ```javascript
   // electron/db-operations.js
   function getNewFeature() { ... }
   function addNewFeature() { ... }
   ```

4. **Update UI Components**
   ```typescript
   // src/pages/Scoring.tsx or new component
   const handleNewFeature = () => { ... }
   ```

5. **Test Thoroughly**
   - Test with various scenarios
   - Check database persistence
   - Verify undo functionality works
   - Test on multiple devices (if applicable)

### Code Style
- Use TypeScript for type safety
- Follow React hooks patterns
- Keep functions under 100 lines when possible
- Use descriptive variable names
- Add comments for complex cricket logic
- Handle errors with toast notifications

### Cricket Rules to Remember
- 6 balls = 1 over
- 10 wickets = innings complete
- Wide/No-ball = 1 penalty run + no ball counted
- Bye/Leg-bye = runs added but not to batsman
- Free hit = after no-ball, no wicket except run-out
- Strike rotation = odd runs, over complete, or manual swap

---

## Testing Checklist

### Before Each Release

#### Database Tests
- [ ] Create tournament, teams, players
- [ ] Start new match
- [ ] Record full innings
- [ ] Check data persists after app restart
- [ ] Test undo on various ball types
- [ ] Verify fall of wickets accuracy
- [ ] Verify partnerships accuracy

#### Cricket Rules Tests
- [ ] Free hit after no-ball
- [ ] No wicket on free hit (except run-out)
- [ ] 6 OUT rule works
- [ ] Wide adds penalty + extras
- [ ] No-ball adds penalty + extras
- [ ] Strike rotates on odd runs
- [ ] Strike rotates after over
- [ ] Bowler must change after over

#### Edge Cases Tests
- [ ] Retired hurt and return
- [ ] Overthrows with strike rotation
- [ ] Short run deduction
- [ ] Undo after wicket (fall of wicket removed)
- [ ] Undo after partnership change
- [ ] Undo free hit ball
- [ ] All 10 wicket types selectable

#### Multi-Device Tests
- [ ] Display page updates in real-time
- [ ] Ads broadcast to displays
- [ ] Connection recovery after network loss
- [ ] Multiple displays simultaneously

---

## Build & Deployment

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
```

### Production Build
```bash
npm run build        # Build React app
npm run electron:build:mac    # Build macOS app
npm run electron:build:win    # Build Windows app
```

### Distribution
- macOS: `.dmg` installer in `dist/`
- Windows: `.exe` installer in `dist/`

---

## Support & Maintenance

### Common Issues

1. **Database locked error**
   - Caused by multiple simultaneous writes
   - Solution: Already handled with better-sqlite3 synchronous operations

2. **Display not updating**
   - Check server is running (port 3000)
   - Check network connectivity
   - Check Socket.IO connection in browser console

3. **Undo not working correctly**
   - Complex feature, verify ball type being undone
   - Check console for errors
   - Verify ball exists in ballByBall array

---

## Contact & Credits

**Developer**: Built with Claude Code (Anthropic)
**Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Appendix: Complete Feature Matrix

| Feature | Status | Phase | Location |
|---------|--------|-------|----------|
| Tournament Management | ✅ Complete | Core | `src/pages/Tournaments.tsx` |
| Team Management | ✅ Complete | Core | `src/pages/Teams.tsx` |
| Player Management | ✅ Complete | Core | `src/pages/Teams.tsx` |
| Match Setup (Toss) | ✅ Complete | Core | `src/pages/Matches.tsx` |
| Ball-by-Ball Scoring | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Run Buttons (0-5) | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| OUT Button | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| 6 OUT Button (Local Rule) | ✅ Complete | Custom | `src/pages/Scoring.tsx` |
| Wide Scoring | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| No-Ball Scoring | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Bye Scoring | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Leg-Bye Scoring | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Batsman Stats Tracking | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Bowler Stats Tracking | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Strike Rotation | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Over Management | ✅ Complete | Core | `src/pages/Scoring.tsx` |
| Innings Summary | ✅ Complete | Phase 1 | `src/components/InningsSummary.tsx` |
| Fall of Wickets | ✅ Complete | Phase 1 | Multiple files |
| Partnerships | ✅ Complete | Phase 1 | Multiple files |
| Extras Tracking | ✅ Complete | Phase 1 | Multiple files |
| Free Hit After No-Ball | ✅ Complete | Phase 2 | `src/pages/Scoring.tsx` |
| Retired Hurt | ✅ Complete | Phase 2 | `src/pages/Scoring.tsx` |
| Overthrows | ✅ Complete | Phase 2 | `src/pages/Scoring.tsx` |
| Short Run | ✅ Complete | Phase 2 | `src/pages/Scoring.tsx` |
| Run Out on Extras | ✅ Complete | Phase 2 | `src/pages/Scoring.tsx` |
| Wicket Type Selector | ✅ Complete | Phase 3 | `src/pages/Scoring.tsx` |
| Undo Last Ball | ✅ Complete | Phase 3 | `src/pages/Scoring.tsx` |
| Ball-by-Ball Commentary | ✅ Complete | Custom | `src/pages/Scoreboard.tsx` |
| Over-by-Over Summary | ✅ Complete | Custom | `src/pages/Scoreboard.tsx` |
| Scoreboard Tabs | ✅ Complete | Custom | `src/pages/Scoreboard.tsx` |
| Live Scoreboard Display | ✅ Complete | Core | `src/pages/Display.tsx` |
| Ad Management | ✅ Complete | Core | `src/pages/Ads.tsx` |
| Ad Broadcasting | ✅ Complete | Core | `electron/server.js` |
| Multi-Device Sync | ✅ Complete | Core | `electron/server.js` |
| SQLite Database | ✅ Complete | Core | `electron/database.js` |
| Database Operations | ✅ Complete | Core | `electron/db-operations.js` |
| DLS/VJD Method | ❌ Not Implemented | Optional | N/A |
| Wagon Wheel | ❌ Not Implemented | Optional | N/A |
| Manhattan Chart | ❌ Not Implemented | Optional | N/A |
| Worm Chart | ❌ Not Implemented | Optional | N/A |
| Bowling Heatmap | ❌ Not Implemented | Optional | N/A |

---

**Total Implemented Features**: 37
**Remaining Optional Features**: 5
**Completion Percentage**: 88% (all critical features complete)

---

## Quick Start Guide

### For Scorers

1. **Setup Tournament**
   - Open app → Create Tournament
   - Add teams and players

2. **Start Match**
   - Create Match → Select teams → Toss
   - Click "Start Scoring"

3. **Score Match**
   - Select batsmen (striker/non-striker)
   - Select bowler
   - Click run buttons (0, 1, 2, 3, 4, 5)
   - Use OUT for wickets (select dismissal type)
   - Use 6 OUT for local rule (6 = out)
   - Use extra buttons for Wide, No-Ball, Bye, Leg-Bye
   - Use actions for Overthrow, Short Run, Retired Hurt, Undo

4. **Special Situations**
   - **Free Hit**: Auto-triggered after no-ball (see animated badge)
   - **Wicket**: Select dismissal type from modal
   - **Overthrow**: Click "Overthrow" → select runs (1-4)
   - **Short Run**: Click "Short Run" to deduct 1 run
   - **Retired Hurt**: Click "Retired Hurt" → select replacement → player can return later
   - **Mistake**: Click "Undo Ball" to reverse last ball

5. **Between Innings**
   - Innings summary appears automatically
   - Click "Start Next Innings"

6. **View Scoreboard**
   - Click scoreboard icon
   - Switch between Live/Overs/Scoreboard tabs

### For Spectators (Display Setup)

1. Find scorer's IP address (shown in app)
2. Open browser on display device
3. Go to `http://[scorer-ip]:3000/display`
4. Scoreboard updates automatically

---

*End of Documentation*
