import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Plus, Trophy, ArrowLeft, Trash2 } from 'lucide-react';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import type { Tournament } from '../types';

const Tournaments: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, addTournament, deleteTournament } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string>('');
  const [playersPerTeam, setPlayersPerTeam] = useState<6 | 8>(6);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertImageToBase64(file);
      setLogo(base64);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tournament: Tournament = {
      id: generateId(),
      name: name.trim(),
      logo,
      status: 'active',
      oversPerInnings: 20,
      playersPerTeam: playersPerTeam,
      createdAt: new Date().toISOString(),
      teams: [],
      matches: [],
    };

    try {
      await addTournament(tournament);
      setName('');
      setLogo('');
      setPlayersPerTeam(6);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add tournament:', error);
      alert('Failed to add tournament. Please try again.');
    }
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Tournaments
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">New Tournament</span>
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tournament name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Tournament Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlayersPerTeam(6)}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        playersPerTeam === 6
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      6v6
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayersPerTeam(8)}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        playersPerTeam === 8
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      8v8
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Select the number of players per team for matches
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Tournament Logo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {logo && (
                    <img
                      src={logo}
                      alt="Tournament logo"
                      className="mt-4 w-32 h-32 object-contain mx-auto"
                    />
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate(`/tournament/${tournament.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                {tournament.logo ? (
                  <img
                    src={tournament.logo}
                    alt={tournament.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-blue-500" />
                  </div>
                )}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this tournament?')) {
                      try {
                        await deleteTournament(tournament.id);
                      } catch (error) {
                        console.error('Failed to delete tournament:', error);
                        alert('Failed to delete tournament. Please try again.');
                      }
                    }
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {tournament.name}
              </h3>
              <div className="text-gray-600 text-sm">
                <p>{tournament.teams.length} Teams</p>
                <p>{tournament.matches.length} Matches</p>
              </div>
            </div>
          ))}
        </div>

        {tournaments.length === 0 && !showForm && (
          <div className="text-center py-20">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No tournaments yet</p>
            <p className="text-gray-400">Create your first tournament to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
