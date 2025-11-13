const { getDatabase } = require('./database');

// ==================== TOURNAMENT OPERATIONS ====================

function getAllTournaments() {
  const db = getDatabase();
  const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all();

  // Get teams for each tournament and convert snake_case to camelCase
  return tournaments.map(tournament => ({
    id: tournament.id,
    name: tournament.name,
    logo: tournament.logo,
    status: tournament.status || 'active',
    oversPerInnings: tournament.overs_per_innings || 20,
    playersPerTeam: tournament.players_per_team || 11,
    createdAt: tournament.created_at,
    teams: getTeamsByTournament(tournament.id),
    matches: getMatchesByTournament(tournament.id)
  }));
}

function getTournamentById(id) {
  const db = getDatabase();
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);

  if (!tournament) {
    return null;
  }

  // Convert snake_case to camelCase
  return {
    id: tournament.id,
    name: tournament.name,
    logo: tournament.logo,
    status: tournament.status || 'active',
    oversPerInnings: tournament.overs_per_innings || 20,
    playersPerTeam: tournament.players_per_team || 11,
    createdAt: tournament.created_at,
    teams: getTeamsByTournament(id),
    matches: getMatchesByTournament(id)
  };
}

function addTournament(tournament) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO tournaments (id, name, logo, status, overs_per_innings, players_per_team, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    tournament.id,
    tournament.name,
    tournament.logo || null,
    tournament.status || 'active',
    tournament.oversPerInnings || 20,
    tournament.playersPerTeam || 11,
    tournament.createdAt
  );
  return tournament;
}

function updateTournament(id, updates) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE tournaments
    SET name = ?, logo = ?, status = ?, overs_per_innings = ?, players_per_team = ?
    WHERE id = ?
  `);

  stmt.run(
    updates.name,
    updates.logo || null,
    updates.status || 'active',
    updates.oversPerInnings || 20,
    updates.playersPerTeam || 11,
    id
  );

  // Handle teams if provided
  if (updates.teams) {
    // Get existing team IDs
    const existingTeamIds = new Set(
      db.prepare('SELECT id FROM teams WHERE tournament_id = ?').all(id).map(t => t.id)
    );

    // Track which teams are in the update
    const updatedTeamIds = new Set();

    updates.teams.forEach(team => {
      updatedTeamIds.add(team.id);

      if (existingTeamIds.has(team.id)) {
        // Update existing team
        updateTeam(team.id, team);
      } else {
        // Add new team
        addTeam({ ...team, tournamentId: id });
      }
    });

    // Delete teams that are no longer in the tournament
    existingTeamIds.forEach(teamId => {
      if (!updatedTeamIds.has(teamId)) {
        deleteTeam(teamId);
      }
    });
  }

  return getTournamentById(id);
}

function deleteTournament(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tournaments WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

// ==================== TEAM OPERATIONS ====================

function getTeamsByTournament(tournamentId) {
  const db = getDatabase();
  const teams = db.prepare('SELECT * FROM teams WHERE tournament_id = ?').all(tournamentId);

  return teams.map(team => ({
    ...team,
    players: getPlayersByTeam(team.id)
  }));
}

function getTeamById(id) {
  const db = getDatabase();
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);

  if (team) {
    team.players = getPlayersByTeam(id);
  }

  return team;
}

function addTeam(team) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO teams (id, tournament_id, name, photo)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(team.id, team.tournamentId, team.name, team.photo || null);

  // Add players if provided
  if (team.players && team.players.length > 0) {
    team.players.forEach(player => {
      addPlayer({ ...player, teamId: team.id });
    });
  }

  return getTeamById(team.id);
}

function updateTeam(id, updates) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE teams SET name = ?, photo = ? WHERE id = ?
  `);

  stmt.run(updates.name, updates.photo || null, id);

  // Handle players if provided
  if (updates.players) {
    // Get existing player IDs
    const existingPlayerIds = new Set(
      db.prepare('SELECT id FROM players WHERE team_id = ?').all(id).map(p => p.id)
    );

    // Track which players are in the update
    const updatedPlayerIds = new Set();

    updates.players.forEach(player => {
      updatedPlayerIds.add(player.id);

      if (existingPlayerIds.has(player.id)) {
        // Update existing player
        updatePlayer(player.id, player);
      } else {
        // Add new player
        addPlayer({ ...player, teamId: id });
      }
    });

    // Delete players that are no longer in the team
    existingPlayerIds.forEach(playerId => {
      if (!updatedPlayerIds.has(playerId)) {
        deletePlayer(playerId);
      }
    });
  }

  return getTeamById(id);
}

