import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { Match, Innings } from '../types';

const MatchSetup: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { tournaments, updateTournament, setCurrentMatch } = useApp();

  const tournament = tournamentId
    ? tournaments.find(t => t.id === tournamentId)
    : tournaments[0];

  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [team1PlayingXI, setTeam1PlayingXI] = useState<string[]>([]);
  const [team2PlayingXI, setTeam2PlayingXI] = useState<string[]>([]);
  const [overs, setOvers] = useState('20');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  if (!tournament || tournament.teams.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xl text-gray-600">
            You need at least 2 teams to start a match.
          </p>
          <button
            onClick={() => navigate('/tournaments')}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg"
          >
            Go to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const togglePlayer = (teamId: string, playerId: string) => {
    const maxPlayers = tournament.playersPerTeam;
    if (teamId === team1Id) {
      setTeam1PlayingXI(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : prev.length < maxPlayers
          ? [...prev, playerId]
          : prev
      );
    } else {
      setTeam2PlayingXI(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : prev.length < maxPlayers
          ? [...prev, playerId]
          : prev
      );
    }
  };

  const handleStartMatch = async () => {
    if (!team1Id || !team2Id || !tossWinner) {
      alert('Please fill all required fields');
      return;
    }

    if (team1Id === team2Id) {
      alert('Please select different teams');
      return;
    }

    const requiredPlayers = tournament.playersPerTeam;
    if (team1PlayingXI.length !== requiredPlayers) {
      alert(`Please select exactly ${requiredPlayers} players for Team 1`);
      return;
    }

    if (team2PlayingXI.length !== requiredPlayers) {
      alert(`Please select exactly ${requiredPlayers} players for Team 2`);
      return;
    }

    const team1 = tournament.teams.find(t => t.id === team1Id)!;
    const team2 = tournament.teams.find(t => t.id === team2Id)!;

    const battingFirstId = tossDecision === 'bat' ? tossWinner : (tossWinner === team1Id ? team2Id : team1Id);

    const emptyInnings: Innings = {
      battingTeamId: battingFirstId,
      bowlingTeamId: battingFirstId === team1Id ? team2Id : team1Id,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 },
      batsmen: [],
      bowlers: [],
      ballByBall: [],
      fallOfWickets: [],
      partnerships: []
    };

    const match: Match = {
      id: generateId(),
      tournamentId: tournament.id,
      team1,
      team2,
      team1PlayingXI,
      team2PlayingXI,
      tossWinner,
      tossDecision,
      battingFirst: battingFirstId,
      overs: parseInt(overs),
      status: 'live',
      currentInnings: 1,
      innings: [emptyInnings],
      createdAt: new Date().toISOString(),
    };

    try {
      await setCurrentMatch(match);

      if (tournament) {
        await updateTournament({
          ...tournament,
          matches: [...tournament.matches, match],
        });
      }

      navigate('/scoring');
    } catch (error) {
      console.error('Failed to start match:', error);
      alert('Failed to start match. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Match Setup
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Tournament
            </label>
            <input
              type="text"
              value={tournament.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Team 1 *
            </label>
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Team 1</option>
              {tournament.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Team 2 *
            </label>
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Team 2</option>
              {tournament.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team 1 Playing XI */}
          {team1Id && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                Team 1 Playing XI * (Select {tournament.playersPerTeam} players)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Selected: {team1PlayingXI.length}/{tournament.playersPerTeam}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tournament.teams
                  .find(t => t.id === team1Id)
                  ?.players.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer(team1Id, player.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        team1PlayingXI.includes(player.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-600">{player.role}</div>
                      {player.jerseyNumber && (
                        <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Team 2 Playing XI */}
          {team2Id && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                Team 2 Playing XI * (Select {tournament.playersPerTeam} players)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Selected: {team2PlayingXI.length}/{tournament.playersPerTeam}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tournament.teams
                  .find(t => t.id === team2Id)
                  ?.players.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer(team2Id, player.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        team2PlayingXI.includes(player.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-600">{player.role}</div>
                      {player.jerseyNumber && (
                        <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Number of Overs *
            </label>
            <input
              type="number"
              value={overs}
              onChange={(e) => setOvers(e.target.value)}
              min="1"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Toss Winner *
            </label>
            <select
              value={tossWinner}
              onChange={(e) => setTossWinner(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Toss Winner</option>
              {team1Id && (
                <option value={team1Id}>
                  {tournament.teams.find(t => t.id === team1Id)?.name}
                </option>
              )}
              {team2Id && (
                <option value={team2Id}>
                  {tournament.teams.find(t => t.id === team2Id)?.name}
                </option>
              )}
            </select>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 mb-2 font-semibold">
              Toss Decision *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="bat"
                  checked={tossDecision === 'bat'}
                  onChange={(e) => setTossDecision(e.target.value as 'bat' | 'bowl')}
                  className="w-4 h-4"
                />
                <span>Bat First</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="bowl"
                  checked={tossDecision === 'bowl'}
                  onChange={(e) => setTossDecision(e.target.value as 'bat' | 'bowl')}
                  className="w-4 h-4"
                />
                <span>Bowl First</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleStartMatch}
            className="w-full bg-green-500 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchSetup;
