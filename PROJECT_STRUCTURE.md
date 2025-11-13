# Project Structure

## Overview
This is a React + TypeScript + Vite application for cricket scoring with a TV-friendly scoreboard display.

## Directory Structure

```
cricket-scoring-app/
├── public/                    # Static files
│   └── ads/                   # Place video ad files here (for production)
│
├── src/
│   ├── components/            # Reusable React components (currently empty, can add shared components)
│   │
│   ├── contexts/              # React Context for state management
│   │   └── AppContext.tsx     # Global app state (tournaments, matches, ads)
│   │
│   ├── pages/                 # Page components (routes)
│   │   ├── Home.tsx           # Landing page with main menu
│   │   ├── Tournaments.tsx    # Tournament list and creation
│   │   ├── TournamentDetail.tsx # Team management for a tournament
│   │   ├── MatchSetup.tsx     # Match configuration (toss, overs, teams)
│   │   ├── Scoring.tsx        # Live scoring interface
│   │   ├── Scoreboard.tsx     # TV display scoreboard
│   │   └── Settings.tsx       # Ad management
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # All app types (Tournament, Match, Team, etc.)
│   │
│   ├── utils/                 # Utility functions
│   │   └── helpers.ts         # Helper functions (calculations, conversions)
│   │
│   ├── App.tsx                # Main app component with routing
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles with Tailwind
│
├── dist/                      # Built files (generated after `npm run build`)
├── node_modules/              # Dependencies
├── index.html                 # HTML entry point
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── README.md                  # Full documentation
├── QUICKSTART.md              # Quick start guide
└── PROJECT_STRUCTURE.md       # This file
```

## Key Files Explained

### Entry Points
- **`index.html`**: HTML template
- **`src/main.tsx`**: Mounts React app to DOM
- **`src/App.tsx`**: Sets up routing and context provider

### State Management
- **`src/contexts/AppContext.tsx`**: Centralized state management using React Context
  - Manages tournaments, teams, matches, and ads
  - Handles localStorage persistence
  - Provides state update functions

### Type System
- **`src/types/index.ts`**: Complete type definitions
  - `Tournament`: Tournament data structure
  - `Team`: Team and player information
  - `Match`: Match configuration and state
  - `Innings`: Innings data with scoring details
  - `BatsmanStats`, `BowlerStats`: Player statistics
  - `Ball`: Ball-by-ball records
  - `Ad`: Advertisement configuration

### Pages (Routes)

#### `Home.tsx`
- Landing page with navigation menu
- Cards for Tournaments, Teams, Start Match, Scoreboard, Settings

#### `Tournaments.tsx`
- List all tournaments
- Create new tournament with logo upload
- Delete tournaments
- Navigate to tournament details

#### `TournamentDetail.tsx`
- View specific tournament
- Add/delete teams
- Manage team photos
- Add/remove players with roles
- Navigate to match setup

#### `MatchSetup.tsx`
- Configure new match
- Select teams, overs, toss winner
- Initialize match state
- Start scoring

#### `Scoring.tsx`
- Main scoring interface
- Select batsmen and bowlers
- Record runs, wickets, extras
- Auto-calculate statistics
- Manage strike rotation
- Handle innings transitions
- Link to scoreboard display

#### `Scoreboard.tsx`
- TV-optimized display
- Real-time score updates
- Batsman/bowler stats
- Recent balls visualization
- Run rate calculations
- Ad playback integration
- Match completion status

#### `Settings.tsx`
- Manage video advertisements
- Add/enable/disable ads
- Configure ad paths and duration
- Instructions for local video setup

### Utility Functions (`src/utils/helpers.ts`)
- `generateId()`: Create unique IDs
- `calculateStrikeRate()`: Batsman strike rate
- `calculateEconomy()`: Bowler economy rate
- `formatOvers()`: Convert balls to overs.balls format
- `convertImageToBase64()`: Image upload handling
- `getTotalBalls()`: Calculate total balls bowled
- `getCurrentRunRate()`: Current run rate
- `getRequiredRunRate()`: Required run rate (2nd innings)

