import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Plus, Users, Upload, Download, Trash2, Edit, Check, X, Image } from 'lucide-react';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import type { Team, Player } from '../types';
import * as XLSX from 'xlsx';
import ConfirmDialog from '../components/ConfirmDialog';

const TeamManagement: React.FC = () => {
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
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamPhoto, setEditTeamPhoto] = useState('');

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournament Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Go back to tournaments
          </button>
        </div>
      </div>
    );
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

    // Check for duplicate team name
    const duplicateTeam = tournament.teams.find(
      t => t.name.toLowerCase() === teamName.trim().toLowerCase()
    );
    if (duplicateTeam) {
      toast.error(`A team with the name "${teamName.trim()}" already exists in this tournament.`);
      return;
    }

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
      toast.success('Team added successfully');
    } catch (error) {
      console.error('Failed to add team:', error);
      toast.error('Failed to add team. Please try again.');
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
      setPlayerRole('batsman');
      setShowPlayerForm(null);
      toast.success('Player added successfully');
    } catch (error) {
      console.error('Failed to add player:', error);
      toast.error('Failed to add player. Please try again.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await updateTournament({
        ...tournament,
        teams: tournament.teams.filter(t => t.id !== teamId),
      });
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Failed to delete team. Please try again.');
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
      toast.success('Player deleted successfully');
    } catch (error) {
      console.error('Failed to delete player:', error);
      toast.error('Failed to delete player. Please try again.');
    }
  };

  const startEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamPhoto(team.photo || '');
  };

  const cancelEditTeam = () => {
    setEditingTeamId(null);
    setEditTeamName('');
    setEditTeamPhoto('');
  };

  const handleEditTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertImageToBase64(file);
      setEditTeamPhoto(base64);
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editTeamName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    // Check for duplicate team name (excluding current team)
    const duplicateTeam = tournament.teams.find(
      t => t.id !== teamId && t.name.toLowerCase() === editTeamName.trim().toLowerCase()
    );
    if (duplicateTeam) {
      toast.error(`A team with the name "${editTeamName.trim()}" already exists in this tournament.`);
      return;
    }

    const updatedTeams = tournament.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          name: editTeamName.trim(),
          photo: editTeamPhoto,
        };
      }
      return team;
    });

    try {
      await updateTournament({
        ...tournament,
        teams: updatedTeams,
      });
      toast.success('Team updated successfully');
      cancelEditTeam();
    } catch (error) {
      console.error('Failed to update team:', error);
      toast.error('Failed to update team. Please try again.');
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

      // Check for duplicate team names
      const existingTeamNames = new Set(tournament.teams.map(t => t.name.toLowerCase()));
      const duplicateTeams: string[] = [];
      const newTeams: Team[] = [];

      teamsMap.forEach((players, teamName) => {
        if (existingTeamNames.has(teamName.toLowerCase())) {
          duplicateTeams.push(teamName);
        } else {
          newTeams.push({
            id: generateId(),
            name: teamName,
            players,
          });
        }
      });

      if (duplicateTeams.length > 0) {
        toast.error(`Skipping duplicate teams: ${duplicateTeams.join(', ')}`);
      }

      if (newTeams.length === 0) {
        toast.error('No new teams to import. All teams already exist in this tournament.');
        e.target.value = '';
        return;
      }

      console.log('Updating tournament with new teams...');
      console.log('Existing teams count:', tournament.teams.length);
      console.log('New teams to add:', newTeams.length);
      console.log('New teams:', newTeams.map(t => ({ name: t.name, players: t.players.length })));

      const updatedTournament = {
        ...tournament,
        teams: [...tournament.teams, ...newTeams],
      };
      console.log('Updated tournament teams count:', updatedTournament.teams.length);

      await updateTournament(updatedTournament);
      console.log('Tournament update complete');

      const totalPlayers = newTeams.reduce((sum, team) => sum + team.players.length, 0);
      toast.success(`Successfully imported ${newTeams.length} team(s) with ${totalPlayers} player(s)!`);
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error parsing Excel:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      toast.error(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
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

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams');
    XLSX.writeFile(workbook, 'cricket_teams_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(`/tournament/${id}/dashboard`)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2">{tournament.name}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Template
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowTeamForm(!showTeamForm)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Team
            </button>
          </div>
        </div>

        {/* Add Team Form */}
        {showTeamForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Team</h3>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTeamImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeamForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams List */}
        {tournament.teams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Teams Yet</h3>
            <p className="text-gray-600 mb-6">Add teams manually or import from Excel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tournament.teams.map((team) => (
              <div key={team.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Team Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  {editingTeamId === team.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          {editTeamPhoto ? (
                            <img
                              src={editTeamPhoto}
                              alt="Team logo"
                              className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                              <Users className="w-8 h-8 text-indigo-600" />
                            </div>
                          )}
                          <label className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full cursor-pointer hover:bg-gray-100 shadow-lg">
                            <Image className="w-4 h-4 text-indigo-600" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditTeamImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="w-full px-3 py-2 text-xl font-bold bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                            placeholder="Team name"
                          />
                          <p className="text-indigo-100 mt-1 text-sm">{team.players.length} players</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTeam(team.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditTeam}
                          className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {team.photo ? (
                          <img
                            src={team.photo}
                            alt={team.name}
                            className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                            <Users className="w-8 h-8 text-indigo-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold">{team.name}</h3>
                          <p className="text-indigo-100">{team.players.length} players</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditTeam(team)}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Edit team"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setTeamToDelete(team.id);
                            setShowDeleteTeamConfirm(true);
                          }}
                          className="p-2 hover:bg-red-500 rounded-lg transition-colors"
                          title="Delete team"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Players List */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Players</h4>
                    <button
                      onClick={() => setShowPlayerForm(team.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Player
                    </button>
                  </div>

                  {/* Add Player Form */}
                  {showPlayerForm === team.id && (
                    <form
                      onSubmit={(e) => handleAddPlayer(e, team.id)}
                      className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3"
                    >
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Player name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={playerRole}
                          onChange={(e) => setPlayerRole(e.target.value as Player['role'])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="batsman">Batsman</option>
                          <option value="bowler">Bowler</option>
                          <option value="all-rounder">All-Rounder</option>
                          <option value="wicket-keeper">Wicket-Keeper</option>
                        </select>
                        <input
                          type="number"
                          value={jerseyNumber}
                          onChange={(e) => setJerseyNumber(e.target.value)}
                          placeholder="Jersey #"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlayerForm(null)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Players */}
                  {team.players.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No players yet</p>
                  ) : (
                    <div className="space-y-2">
                      {team.players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {player.jerseyNumber && (
                              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {player.jerseyNumber}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{player.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{player.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePlayer(team.id, player.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Team Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteTeamConfirm}
        onClose={() => {
          setShowDeleteTeamConfirm(false);
          setTeamToDelete(null);
        }}
        onConfirm={() => {
          if (teamToDelete) {
            handleDeleteTeam(teamToDelete);
            setTeamToDelete(null);
          }
        }}
        title="Delete Team"
        message="Are you sure you want to delete this team and all its players? This action cannot be undone."
        confirmText="Delete Team"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TeamManagement;
