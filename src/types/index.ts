export interface Tournament {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'completed' | 'archived';
  oversPerInnings: number;
  playersPerTeam: number;
  createdAt: string;
  teams: Team[];
  matches: Match[];
}

export interface Team {
  id: string;
  name: string;
  photo?: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  jerseyNumber?: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  team1PlayingXI?: string[]; // Player IDs for team 1 playing 11 (6-man lineup)
  team2PlayingXI?: string[]; // Player IDs for team 2 playing 11 (6-man lineup)
  team1ActiveFielders?: string[]; // Currently on-field players (including subs)
  team2ActiveFielders?: string[]; // Currently on-field players (including subs)
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  battingFirst?: string;
  overs: number;
  status: 'not-started' | 'live' | 'completed';
  currentInnings: 1 | 2;
  innings: Innings[];
  createdAt: string;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: Extras;
  batsmen: BatsmanStats[];
  bowlers: BowlerStats[];
  ballByBall: Ball[];
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  isDeclared?: boolean;
  isAllOut?: boolean;
  targetScore?: number; // For 2nd innings
}

export interface Extras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalties: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  playerOut: string;
  runs: number;
  overs: number;
  balls: number;
  howOut: string;
  fielder?: string;
  bowler?: string;
}

export interface Partnership {
  batsman1: string;
  batsman2: string;
  runs: number;
  balls: number;
  isActive: boolean;
}

export interface BatsmanStats {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  howOut?: string;
  strikeRate: number;
  isOnStrike: boolean;
  isRetiredHurt?: boolean;
  canReturn?: boolean; // Retired hurt can return
  dismissalOver?: number;
  dismissalBall?: number;
}

export interface BowlerStats {
  playerId: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  balls: number;
}

export interface Ball {
  over: number;
  ball: number;
  batsman: string;
  nonStriker: string;
  bowler: string;
  runs: number; // Total runs added to score (for backwards compatibility)
  totalRuns: number; // Total runs added to score (includes penalty + batsman + extras)
  batsmanRuns: number; // Runs credited to batsman only
  extraRuns: number; // Runs from extras (wides/byes/no-ball penalty)
  overthrowRuns: number; // Overthrow runs (added to byes)
  isWicket: boolean;
  isExtra: boolean;
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'penalty';
  wicketType?: 'bowled' | 'caught' | 'lbw' | 'run-out' | 'stumped' | 'hit-wicket' |
               'retired-hurt' | 'retired-out' | 'obstructing' | 'handled-ball' |
               'timed-out' | 'hit-ball-twice';
  outPlayer?: string;
  fielderId?: string; // For caught/run-out (fielder who threw/caught)
  isFreeHit?: boolean;
  isOverthrow?: boolean; // Deprecated - use overthrowRuns instead
  batsmenCrossed?: boolean; // For run-out scenarios
  shortRun?: boolean;
  commentary?: string; // Auto-generated ball description
}

export interface Ad {
  id: string;
  tournamentId: string;
  name: string;
  type: 'video' | 'image';
  filePath?: string;
  duration: number;
  enabled: boolean;
  createdAt: string;
}

export interface AdChunk {
  id: number;
  adId: string;
  chunkIndex: number;
  chunkData: string;
}

export interface AdDisplayLog {
  id: number;
  tournamentId: string;
  adId: string;
  matchId?: string;
  displayedAt: string;
}
