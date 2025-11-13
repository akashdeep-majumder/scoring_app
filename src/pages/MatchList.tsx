import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, PlayCircle, Trophy, Calendar } from 'lucide-react';

const MatchList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments } = useApp();
  const tournament = tournaments.find(t => t.id === id);

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

  const liveMatches = tournament.matches.filter(m => m.status === 'live');
  const completedMatches = tournament.matches.filter(m => m.status === 'completed');
  const upcomingMatches = tournament.matches.filter(m => m.status === 'not-started');

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
            <h1 className="text-4xl font-bold text-gray-900">Matches</h1>
            <p className="text-gray-600 mt-2">{tournament.name}</p>
          </div>

          <button
            onClick={() => navigate(`/match-setup/${id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Start New Match
          </button>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              Live Matches
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-bold text-gray-900">{match.team1.name}</h3>
                          <span className="text-gray-600">vs</span>
                          <h3 className="text-xl font-bold text-gray-900">{match.team2.name}</h3>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          Live
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.overs} overs • {new Date(match.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/scoring')}
                      className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Completed Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-lg p-6 opacity-90"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{match.team1.name}</h3>
                    <span className="text-gray-600 font-semibold">vs</span>
                    <h3 className="text-lg font-bold text-gray-900">{match.team2.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    {match.overs} overs • {new Date(match.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Upcoming Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{match.team1.name}</h3>
                    <span className="text-gray-600 font-semibold">vs</span>
                    <h3 className="text-lg font-bold text-gray-900">{match.team2.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 text-center mb-4">
                    {match.overs} overs • {new Date(match.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => navigate('/scoring')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Match
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tournament.matches.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <PlayCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600 mb-6">Start your first match to begin tracking scores</p>
            <button
              onClick={() => navigate(`/match-setup/${id}`)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <PlayCircle className="w-5 h-5" />
              Start New Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchList;
