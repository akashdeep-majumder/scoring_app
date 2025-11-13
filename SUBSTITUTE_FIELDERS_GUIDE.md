# Substitute & Fielder Tracking - Implementation Guide

## Current Situation

You have a **6-man playing XI** system where:
- Each team selects 6 players before match starts
- Only these 6 players can bat/bowl
- **Problem**: No way to track substitutes or fielders for catches/run-outs

---

## Recommended Solution: **Hybrid Approach**

### Option A: Simple (Recommended for Quick Implementation) ⭐

**How it works:**
1. When wicket type is "caught" or "run out", show fielder selection
2. Display **ALL squad players** (playing XI + subs) for selection
3. Scorer selects fielder name
4. Fielder name stored in ball data and fall of wickets

**Pros:**
- ✅ Quick to implement
- ✅ Easy for scorer (one-click selection)
- ✅ All fielder names recorded for Excel export
- ✅ No lineup management needed

**Cons:**
- ❌ Can't prevent selecting players not on field
- ❌ No "active fielders" tracking

**Implementation:**
```typescript
// In wicket type dialog, after selecting "caught" or "run out":
// 1. Show list of ALL squad players
// 2. Scorer clicks fielder name
// 3. Store fielder name in:
//    - ball.fielderId
//    - fallOfWicket.fielder
```

---

### Option B: Advanced (Better Tracking)

**How it works:**
1. Add "Manage Substitutes" button in scoring page
2. Scorer can swap playing XI players with subs
3. Track `team1ActiveFielders` and `team2ActiveFielders` in match
4. When wicket happens, only show active fielders

**Pros:**
- ✅ Proper tracking of who's on field
- ✅ Prevents selecting players not on field
- ✅ Better match records

**Cons:**
- ❌ More complex to implement
- ❌ Extra steps for scorer
- ❌ Scorer must remember to update lineup

**Implementation:**
```typescript
// 1. Add button: "Manage Subs"
// 2. Show dialog with:
//    - Current fielders (can remove)
//    - Available subs (can add)
// 3. Update match.team1ActiveFielders
// 4. In wicket dialog, filter by activeFielders
```

---

## My Recommendation

**Use Option A (Simple)** because:

1. **Faster Scoring**: Scorer doesn't need to manage lineups mid-match
2. **Less Errors**: No risk of forgetting to update subs
3. **Good Enough**: You still get fielder names for all dismissals
4. **Excel Ready**: Can export lineup + all fielder involvement

### What You Get:
- 6-man playing XI for batsmen/bowlers
- Full squad list for fielder selection on catches/run-outs
- All fielder names recorded in match data
- Easy Excel export with subs/fielders clearly marked

---

## Quick Implementation (Option A)

### Step 1: Update Wicket Type Handler

Currently when you select wicket type, it calls:
```typescript
handleWicketTypeSelection(wicketType)
```

**Change to:**
```typescript
// If wicket type needs fielder (caught, run-out, stumped)
if (['caught', 'run out', 'stumped', 'caught & bowled'].includes(wicketType)) {
  setSelectedWicketType(wicketType);
  setShowFielderSelect(true); // Show fielder selection
} else {
  // Directly record wicket (bowled, lbw, hit wicket, etc.)
  recordBall(pendingWicketRuns, true, undefined, 0, wicketType);
}
```

### Step 2: Add Fielder Selection Dialog

```tsx
{showFielderSelect && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Select Fielder</h2>
      <p className="text-gray-600 mb-4">
        Who took the {selectedWicketType}?
      </p>
      <div className="space-y-2">
        {bowlingTeam.players.map(player => (
          <button
            key={player.id}
            onClick={() => {
              setShowFielderSelect(false);
              recordBall(pendingWicketRuns, true, undefined, 0, selectedWicketType, player.name);
            }}
            className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left"
          >
            <div className="font-semibold">{player.name}</div>
            <div className="text-sm text-gray-600">{player.role}</div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowFielderSelect(false)}
        className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

### Step 3: Update recordBall Function

Add fielder parameter:
```typescript
const recordBall = async (
  runs: number,
  isWicket: boolean = false,
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye',
  extraRuns: number = 0,
  wicketType?: string,
  fielderName?: string  // NEW PARAMETER
) => {
  // ... existing code ...

  if (isWicket) {
    const fallOfWicket: FallOfWicket = {
      wicketNumber: updatedInnings.wickets,
      playerOut: striker.playerName,
      runs: updatedInnings.runs,
      overs: updatedInnings.overs,
      balls: updatedInnings.balls,
      howOut: wicketType || 'caught',
      bowler: currentBowler.playerName,
      fielder: fielderName  // Store fielder name
    };
    // ... rest of code
  }
};
```

---

## Excel Export Format

When exporting match data, you'll have:

### Playing XI Sheet
```
Team 1 Playing XI:
1. Player A (Batsman)
2. Player B (Bowler)
3. Player C (All-rounder)
4. Player D (Wicket-keeper)
5. Player E (Batsman)
6. Player F (Bowler)

Team 2 Playing XI:
1. Player G (Batsman)
2. Player H (Bowler)
... etc
```

### Fall of Wickets Sheet
```
Wicket | Batsman | Runs | Over | How Out        | Bowler   | Fielder (if applicable)
1      | Player A | 15   | 3.2  | caught         | Player H | Player K (sub)
2      | Player B | 28   | 7.4  | run out        | -        | Player L (sub)
3      | Player C | 45   | 12.1 | bowled         | Player G | -
4      | Player D | 62   | 15.3 | caught         | Player H | Player J
```

This way you can clearly see:
- Who was in playing XI
- Which subs took catches/run-outs
- Complete fielding involvement

---

## Testing Steps

1. Create match with 6-man lineups
2. Score normally until wicket
3. Click "OUT" → Select "Caught"
4. **NEW**: Fielder selection dialog appears
5. Select fielder (can be from playing XI or sub)
6. Wicket recorded with fielder name
7. Check scoreboard shows: "Player A c Player K b Player H"

---

## Future Enhancements (If Needed)

1. **Track substitute ins/outs** with timestamps
2. **Show "on field" badge** for active players
3. **Prevent selecting batsmen** as fielders (they're batting!)
4. **Impact player rule** (T20 style substitution)
5. **Concussion substitute** tracking

---

## Summary

**Best Approach**: Option A (Simple)
- Add fielder selection for caught/run-out/stumped
- Show all squad players (playing XI + subs)
- Store fielder name in wicket data
- Export to Excel with all details

**Benefits**:
- ✅ Quick implementation
- ✅ Easy for scorer
- ✅ Complete records
- ✅ Excel export ready
- ✅ No complex lineup management

**You decide**: Do you want Option A (simple) or Option B (advanced tracking)?

Let me know and I'll implement it!