function deleteTeam(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM teams WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

// ==================== PLAYER OPERATIONS ====================

function getPlayersByTeam(teamId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM players WHERE team_id = ?').all(teamId);
}

function getPlayerById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

function addPlayer(player) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO players (id, team_id, name, role, jersey_number)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(player.id, player.teamId, player.name, player.role, player.jerseyNumber || null);
  return player;
}

function updatePlayer(id, updates) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE players SET name = ?, role = ?, jersey_number = ? WHERE id = ?
  `);

  stmt.run(updates.name, updates.role, updates.jerseyNumber || null, id);
  return getPlayerById(id);
}

function deletePlayer(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM players WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

// ==================== MATCH OPERATIONS ====================

function getMatchesByTournament(tournamentId) {
  const db = getDatabase();
  const matches = db.prepare('SELECT * FROM matches WHERE tournament_id = ? ORDER BY created_at DESC').all(tournamentId);

  return matches.map(match => {
    const team1 = getTeamById(match.team1_id);
    const team2 = getTeamById(match.team2_id);
    const innings = getInningsByMatch(match.id);

    return {
      id: match.id,
      tournamentId: match.tournament_id,
      team1,
      team2,
      tossWinner: match.toss_winner,
      tossDecision: match.toss_decision,
      battingFirst: match.batting_first,
      overs: match.overs,
      status: match.status,
      currentInnings: match.current_innings,
      innings,
      createdAt: match.created_at
    };
  });
}

function getCurrentMatch() {
  const db = getDatabase();
  const match = db.prepare("SELECT * FROM matches WHERE status = 'live' ORDER BY created_at DESC LIMIT 1").get();

  if (!match) return null;

  const team1 = getTeamById(match.team1_id);
  const team2 = getTeamById(match.team2_id);
  const innings = getInningsByMatch(match.id);

  return {
    id: match.id,
    tournamentId: match.tournament_id,
    team1,
    team2,
    tossWinner: match.toss_winner,
    tossDecision: match.toss_decision,
    battingFirst: match.batting_first,
    overs: match.overs,
    status: match.status,
    currentInnings: match.current_innings,
    innings,
    createdAt: match.created_at
  };
}

function addMatch(match) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO matches (id, tournament_id, team1_id, team2_id, toss_winner, toss_decision, batting_first, overs, status, current_innings, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    match.id,
    match.tournamentId,
    match.team1.id,
    match.team2.id,
    match.tossWinner || null,
    match.tossDecision || null,
    match.battingFirst || null,
    match.overs,
    match.status,
    match.currentInnings,
    match.createdAt
  );

  // Create innings if provided
  if (match.innings && match.innings.length > 0) {
    match.innings.forEach((innings, index) => {
      addInnings(match.id, index + 1, innings);
    });
  }

  return getCurrentMatch();
}

function updateMatch(matchData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE matches
    SET status = ?, current_innings = ?, toss_winner = ?, toss_decision = ?, batting_first = ?
    WHERE id = ?
  `);

  stmt.run(
    matchData.status,
    matchData.currentInnings,
    matchData.tossWinner || null,
    matchData.tossDecision || null,
    matchData.battingFirst || null,
    matchData.id
  );

  // Update innings
  if (matchData.innings && matchData.innings.length > 0) {
    matchData.innings.forEach((innings, index) => {
      updateInnings(matchData.id, index + 1, innings);
    });
  }

  return getCurrentMatch();
}

