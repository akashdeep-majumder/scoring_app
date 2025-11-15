import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApp } from '../contexts/AppContext';
import {
  ArrowLeft, Users, PlayCircle, Settings, TvMinimal,
  Film, Trophy, BarChart3, Calendar, Edit, Trash2, MoreVertical, Wifi, Copy
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const TournamentDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, deleteTournament } = useApp();
  const tournament = tournaments.find(t => t.id === id);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [serverInfo, _setServerInfo] = useState<{ port: number; localIP: string; isRunning: boolean } | null>(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      // Server info API not implemented yet
      // if (isElectron() && window.electronAPI?.getServerInfo) {
      //   try {
      //     const result = await window.electronAPI.getServerInfo();
      //     if (result.success && result.data) {
      //       setServerInfo(result.data);
      //     }
      //   } catch (error) {
      //     console.error('Failed to fetch server info:', error);
      //   }
      // }
    };

    fetchServerInfo();
  }, []);

  const handleDeleteTournament = async () => {
    try {
      await deleteTournament(id!);
      toast.success('Tournament deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      toast.error('Failed to delete tournament. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard!');
  };

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

  const menuItems = [
    {
      title: 'Teams',
      description: 'Manage teams and players',
      icon: Users,
      color: 'bg-blue-500',
      route: `/tournament/${id}/teams`,
      count: tournament.teams.length,
    },
    {
      title: 'Matches',
      description: 'Start or view matches',
      icon: PlayCircle,
      color: 'bg-green-500',
      route: `/tournament/${id}/matches`,
      count: tournament.matches.length,
    },
    {
      title: 'Scoreboard Display',
      description: 'Open scoreboard window',
      icon: TvMinimal,
      color: 'bg-purple-500',
      route: '/scoreboard',
    },
    {
      title: 'Advertisements',
      description: 'Manage video ads',
      icon: Film,
      color: 'bg-red-500',
      route: `/tournament/${id}/ads`,
    },
    {
      title: 'Settings',
      description: 'Tournament configuration',
      icon: Settings,
      color: 'bg-gray-500',
      route: `/tournament/${id}/settings`,
    },
    {
      title: 'Statistics',
      description: 'View tournament stats',
      icon: BarChart3,
      color: 'bg-indigo-500',
      route: `/tournament/${id}/stats`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tournaments
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-6">
              {tournament.logo ? (
                <img
                  src={tournament.logo}
                  alt={tournament.name}
                  className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-indigo-600" />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(tournament.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {tournament.status}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-6 h-6 text-gray-600" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate(`/tournament/${id}/settings`);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Tournament
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Tournament
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{tournament.teams.length}</div>
                <div className="text-sm text-gray-600 mt-1">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{tournament.matches.length}</div>
                <div className="text-sm text-gray-600 mt-1">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{tournament.oversPerInnings}</div>
                <div className="text-sm text-gray-600 mt-1">Overs/Innings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Info Banner */}
        {serverInfo && serverInfo.isRunning && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Wifi className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Network Scoreboard Active</h3>
                <p className="text-blue-100 text-sm">
                  Connect display devices to view the scoreboard on your local network
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold">Live</span>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-blue-100 text-xs font-semibold mb-2">NETWORK SCOREBOARD URL:</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-black bg-opacity-30 px-4 py-3 rounded-lg font-mono text-lg">
                  http://{serverInfo.localIP}:{serverInfo.port}/network-scoreboard
                </code>
                <button
                  onClick={() => copyToClipboard(`http://${serverInfo.localIP}:${serverInfo.port}/network-scoreboard`)}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-blue-100 text-xs mt-3">
                Open this URL on any device connected to the same network to display the live scoreboard
              </p>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={() => navigate(item.route)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`${item.color} p-4 rounded-xl text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    {item.count !== undefined && (
                      <div className="mt-3 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                        <span className="text-sm font-semibold text-gray-700">{item.count} items</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        {tournament.teams.length >= 2 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Start a Match?</h3>
                <p className="text-green-100">You have {tournament.teams.length} teams ready to play</p>
              </div>
              <button
                onClick={() => navigate(`/match-setup/${id}`)}
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-colors shadow-lg flex items-center gap-3"
              >
                <PlayCircle className="w-6 h-6" />
                Start New Match
              </button>
            </div>
          </div>
        )}

        {/* Setup Prompt */}
        {tournament.teams.length === 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-6">Add teams to your tournament to begin</p>
            <button
              onClick={() => navigate(`/tournament/${id}/teams`)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Add Teams
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTournament}
        title="Delete Tournament"
        message={`Are you sure you want to delete "${tournament.name}"?\n\nThis will permanently delete all teams, matches, and data associated with this tournament. This action cannot be undone.`}
        confirmText="Delete Tournament"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TournamentDashboard;
