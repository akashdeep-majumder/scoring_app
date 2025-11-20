import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Plus, Users, PlayCircle, Trash2, Upload, Download } from 'lucide-react';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import type { Team, Player } from '../types';
import * as XLSX from 'xlsx';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, updateTournament } = useApp();
  const tournament = tournaments.find(t => t.id === id);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamPhoto, setTeamPhoto] = useState('');
  const [showPlayerForm, setShowPlayerForm] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<Player['role']>('batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertImageToBase64(file);
      setTeamPhoto(base64);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const newTeam: Team = {
      id: generateId(),
      name: teamName.trim(),
      photo: teamPhoto,
      players: [],
    };

    try {
      await updateTournament({
        ...tournament,
        teams: [...tournament.teams, newTeam],
      });

      setTeamName('');
      setTeamPhoto('');
      setShowTeamForm(false);
    } catch (error) {
      console.error('Failed to add team:', error);
      alert('Failed to add team. Please try again.');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newPlayer: Player = {
      id: generateId(),
      name: playerName.trim(),
      role: playerRole,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
    };

    const updatedTeams = tournament.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          players: [...team.players, newPlayer],
        };
      }
      return team;
    });

    try {
      await updateTournament({
        ...tournament,
        teams: updatedTeams,
      });

      setPlayerName('');
      setJerseyNumber('');
      setShowPlayerForm(null);
    } catch (error) {
      console.error('Failed to add player:', error);
      alert('Failed to add player. Please try again.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Delete this team?')) {
      try {
        await updateTournament({
          ...tournament,
          teams: tournament.teams.filter(t => t.id !== teamId),
        });
      } catch (error) {
        console.error('Failed to delete team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  const handleDeletePlayer = async (teamId: string, playerId: string) => {
    const updatedTeams = tournament.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.filter(p => p.id !== playerId),
        };
      }
      return team;
    });

    try {
      await updateTournament({
        ...tournament,
        teams: updatedTeams,
      });
    } catch (error) {
      console.error('Failed to delete player:', error);
      alert('Failed to delete player. Please try again.');
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Excel file selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    try {
      console.log('Reading file as array buffer...');
      const data = await file.arrayBuffer();
      console.log('Array buffer size:', data.byteLength);

      console.log('Parsing with XLSX...');
      const workbook = XLSX.read(data);
      console.log('Workbook sheets:', workbook.SheetNames);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Parsed rows:', jsonData.length);

      // Expected format: TeamName, PlayerName, Role, JerseyNumber
      const teamsMap = new Map<string, Player[]>();

      jsonData.forEach((row: any) => {
        const teamName = row['Team Name'] || row['TeamName'] || row['team_name'];
        const playerName = row['Player Name'] || row['PlayerName'] || row['player_name'];
        const role = (row['Role'] || row['role'] || 'batsman').toLowerCase();
        const jerseyNumber = row['Jersey Number'] || row['JerseyNumber'] || row['jersey_number'];

        if (!teamName || !playerName) return;

        const player: Player = {
          id: generateId(),
          name: playerName,
          role: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'].includes(role)
            ? role as Player['role']
            : 'batsman',
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
        };

        if (!teamsMap.has(teamName)) {
          teamsMap.set(teamName, []);
        }
        teamsMap.get(teamName)?.push(player);
      });

      // Create teams
      const newTeams: Team[] = [];
      teamsMap.forEach((players, teamName) => {
        newTeams.push({
          id: generateId(),
          name: teamName,
          players,
        });
      });

      await updateTournament({
        ...tournament,
        teams: [...tournament.teams, ...newTeams],
      });

      alert(`Successfully imported ${newTeams.length} team(s) with ${jsonData.length} player(s)!`);
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error parsing Excel:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
      e.target.value = ''; // Reset file input
    }
  };

  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      { 'Team Name': 'Mumbai Indians', 'Player Name': 'Rohit Sharma', 'Role': 'batsman', 'Jersey Number': 45 },
      { 'Team Name': 'Mumbai Indians', 'Player Name': 'Jasprit Bumrah', 'Role': 'bowler', 'Jersey Number': 93 },
      { 'Team Name': 'Chennai Super Kings', 'Player Name': 'MS Dhoni', 'Role': 'wicket-keeper', 'Jersey Number': 7 },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teams');
    XLSX.writeFile(wb, 'cricket_teams_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              {tournament.logo && (
                <img src={tournament.logo} alt={tournament.name} className="w-16 h-16 object-contain" />
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                {tournament.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              title="Download Excel Template"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">Template</span>
            </button>
            <label className="flex items-center gap-2 bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="hidden md:inline">Import Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowTeamForm(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Add Team</span>
            </button>
          </div>
        </div>

        {/* Excel Upload Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Excel Import Instructions:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
            <li>Click "Template" to download a sample Excel file</li>
            <li>Fill in your teams and players in the Excel file</li>
            <li>Required columns: Team Name, Player Name, Role, Jersey Number</li>
            <li>Valid roles: batsman, bowler, all-rounder, wicket-keeper</li>
            <li>Click "Import Excel" to upload your file</li>
          </ul>
        </div>

        {showTeamForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Add Team</h2>
              <form onSubmit={handleAddTeam}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-semibold">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-semibold">Team Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTeamImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {teamPhoto && (
                    <img src={teamPhoto} alt="Team" className="mt-4 w-32 h-32 object-contain mx-auto" />
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowTeamForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Add Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournament.teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {team.photo ? (
                    <img src={team.photo} alt={team.name} className="w-16 h-16 object-contain rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
                </div>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700">Players ({team.players.length})</h4>
                  <button
                    onClick={() => setShowPlayerForm(team.id)}
                    className="text-sm text-green-500 hover:text-green-600"
                  >
                    + Add Player
                  </button>
                </div>

                {showPlayerForm === team.id && (
                  <form onSubmit={(e) => handleAddPlayer(e, team.id)} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Player name"
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                      required
                    />
                    <select
                      value={playerRole}
                      onChange={(e) => setPlayerRole(e.target.value as Player['role'])}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                    >
                      <option value="batsman">Batsman</option>
                      <option value="bowler">Bowler</option>
                      <option value="all-rounder">All-Rounder</option>
                      <option value="wicket-keeper">Wicket Keeper</option>
                    </select>
                    <input
                      type="number"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="Jersey number (optional)"
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPlayerForm(null)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {team.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {player.jerseyNumber && `#${player.jerseyNumber} `}
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{player.role}</p>
                      </div>
                      <button
                        onClick={() => handleDeletePlayer(team.id, player.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {tournament.teams.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No teams yet</p>
            <p className="text-gray-400">Add teams to start organizing matches</p>
          </div>
        )}

        {tournament.teams.length >= 2 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/match-setup/${tournament.id}`)}
              className="inline-flex items-center gap-2 bg-red-500 text-white px-8 py-4 rounded-lg hover:bg-red-600 transition-colors text-lg font-semibold"
            >
              <PlayCircle className="w-6 h-6" />
              Start a Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