function deleteMatch(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM matches WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

// ==================== INNINGS OPERATIONS ====================

function getInningsByMatch(matchId) {
  const db = getDatabase();
  const inningsData = db.prepare('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number').all(matchId);

  return inningsData.map(innings => {
    const batsmanStats = getBatsmanStatsByInnings(innings.id);
    const bowlerStats = getBowlerStatsByInnings(innings.id);
    const ballByBall = getBallsByInnings(innings.id);
    const fallOfWickets = getFallOfWicketsByInnings(innings.id);
    const partnerships = getPartnershipsByInnings(innings.id);

    return {
      battingTeamId: innings.batting_team_id,
      bowlingTeamId: innings.bowling_team_id,
      runs: innings.runs,
      wickets: innings.wickets,
      overs: innings.overs,
      balls: innings.balls,
      extras: {
        wides: innings.extras_wides,
        noBalls: innings.extras_no_balls,
        byes: innings.extras_byes,
        legByes: innings.extras_leg_byes,
        penalties: innings.extras_penalties || 0
      },
      batsmen: batsmanStats,
      bowlers: bowlerStats,
      ballByBall: ballByBall,
      fallOfWickets: fallOfWickets,
      partnerships: partnerships,
      isDeclared: innings.is_declared === 1,
      isAllOut: innings.is_all_out === 1,
      targetScore: innings.target_score
    };
  });
}

function addInnings(matchId, inningsNumber, innings) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id, runs, wickets, overs, balls,
                         extras_wides, extras_no_balls, extras_byes, extras_leg_byes, extras_penalties,
                         is_declared, is_all_out, target_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    matchId,
    inningsNumber,
    innings.battingTeamId,
    innings.bowlingTeamId,
    innings.runs || 0,
    innings.wickets || 0,
    innings.overs || 0,
    innings.balls || 0,
    innings.extras?.wides || 0,
    innings.extras?.noBalls || 0,
    innings.extras?.byes || 0,
    innings.extras?.legByes || 0,
    innings.extras?.penalties || 0,
    innings.isDeclared ? 1 : 0,
    innings.isAllOut ? 1 : 0,
    innings.targetScore || null
  );

  const inningsId = result.lastInsertRowid;

  // Add batsman stats
  if (innings.batsmen) {
    innings.batsmen.forEach(batsman => {
      addBatsmanStats(inningsId, batsman);
    });
  }

  // Add bowler stats
  if (innings.bowlers) {
    innings.bowlers.forEach(bowler => {
      addBowlerStats(inningsId, bowler);
    });
  }

  // Add ball-by-ball data
  if (innings.ballByBall) {
    innings.ballByBall.forEach(ball => {
      addBall(inningsId, ball);
    });
  }

  // Add fall of wickets
  if (innings.fallOfWickets) {
    innings.fallOfWickets.forEach(fow => {
      addFallOfWicket(inningsId, fow);
    });
  }

  // Add partnerships
  if (innings.partnerships) {
    innings.partnerships.forEach(partnership => {
      addPartnership(inningsId, partnership);
    });
  }

  return inningsId;
}

function updateInnings(matchId, inningsNumber, innings) {
  const db = getDatabase();

  // Get innings ID
  const inningsRecord = db.prepare('SELECT id FROM innings WHERE match_id = ? AND innings_number = ?').get(matchId, inningsNumber);

  if (!inningsRecord) {
    return addInnings(matchId, inningsNumber, innings);
  }

  const inningsId = inningsRecord.id;

  // Update innings
  const stmt = db.prepare(`
    UPDATE innings
    SET runs = ?, wickets = ?, overs = ?, balls = ?,
        extras_wides = ?, extras_no_balls = ?, extras_byes = ?, extras_leg_byes = ?, extras_penalties = ?,
        is_declared = ?, is_all_out = ?, target_score = ?
    WHERE id = ?
  `);

  stmt.run(
    innings.runs || 0,
    innings.wickets || 0,
    innings.overs || 0,
    innings.balls || 0,
    innings.extras?.wides || 0,
    innings.extras?.noBalls || 0,
    innings.extras?.byes || 0,
    innings.extras?.legByes || 0,
    innings.extras?.penalties || 0,
    innings.isDeclared ? 1 : 0,
    innings.isAllOut ? 1 : 0,
    innings.targetScore || null,
    inningsId
  );

  // Delete old stats and balls
  db.prepare('DELETE FROM batsman_stats WHERE innings_id = ?').run(inningsId);
  db.prepare('DELETE FROM bowler_stats WHERE innings_id = ?').run(inningsId);
  db.prepare('DELETE FROM balls WHERE innings_id = ?').run(inningsId);
  db.prepare('DELETE FROM fall_of_wickets WHERE innings_id = ?').run(inningsId);
  db.prepare('DELETE FROM partnerships WHERE innings_id = ?').run(inningsId);

  // Add new stats
  if (innings.batsmen) {
    innings.batsmen.forEach(batsman => {
      addBatsmanStats(inningsId, batsman);
    });
  }

  if (innings.bowlers) {
    innings.bowlers.forEach(bowler => {
      addBowlerStats(inningsId, bowler);
    });
  }

  if (innings.ballByBall) {
    innings.ballByBall.forEach(ball => {
      addBall(inningsId, ball);
    });
  }

  if (innings.fallOfWickets) {
    innings.fallOfWickets.forEach(fow => {
      addFallOfWicket(inningsId, fow);
    });
  }

  if (innings.partnerships) {
    innings.partnerships.forEach(partnership => {
      addPartnership(inningsId, partnership);
    });
  }

  return inningsId;
}

