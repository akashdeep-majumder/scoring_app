const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

// Initialize database
function initDatabase() {
  try {
    // Import app only when needed (after Electron is ready)
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'cricket-scoring.db');

    console.log('Database path:', dbPath);

    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // Better performance

    createTables();
    console.log('Database initialized successfully');

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create all tables
function createTables() {
  // Tournaments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      status TEXT DEFAULT 'active',
      overs_per_innings INTEGER DEFAULT 20,
      players_per_team INTEGER DEFAULT 11,
      created_at TEXT NOT NULL
    )
  `);

  // Teams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
    )
  `);

  // Players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      jersey_number INTEGER,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    )
  `);

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      team1_id TEXT NOT NULL,
      team2_id TEXT NOT NULL,
      team1_playing_xi TEXT,
      team2_playing_xi TEXT,
      toss_winner TEXT,
      toss_decision TEXT,
      batting_first TEXT,
      overs INTEGER NOT NULL,
      status TEXT NOT NULL,
      current_innings INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      FOREIGN KEY (team1_id) REFERENCES teams (id),
      FOREIGN KEY (team2_id) REFERENCES teams (id)
    )
  `);

  // Innings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS innings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      innings_number INTEGER NOT NULL,
      batting_team_id TEXT NOT NULL,
      bowling_team_id TEXT NOT NULL,
      runs INTEGER NOT NULL DEFAULT 0,
      wickets INTEGER NOT NULL DEFAULT 0,
      overs INTEGER NOT NULL DEFAULT 0,
      balls INTEGER NOT NULL DEFAULT 0,
      extras_wides INTEGER NOT NULL DEFAULT 0,
      extras_no_balls INTEGER NOT NULL DEFAULT 0,
      extras_byes INTEGER NOT NULL DEFAULT 0,
      extras_leg_byes INTEGER NOT NULL DEFAULT 0,
      extras_penalties INTEGER NOT NULL DEFAULT 0,
      is_declared INTEGER NOT NULL DEFAULT 0,
      is_all_out INTEGER NOT NULL DEFAULT 0,
      target_score INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
      FOREIGN KEY (batting_team_id) REFERENCES teams (id),
      FOREIGN KEY (bowling_team_id) REFERENCES teams (id)
    )
  `);

  // Add new columns to existing matches table if they don't exist
  try {
    db.exec(`ALTER TABLE matches ADD COLUMN team1_playing_xi TEXT`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE matches ADD COLUMN team2_playing_xi TEXT`);
  } catch (e) { /* Column already exists */ }

  // Add new columns to existing innings table if they don't exist
  try {
    db.exec(`ALTER TABLE innings ADD COLUMN extras_penalties INTEGER NOT NULL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE innings ADD COLUMN is_declared INTEGER NOT NULL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE innings ADD COLUMN is_all_out INTEGER NOT NULL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE innings ADD COLUMN target_score INTEGER`);
  } catch (e) { /* Column already exists */ }

  // Batsman Stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS batsman_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      innings_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      runs INTEGER NOT NULL DEFAULT 0,
      balls INTEGER NOT NULL DEFAULT 0,
      fours INTEGER NOT NULL DEFAULT 0,
      sixes INTEGER NOT NULL DEFAULT 0,
      is_out INTEGER NOT NULL DEFAULT 0,
      how_out TEXT,
      strike_rate REAL NOT NULL DEFAULT 0,
      is_on_strike INTEGER NOT NULL DEFAULT 0,
      is_retired_hurt INTEGER NOT NULL DEFAULT 0,
      can_return INTEGER NOT NULL DEFAULT 1,
      dismissal_over INTEGER,
      dismissal_ball INTEGER,
      FOREIGN KEY (innings_id) REFERENCES innings (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id)
    )
  `);

  // Add new columns to existing batsman_stats table
  try {
    db.exec(`ALTER TABLE batsman_stats ADD COLUMN is_retired_hurt INTEGER NOT NULL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE batsman_stats ADD COLUMN can_return INTEGER NOT NULL DEFAULT 1`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE batsman_stats ADD COLUMN dismissal_over INTEGER`);
  } catch (e) { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE batsman_stats ADD COLUMN dismissal_ball INTEGER`);
  } catch (e) { /* Column already exists */ }

  // Bowler Stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bowler_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      innings_id INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      overs INTEGER NOT NULL DEFAULT 0,
      maidens INTEGER NOT NULL DEFAULT 0,
      runs INTEGER NOT NULL DEFAULT 0,
      wickets INTEGER NOT NULL DEFAULT 0,
      economy REAL NOT NULL DEFAULT 0,
      balls INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (innings_id) REFERENCES innings (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id)
    )
  `);

  // Balls (Ball-by-ball) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS balls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      innings_id INTEGER NOT NULL,
      over_number INTEGER NOT NULL,
      ball_number INTEGER NOT NULL,
      batsman TEXT NOT NULL,
      bowler TEXT NOT NULL,
      runs INTEGER NOT NULL,
      is_wicket INTEGER NOT NULL DEFAULT 0,
      is_extra INTEGER NOT NULL DEFAULT 0,
      extra_type TEXT,
      wicket_type TEXT,
      out_player TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (innings_id) REFERENCES innings (id) ON DELETE CASCADE
    )
  `);

  // Fall of Wickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fall_of_wickets (
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
      FOREIGN KEY (innings_id) REFERENCES innings (id) ON DELETE CASCADE
    )
  `);

  // Partnerships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS partnerships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      innings_id INTEGER NOT NULL,
      batsman1 TEXT NOT NULL,
      batsman2 TEXT NOT NULL,
      runs INTEGER NOT NULL DEFAULT 0,
      balls INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (innings_id) REFERENCES innings (id) ON DELETE CASCADE
    )
  `);

  // Ads table (tournament-specific)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'video',
      file_path TEXT,
      duration INTEGER DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
    )
  `);

  // Ad chunks table (for chunked video storage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_data TEXT NOT NULL,
      FOREIGN KEY (ad_id) REFERENCES ads (id) ON DELETE CASCADE,
      UNIQUE(ad_id, chunk_index)
    )
  `);

  // Ad display log
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_display_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      ad_id TEXT NOT NULL,
      match_id TEXT,
      displayed_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      FOREIGN KEY (ad_id) REFERENCES ads (id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_innings_match ON innings(match_id);
    CREATE INDEX IF NOT EXISTS idx_batsman_stats_innings ON batsman_stats(innings_id);
    CREATE INDEX IF NOT EXISTS idx_bowler_stats_innings ON bowler_stats(innings_id);
    CREATE INDEX IF NOT EXISTS idx_balls_innings ON balls(innings_id);
    CREATE INDEX IF NOT EXISTS idx_ads_tournament ON ads(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_ad_chunks_ad ON ad_chunks(ad_id);
  `);

  console.log('All tables created successfully');
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Close database
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