## Data Flow

### Creating a Tournament
1. User fills form in `Tournaments.tsx`
2. Calls `addTournament()` from context
3. Context updates state and localStorage
4. Tournament appears in list

### Scoring a Ball
1. User clicks run button in `Scoring.tsx`
2. `recordBall()` updates match innings
3. Calculates statistics (SR, economy)
4. Updates batsman/bowler stats
5. Checks for strike rotation
6. Updates match via `updateMatch()` in context
7. Context saves to localStorage
8. `Scoreboard.tsx` reads updated state and re-renders

### Advertisement Display
1. User adds ad in `Settings.tsx`
2. Ad saved to context and localStorage
3. `Scoreboard.tsx` runs timer
4. Every 2 minutes, displays enabled ad
5. Video plays for configured duration
6. Returns to scoreboard

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Custom colors defined in `tailwind.config.js`
- Custom animations for UI feedback

### Design Principles
- Mobile-first responsive design
- Large touch targets for mobile scoring
- High contrast for TV visibility
- Gradient backgrounds for visual appeal
- Card-based layout for organization

## State Persistence

### localStorage Schema
```javascript
{
  "tournaments": "[{Tournament[]}, ...]",
  "currentMatch": "{Match | null}",
  "ads": "[{Ad[]}, ...]"
}
```

### Auto-Save
- All state changes automatically saved
- No manual save button needed
- Data persists across sessions
- Browser-specific (not synced across devices)

## Routing

### Routes
- `/` - Home page
- `/tournaments` - Tournament list
- `/tournament/:id` - Tournament detail
- `/teams` - Alias to tournaments
- `/match-setup` - Match setup (standalone)
- `/match-setup/:tournamentId` - Match setup for tournament
- `/scoring` - Live scoring interface
- `/scoreboard` - TV scoreboard display
- `/settings` - Ad management

### Navigation Pattern
Home → Tournaments → Tournament Detail → Match Setup → Scoring
                                                          ↓
                                                     Scoreboard (new window)

## Build & Deployment

### Development
```bash
npm run dev          # Start dev server
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Deployment Artifacts
- `dist/index.html` - Entry point
- `dist/assets/*.js` - JavaScript bundles
- `dist/assets/*.css` - CSS bundles
- Place video files in `public/ads/` before building

## Technology Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router v6**: Client-side routing
- **Tailwind CSS v3**: Styling
- **Lucide React**: Icon library
- **localStorage**: Data persistence

## Browser Requirements

- Modern browser with ES6+ support
- localStorage enabled
- Video playback support (for ads)
- Recommended: Chrome, Edge, Firefox, Safari

## Performance Considerations

- All calculations done in-memory
- localStorage limited to ~5-10MB
- Large video files may affect load time
- Consider optimizing images/logos
- Ball-by-ball data grows over match duration

## Future Expansion Points

### Where to Add Features

**New Page:**
- Create file in `src/pages/`
- Add route in `src/App.tsx`
- Add navigation link in `Home.tsx`

**New State:**
- Add to `AppContextType` interface
- Add state and functions in `AppProvider`
- Add localStorage persistence

**New Component:**
- Create in `src/components/`
- Import and use in pages

**New Type:**
- Add to `src/types/index.ts`

**New Utility:**
- Add to `src/utils/helpers.ts`

## Development Tips

1. **Hot Module Replacement**: Changes auto-reload in dev mode
2. **TypeScript Errors**: Fix all TS errors before building
3. **localStorage Debugging**: Use browser DevTools > Application > Local Storage
4. **Styling**: Use Tailwind classes, avoid custom CSS when possible
5. **State Updates**: Always use context functions, never mutate state directly

---

This structure provides a solid foundation for a cricket scoring app with room for expansion and customization.
