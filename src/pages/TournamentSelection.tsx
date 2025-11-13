import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Trophy, Plus, Settings, Play, Archive } from 'lucide-react';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import type { Tournament } from '../types';

const TournamentSelection: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, addTournament } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [oversPerInnings, setOversPerInnings] = useState(20);
  const [playersPerTeam, setPlayersPerTeam] = useState(11);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertImageToBase64(file);
      setLogo(base64);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTournament: Tournament = {
      id: generateId(),
      name: name.trim(),
      logo,
      status: 'active',
      oversPerInnings,
      playersPerTeam,
      createdAt: new Date().toISOString(),
      teams: [],
      matches: [],
    };

    try {
      await addTournament(newTournament);
      setName('');
      setLogo('');
      setOversPerInnings(20);
      setPlayersPerTeam(11);
      setShowCreateForm(false);
      // Navigate to the new tournament dashboard
      navigate(`/tournament/${newTournament.id}/dashboard`);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      alert('Failed to create tournament. Please try again.');
    }
  };

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Cricket Scoring Pro</h1>
          <p className="text-xl text-gray-600">Select a tournament to get started</p>
        </div>

        {/* Create Tournament Button */}
        {!showCreateForm && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg font-semibold">Create New Tournament</span>
            </button>
          </div>
        )}

        {/* Create Tournament Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Tournament</h2>
            <form onSubmit={handleCreateTournament} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., IPL 2024, Local Champions League"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {logo && (
                  <img src={logo} alt="Logo preview" className="mt-4 w-24 h-24 object-contain rounded-lg border-2 border-gray-200" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overs per Innings
                  </label>
                  <input
                    type="number"
                    value={oversPerInnings}
                    onChange={(e) => setOversPerInnings(parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Players per Team
                  </label>
                  <input
                    type="number"
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
                    min="11"
                    max="16"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Create Tournament
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Play className="w-7 h-7 text-green-600" />
              Active Tournaments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournament/${tournament.id}/dashboard`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    {tournament.logo ? (
                      <img
                        src={tournament.logo}
                        alt={tournament.name}
                        className="w-20 h-20 object-contain mx-auto bg-white rounded-full p-2"
                      />
                    ) : (
                      <Trophy className="w-20 h-20 mx-auto" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                      {tournament.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Teams:</span>
                        <span className="font-semibold text-gray-900">{tournament.teams.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Matches:</span>
                        <span className="font-semibold text-gray-900">{tournament.matches.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Format:</span>
                        <span className="font-semibold text-gray-900">{tournament.oversPerInnings} overs</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-indigo-600 font-semibold">
                      <span>Enter Tournament</span>
                      <Settings className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tournaments */}
        {completedTournaments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Archive className="w-7 h-7 text-gray-600" />
              Completed Tournaments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournament/${tournament.id}/dashboard`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 overflow-hidden opacity-90"
                >
                  <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-6 text-white">
                    {tournament.logo ? (
                      <img
                        src={tournament.logo}
                        alt={tournament.name}
                        className="w-20 h-20 object-contain mx-auto bg-white rounded-full p-2"
                      />
                    ) : (
                      <Trophy className="w-20 h-20 mx-auto" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                      {tournament.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Teams:</span>
                        <span className="font-semibold text-gray-900">{tournament.teams.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Matches:</span>
                        <span className="font-semibold text-gray-900">{tournament.matches.length}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 text-center text-gray-600 font-semibold">
                      View Details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tournaments.length === 0 && !showCreateForm && (
          <div className="text-center py-20">
            <Trophy className="w-32 h-32 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Tournaments Yet</h2>
            <p className="text-xl text-gray-600 mb-8">Create your first tournament to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentSelection;
