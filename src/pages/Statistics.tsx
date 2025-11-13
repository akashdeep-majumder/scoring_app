import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Trophy, Users, Target, TrendingUp, Award, Star } from 'lucide-react';

const Statistics: React.FC = () => {
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

  // Calculate statistics from completed matches
  const completedMatches = tournament.matches.filter(m => m.status === 'completed');

  // Get all batsmen stats from all completed matches
  const allBatsmen: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number }> = [];
  const allBowlers: Array<{ name: string; wickets: number; runs: number; balls: number; economy: number }> = [];

  completedMatches.forEach(match => {
    match.innings.forEach(innings => {
      innings.batsmen.forEach(batsman => {
        const existing = allBatsmen.find(b => b.name === batsman.playerName);
        if (existing) {
          existing.runs += batsman.runs;
          existing.balls += batsman.balls;
          existing.fours += batsman.fours;
          existing.sixes += batsman.sixes;
          existing.strikeRate = existing.balls > 0 ? (existing.runs / existing.balls) * 100 : 0;
        } else {
          allBatsmen.push({
            name: batsman.playerName,
            runs: batsman.runs,
            balls: batsman.balls,
            fours: batsman.fours,
            sixes: batsman.sixes,
            strikeRate: batsman.strikeRate,
          });
        }
      });

      innings.bowlers.forEach(bowler => {
        const existing = allBowlers.find(b => b.name === bowler.playerName);
        if (existing) {
          existing.wickets += bowler.wickets;
          existing.runs += bowler.runs;
          existing.balls += bowler.balls;
          existing.economy = existing.balls > 0 ? (existing.runs / (existing.balls / 6)) : 0;
        } else {
          allBowlers.push({
            name: bowler.playerName,
            wickets: bowler.wickets,
            runs: bowler.runs,
            balls: bowler.balls,
            economy: bowler.economy,
          });
        }
      });
    });
  });

  // Sort stats
  const topRunScorers = [...allBatsmen].sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topWicketTakers = [...allBowlers].sort((a, b) => b.wickets - a.wickets).slice(0, 10);
  const mostSixes = [...allBatsmen].sort((a, b) => b.sixes - a.sixes).slice(0, 5);
  const mostFours = [...allBatsmen].sort((a, b) => b.fours - a.fours).slice(0, 5);
  const bestStrikeRate = [...allBatsmen].filter(b => b.balls >= 20).sort((a, b) => b.strikeRate - a.strikeRate).slice(0, 5);
  const bestEconomy = [...allBowlers].filter(b => b.balls >= 12).sort((a, b) => a.economy - b.economy).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/tournament/${id}/dashboard`)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Tournament Statistics</h1>
          <p className="text-gray-600 mt-2">{tournament.name}</p>
        </div>

        {completedMatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Statistics Yet</h3>
            <p className="text-gray-600">Complete matches to see tournament statistics</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <Users className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{tournament.teams.length}</div>
                <div className="text-blue-100">Teams</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <Trophy className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{completedMatches.length}</div>
                <div className="text-green-100">Matches Played</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <Target className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{allBatsmen.reduce((sum, b) => sum + b.runs, 0)}</div>
                <div className="text-purple-100">Total Runs</div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <Award className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{allBowlers.reduce((sum, b) => sum + b.wickets, 0)}</div>
                <div className="text-red-100">Total Wickets</div>
              </div>
            </div>

            {/* Best Players Highlight */}
            {topRunScorers.length > 0 && topWicketTakers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best Batsman */}
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="w-10 h-10" />
                      <h2 className="text-2xl font-bold">Best Batsman</h2>
                    </div>
                    <div className="mb-2">
                      <div className="text-4xl font-bold mb-1">{topRunScorers[0].name}</div>
                      <div className="flex items-center gap-4 text-yellow-100">
                        <span className="text-lg">
                          <span className="text-3xl font-bold text-white">{topRunScorers[0].runs}</span> runs
                        </span>
                        <span>•</span>
                        <span>{topRunScorers[0].balls} balls</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white border-opacity-20">
                      <div>
                        <div className="text-yellow-100 text-sm">Strike Rate</div>
                        <div className="text-xl font-bold">{topRunScorers[0].strikeRate.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-yellow-100 text-sm">Boundaries</div>
                        <div className="text-xl font-bold">{topRunScorers[0].fours + topRunScorers[0].sixes}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Bowler */}
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-10 h-10" />
                      <h2 className="text-2xl font-bold">Best Bowler</h2>
                    </div>
                    <div className="mb-2">
                      <div className="text-4xl font-bold mb-1">{topWicketTakers[0].name}</div>
                      <div className="flex items-center gap-4 text-red-100">
                        <span className="text-lg">
                          <span className="text-3xl font-bold text-white">{topWicketTakers[0].wickets}</span> wickets
                        </span>
                        <span>•</span>
                        <span>{topWicketTakers[0].runs} runs</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white border-opacity-20">
                      <div>
                        <div className="text-red-100 text-sm">Economy</div>
                        <div className="text-xl font-bold">{topWicketTakers[0].economy.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-red-100 text-sm">Overs</div>
                        <div className="text-xl font-bold">{(topWicketTakers[0].balls / 6).toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Run Scorers */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Top Run Scorers</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Player</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Runs</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Balls</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">4s</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">6s</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRunScorers.map((batsman, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {index < 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white font-bold">
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-gray-600">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{batsman.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">{batsman.runs}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{batsman.balls}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{batsman.fours}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{batsman.sixes}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{batsman.strikeRate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Wicket Takers */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Award className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Top Wicket Takers</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Player</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Wickets</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Runs</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Overs</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Economy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWicketTakers.map((bowler, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {index < 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-400 text-white font-bold">
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-gray-600">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{bowler.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-red-600">{bowler.wickets}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{bowler.runs}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{(bowler.balls / 6).toFixed(1)}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{bowler.economy.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Sixes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">Most Sixes</h3>
                </div>
                <div className="space-y-3">
                  {mostSixes.map((batsman, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-900">{batsman.name}</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                        {batsman.sixes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Fours */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Most Fours</h3>
                </div>
                <div className="space-y-3">
                  {mostFours.map((batsman, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-900">{batsman.name}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                        {batsman.fours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Strike Rate */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Best Strike Rate</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Minimum 20 balls faced</p>
                <div className="space-y-3">
                  {bestStrikeRate.map((batsman, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-900">{batsman.name}</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                        {batsman.strikeRate.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Economy */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">Best Economy</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Minimum 2 overs bowled</p>
                <div className="space-y-3">
                  {bestEconomy.map((bowler, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-900">{bowler.name}</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold">
                        {bowler.economy.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