// ==================== BATSMAN STATS OPERATIONS ====================

function getBatsmanStatsByInnings(inningsId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM batsman_stats WHERE innings_id = ?').all(inningsId).map(row => ({
    playerId: row.player_id,
    playerName: row.player_name,
    runs: row.runs,
    balls: row.balls,
    fours: row.fours,
    sixes: row.sixes,
    isOut: row.is_out === 1,
    howOut: row.how_out,
    strikeRate: row.strike_rate,
    isOnStrike: row.is_on_strike === 1,
    isRetiredHurt: row.is_retired_hurt === 1,
    canReturn: row.can_return === 1,
    dismissalOver: row.dismissal_over,
    dismissalBall: row.dismissal_ball
  }));
}

function addBatsmanStats(inningsId, batsman) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO batsman_stats (innings_id, player_id, player_name, runs, balls, fours, sixes, is_out, how_out, strike_rate, is_on_strike,
                                is_retired_hurt, can_return, dismissal_over, dismissal_ball)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    inningsId,
    batsman.playerId,
    batsman.playerName,
    batsman.runs || 0,
    batsman.balls || 0,
    batsman.fours || 0,
    batsman.sixes || 0,
    batsman.isOut ? 1 : 0,
    batsman.howOut || null,
    batsman.strikeRate || 0,
    batsman.isOnStrike ? 1 : 0,
    batsman.isRetiredHurt ? 1 : 0,
    batsman.canReturn !== false ? 1 : 0,
    batsman.dismissalOver || null,
    batsman.dismissalBall || null
  );
}

// ==================== BOWLER STATS OPERATIONS ====================

function getBowlerStatsByInnings(inningsId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM bowler_stats WHERE innings_id = ?').all(inningsId).map(row => ({
    playerId: row.player_id,
    playerName: row.player_name,
    overs: row.overs,
    maidens: row.maidens,
    runs: row.runs,
    wickets: row.wickets,
    economy: row.economy,
    balls: row.balls
  }));
}

function addBowlerStats(inningsId, bowler) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO bowler_stats (innings_id, player_id, player_name, overs, maidens, runs, wickets, economy, balls)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    inningsId,
    bowler.playerId,
    bowler.playerName,
    bowler.overs || 0,
    bowler.maidens || 0,
    bowler.runs || 0,
    bowler.wickets || 0,
    bowler.economy || 0,
    bowler.balls || 0
  );
}

// ==================== BALL-BY-BALL OPERATIONS ====================

function getBallsByInnings(inningsId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM balls WHERE innings_id = ? ORDER BY id').all(inningsId).map(row => ({
    over: row.over_number,
    ball: row.ball_number,
    batsman: row.batsman,
    bowler: row.bowler,
    runs: row.runs,
    isWicket: row.is_wicket === 1,
    isExtra: row.is_extra === 1,
    extraType: row.extra_type,
    wicketType: row.wicket_type,
    outPlayer: row.out_player
  }));
}

