import React from 'react';
import type { Innings, Team, Match } from '../types';
import { formatOvers, getTotalBalls } from '../utils/helpers';
import { TrendingUp, Target, Award } from 'lucide-react';

interface InningsSummaryProps {
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
  match: Match;
  inningsNumber: 1 | 2;
}

const InningsSummary: React.FC<InningsSummaryProps> = ({
  innings,
  battingTeam,
  bowlingTeam,
  match,
  inningsNumber
}) => {
  // Find best batsman (highest runs)
  const bestBatsman = [...innings.batsmen]
    .filter(b => b.balls > 0)
    .sort((a, b) => b.runs - a.runs)[0];

  // Find best bowler (best bowling figures)
  const bestBowler = [...innings.bowlers]
    .filter(b => b.balls > 0)
    .sort((a, b) => {
      // Sort by wickets first, then by economy
      if (b.wickets !== a.wickets) return b.wickets - a.wickets;
      return a.economy - b.economy;
    })[0];

  const totalBalls = getTotalBalls(innings.overs, innings.balls);
  const runRate = totalBalls > 0 ? ((innings.runs / totalBalls) * 6).toFixed(2) : '0.00';

  // Get total extras
  const totalExtras = innings.extras.wides + innings.extras.noBalls +
    innings.extras.byes + innings.extras.legByes + (innings.extras.penalties || 0);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-xl p-6 mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {inningsNumber === 1 ? '1st' : '2nd'} Innings Summary
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{battingTeam.name}</p>
            <p className="text-5xl font-bold mt-2">
              {innings.runs}/{innings.wickets}
            </p>
            <p className="text-xl opacity-90">({formatOvers(totalBalls)} overs)</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xl">Run Rate: {runRate}</span>
            </div>
            {inningsNumber === 2 && match.innings[0] && (
              <div className="flex items-center gap-2 justify-end">
                <Target className="w-5 h-5" />
                <span className="text-xl">
                  Target: {match.innings[0].runs + 1}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Best Batsman */}
        {bestBatsman && (
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">Best Batsman</h3>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-gray-900">{bestBatsman.playerName}</p>
                <p className="text-sm text-gray-600">
                  {bestBatsman.isOut ? bestBatsman.howOut : 'Not Out'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{bestBatsman.runs}</p>
                <p className="text-sm text-gray-600">
                  ({bestBatsman.balls}) • SR: {bestBatsman.strikeRate.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {bestBatsman.fours}×4 • {bestBatsman.sixes}×6
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Best Bowler */}
        {bestBowler && (
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">Best Bowler</h3>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-gray-900">{bestBowler.playerName}</p>
                <p className="text-sm text-gray-600">{bowlingTeam.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {bestBowler.wickets}/{bestBowler.runs}
                </p>
                <p className="text-sm text-gray-600">
                  {formatOvers(bestBowler.balls)} overs
                </p>
                <p className="text-xs text-gray-500">
                  Econ: {bestBowler.economy.toFixed(2)} • M: {bestBowler.maidens}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extras Breakdown */}
      <div className="bg-white rounded-lg p-4 shadow-md mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Extras ({totalExtras})</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{innings.extras.wides}</p>
            <p className="text-sm text-gray-600">Wides</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{innings.extras.noBalls}</p>
            <p className="text-sm text-gray-600">No Balls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{innings.extras.byes}</p>
            <p className="text-sm text-gray-600">Byes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{innings.extras.legByes}</p>
            <p className="text-sm text-gray-600">Leg Byes</p>
          </div>
          {innings.extras.penalties > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{innings.extras.penalties}</p>
              <p className="text-sm text-gray-600">Penalties</p>
            </div>
          )}
        </div>
      </div>

      {/* Fall of Wickets */}
      {innings.fallOfWickets && innings.fallOfWickets.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-md mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Fall of Wickets</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {innings.fallOfWickets.map((fow, idx) => (
              <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xl font-bold text-red-600">
                  {fow.runs}-{fow.wicketNumber}
                </p>
                <p className="text-xs text-gray-600">
                  {fow.playerOut}
                </p>
                <p className="text-xs text-gray-500">
                  ({formatOvers(getTotalBalls(fow.overs, fow.balls))} ov)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Batting Card */}
      <div className="bg-white rounded-lg p-4 shadow-md mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Batting</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Batsman</th>
                <th className="text-center p-2">R</th>
                <th className="text-center p-2">B</th>
                <th className="text-center p-2">4s</th>
                <th className="text-center p-2">6s</th>
                <th className="text-center p-2">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batsmen.map((batsman, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <span className="font-semibold">{batsman.playerName}</span>
                      {batsman.isOnStrike && <span className="text-green-600 ml-1">*</span>}
                      {batsman.howOut && (
                        <div className="text-xs text-gray-600">{batsman.howOut}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center p-2 font-bold">{batsman.runs}</td>
                  <td className="text-center p-2">{batsman.balls}</td>
                  <td className="text-center p-2">{batsman.fours}</td>
                  <td className="text-center p-2">{batsman.sixes}</td>
                  <td className="text-center p-2">{batsman.strikeRate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Bowling Card */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Bowling</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Bowler</th>
                <th className="text-center p-2">O</th>
                <th className="text-center p-2">M</th>
                <th className="text-center p-2">R</th>
                <th className="text-center p-2">W</th>
                <th className="text-center p-2">Econ</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.map((bowler, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-semibold">{bowler.playerName}</td>
                  <td className="text-center p-2">{formatOvers(bowler.balls)}</td>
                  <td className="text-center p-2">{bowler.maidens}</td>
                  <td className="text-center p-2">{bowler.runs}</td>
                  <td className="text-center p-2 font-bold">{bowler.wickets}</td>
                  <td className="text-center p-2">{bowler.economy.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InningsSummary;
