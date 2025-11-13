# Integration Guide - Updating Components for Async API

## Overview

The AppContext functions are now **async** (return Promises). You need to update your components to handle this.

---

## Common Patterns

### Pattern 1: Using `await` (Recommended)

```typescript
// Before
const handleAddTournament = () => {
  addTournament(newTournament);
  navigate('/tournaments');
};

// After
const handleAddTournament = async () => {
  try {
    await addTournament(newTournament);
    navigate('/tournaments');
  } catch (error) {
    console.error('Failed to add tournament:', error);
    // Show error to user
  }
};
```

### Pattern 2: Using `.then()`

```typescript
// Before
addTournament(newTournament);
setShowForm(false);

// After
addTournament(newTournament)
  .then(() => {
    setShowForm(false);
  })
  .catch(error => {
    console.error('Failed:', error);
  });
```

### Pattern 3: With Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await updateTournament(tournament);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Component-Specific Updates

### TournamentDetail.tsx

The component needs to call `api.addTeam()` with proper structure:

```typescript
import api from '../utils/api';

// When adding a team
const handleAddTeam = async (teamData) => {
  try {
    const team = {
      id: generateId(),
      tournamentId: tournament.id,  // Important!
      name: teamData.name,
      photo: teamData.photo,
      players: teamData.players.map(p => ({
        id: generateId(),
        teamId: '',  // Will be set by backend
        name: p.name,
        role: p.role,
        jerseyNumber: p.jerseyNumber
      }))
    };

    const result = await api.addTeam(team);
    if (result.success) {
      // Reload tournament data
      await refreshData();
    }
  } catch (error) {
    console.error('Failed to add team:', error);
  }
};
```

### Tournaments.tsx

```typescript
const handleAddTournament = async (e) => {
  e.preventDefault();

  try {
    const tournament = {
      id: generateId(),
      name: tournamentName,
      logo: tournamentLogo,
      createdAt: new Date().toISOString(),
      teams: [],
      matches: []
    };

    await addTournament(tournament);
    setTournamentName('');
    setTournamentLogo('');
    setShowForm(false);
  } catch (error) {
    console.error('Failed to add tournament:', error);
    alert('Failed to add tournament. Please try again.');
  }
};
```

### MatchSetup.tsx

```typescript
const handleStartMatch = async () => {
  try {
    const match = {
      id: generateId(),
      tournamentId: selectedTournament.id,
      team1: selectedTeam1,
      team2: selectedTeam2,
      overs: parseInt(overs),
      tossWinner: tossWinner,
      tossDecision: tossDecision,
      battingFirst: battingFirst,
      status: 'live',
      currentInnings: 1,
      innings: [/* innings data */],
      createdAt: new Date().toISOString()
    };

    await setCurrentMatch(match);
    navigate('/scoring');
  } catch (error) {
    console.error('Failed to start match:', error);
    alert('Failed to start match. Please try again.');
  }
};
```

### Scoring.tsx

```typescript
const handleBallUpdate = async (ballData) => {
  try {
    // Update match state
    const updatedMatch = {
      ...currentMatch,
      innings: updatedInnings
    };

    await updateMatch(updatedMatch);
    // UI will auto-update via state
  } catch (error) {
    console.error('Failed to update match:', error);
    alert('Failed to record ball. Please try again.');
  }
};
```

### Settings.tsx

```typescript
const handleAddAd = async () => {
  try {
    const ad = {
      id: generateId(),
      name: adName,
      videoPath: videoPath,
      duration: parseInt(duration),
      enabled: true
    };

    await addAd(ad);
    setAdName('');
    setVideoPath('');
    setDuration('');
    setShowForm(false);
  } catch (error) {
    console.error('Failed to add ad:', error);
    alert('Failed to add advertisement. Please try again.');
  }
};
```

---

## Error Handling Best Practices

### 1. User-Friendly Error Messages

```typescript
const handleSave = async () => {
  try {
    await updateTournament(tournament);
    toast.success('Tournament updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to update tournament. Please try again.');
  }
};
```

### 2. Validation Before Save