function addBall(inningsId, ball) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO balls (innings_id, over_number, ball_number, batsman, bowler, runs, is_wicket, is_extra, extra_type, wicket_type, out_player, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(
    inningsId,
    ball.over,
    ball.ball,
    ball.batsman,
    ball.bowler,
    ball.runs,
    ball.isWicket ? 1 : 0,
    ball.isExtra ? 1 : 0,
    ball.extraType || null,
    ball.wicketType || null,
    ball.outPlayer || null
  );
}

// ==================== FALL OF WICKETS OPERATIONS ====================

function getFallOfWicketsByInnings(inningsId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM fall_of_wickets WHERE innings_id = ? ORDER BY wicket_number').all(inningsId).map(row => ({
    wicketNumber: row.wicket_number,
    playerOut: row.player_out,
    runs: row.runs,
    overs: row.overs,
    balls: row.balls,
    howOut: row.how_out,
    fielder: row.fielder,
    bowler: row.bowler
  }));
}

function addFallOfWicket(inningsId, fow) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO fall_of_wickets (innings_id, wicket_number, player_out, runs, overs, balls, how_out, fielder, bowler)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    inningsId,
    fow.wicketNumber,
    fow.playerOut,
    fow.runs,
    fow.overs,
    fow.balls,
    fow.howOut,
    fow.fielder || null,
    fow.bowler || null
  );
}

// ==================== PARTNERSHIPS OPERATIONS ====================

function getPartnershipsByInnings(inningsId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM partnerships WHERE innings_id = ? ORDER BY id').all(inningsId).map(row => ({
    batsman1: row.batsman1,
    batsman2: row.batsman2,
    runs: row.runs,
    balls: row.balls,
    isActive: row.is_active === 1
  }));
}

function addPartnership(inningsId, partnership) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO partnerships (innings_id, batsman1, batsman2, runs, balls, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    inningsId,
    partnership.batsman1,
    partnership.batsman2,
    partnership.runs || 0,
    partnership.balls || 0,
    partnership.isActive ? 1 : 0
  );
}

function updatePartnership(inningsId, batsman1, batsman2, runs, balls, isActive) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE partnerships
    SET runs = ?, balls = ?, is_active = ?
    WHERE innings_id = ? AND batsman1 = ? AND batsman2 = ?
  `);

  stmt.run(runs, balls, isActive ? 1 : 0, inningsId, batsman1, batsman2);
}

// ==================== AD OPERATIONS ====================

function getAllAds() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ads').all().map(row => ({
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    type: row.type || 'video',
    filePath: row.file_path,
    duration: row.duration,
    enabled: row.enabled === 1,
    createdAt: row.created_at
  }));
}

function addAd(ad) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO ads (id, tournament_id, name, type, file_path, duration, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    ad.id,
    ad.tournamentId,
    ad.name,
    ad.type || 'video',
    ad.filePath,
    ad.duration,
    ad.enabled ? 1 : 0,
    ad.createdAt
  );
  return ad;
}

function updateAd(id, updates) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE ads
    SET name = ?, type = ?, file_path = ?, duration = ?, enabled = ?
    WHERE id = ?
  `);

  stmt.run(
    updates.name,
    updates.type || 'video',
    updates.filePath,
    updates.duration,
    updates.enabled ? 1 : 0,
    id
  );
  return getAllAds().find(ad => ad.id === id);
}

function deleteAd(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM ads WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

module.exports = {
  // Tournament operations
  getAllTournaments,
  getTournamentById,
  addTournament,
  updateTournament,
  deleteTournament,

  // Team operations
  getTeamsByTournament,
  getTeamById,
  addTeam,
  updateTeam,
  deleteTeam,

  // Player operations
  getPlayersByTeam,
  getPlayerById,
  addPlayer,
  updatePlayer,
  deletePlayer,

  // Match operations
  getMatchesByTournament,
  getCurrentMatch,
  addMatch,
  updateMatch,
  deleteMatch,

  // Fall of wickets operations
  getFallOfWicketsByInnings,
  addFallOfWicket,

  // Partnership operations
  getPartnershipsByInnings,
  addPartnership,
  updatePartnership,

  // Ad operations
  getAllAds,
  addAd,
  updateAd,
  deleteAd
};