```typescript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate first
  if (!teamName.trim()) {
    alert('Team name is required');
    return;
  }

  if (players.length < 11) {
    alert('Team must have at least 11 players');
    return;
  }

  // Then save
  try {
    await addTeam(teamData);
  } catch (error) {
    alert('Failed to add team: ' + error.message);
  }
};
```

### 3. Optimistic Updates (Optional)

```typescript
// Show update immediately, revert if fails
const handleToggleAd = async (adId) => {
  const ad = ads.find(a => a.id === adId);
  const updatedAd = { ...ad, enabled: !ad.enabled };

  // Update UI immediately
  setAds(ads.map(a => a.id === adId ? updatedAd : a));

  try {
    await updateAd(updatedAd);
  } catch (error) {
    // Revert on error
    setAds(ads);
    alert('Failed to update ad');
  }
};
```

---

## Using the Loading State

The AppContext now provides a `loading` state:

```typescript
const { tournaments, loading, addTournament } = useApp();

if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-4">Loading...</p>
    </div>
  );
}

return (
  <div>
    {tournaments.map(tournament => (
      // Render tournaments
    ))}
  </div>
);
```

---

## Refresh Data Manually

If you need to reload data:

```typescript
const { refreshData } = useApp();

const handleRefresh = async () => {
  try {
    await refreshData();
    toast.success('Data refreshed!');
  } catch (error) {
    toast.error('Failed to refresh data');
  }
};
```

---

## Direct API Access (When Needed)

Sometimes you need to access the API directly (not through context):

```typescript
import api from '../utils/api';

// Get specific tournament
const tournament = await api.getTournament(tournamentId);
if (tournament.success) {
  setTournament(tournament.data);
}

// Add player directly
const result = await api.addPlayer({
  id: generateId(),
  teamId: currentTeamId,
  name: playerName,
  role: playerRole,
  jerseyNumber: jerseyNumber
});
```

---

## TypeScript Tips

### Type the API response

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const result: ApiResponse<Tournament> = await api.getTournament(id);
```

### Handle both modes

```typescript
import { isElectron } from '../utils/api';

if (isElectron()) {
  // Show Electron-specific features
  return <button onClick={handleBackup}>Backup Database</button>;
} else {
  // Show web-specific features
  return <button onClick={handleExportJSON}>Export JSON</button>;
}
```

---

## Testing Your Changes

### 1. Test in Electron mode

```bash
npm run electron:dev
```

### 2. Test in web mode

```bash
npm run dev
# Open http://localhost:5173
```

### 3. Check both work correctly

Both modes should work without errors.

---

## Common Mistakes to Avoid

### ❌ Don't forget `await`

```typescript
// Wrong - will not wait
addTournament(tournament);
navigate('/tournaments');  // Might navigate before save completes

// Right
await addTournament(tournament);
navigate('/tournaments');
```

### ❌ Don't ignore errors

```typescript
// Wrong - silent failure
await addTeam(team).catch(() => {});

// Right - handle errors
try {
  await addTeam(team);
} catch (error) {
  console.error('Failed:', error);
  alert('Failed to add team. Please try again.');
}
```

### ❌ Don't block UI unnecessarily

```typescript
// Wrong - UI freezes
const handleSave = async () => {
  setDisabled(true);
  await save();
  setDisabled(false);
};

// Right - show loading indicator
const handleSave = async () => {
  setLoading(true);
  try {
    await save();
  } finally {
    setLoading(false);
  }
};
```

---

## Quick Checklist

When updating a component:

- [ ] Change handler to `async` function
- [ ] Add `await` before context calls
- [ ] Wrap in `try/catch` block
- [ ] Show loading state (optional)
- [ ] Handle errors gracefully
- [ ] Test in both Electron and web mode

---

## Need Help?

Check these files for reference:
- `src/utils/api.ts` - API implementation
- `src/contexts/AppContext.tsx` - Context with async functions
- `ELECTRON_README.md` - Full Electron documentation
- `MIGRATION_SUMMARY.md` - What changed

---

**Happy coding! 🚀**
