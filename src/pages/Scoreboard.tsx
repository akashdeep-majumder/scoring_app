import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatOvers, getTotalBalls, getCurrentRunRate, getRequiredRunRate } from '../utils/helpers';
import { Trophy, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { isElectron } from '../utils/api';
import type { Ad } from '../types';

const Scoreboard: React.FC = () => {
  const { currentMatch, ads, tournaments } = useApp();
  const tournament = tournaments.find(t => t.id === currentMatch?.tournamentId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState<number>(0);
  const [broadcastAd, setBroadcastAd] = useState<Ad | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'overs' | 'scoreboard'>('live');
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    if (isElectron()) {
      window.close();
    } else {
      window.history.back();
    }
  };

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to local WebSocket server if running in Electron
  useEffect(() => {
    if (!isElectron()) return;

    // Connect to localhost server
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Scoreboard connected to local server');
    });

    socket.on('ad:show', (ad: Ad) => {
      console.log('Received ad display request:', ad);
      setBroadcastAd(ad);
      setShowAd(false); // Disable auto-rotation ads

      // Auto-play video
      if (videoRef.current && ad.filePath) {
        videoRef.current.src = ad.filePath;
        videoRef.current.play().catch(err => console.error('Auto-play failed:', err));
      }
    });

    socket.on('ad:close', () => {
      console.log('Received ad close request');
      setBroadcastAd(null);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Ad rotation every 2 minutes during match (only if not showing broadcast ads)
  useEffect(() => {
    if (!currentMatch || ads.length === 0 || broadcastAd) return;

    const adInterval = setInterval(() => {
      const enabledAds = ads.filter(ad => ad.enabled);
      if (enabledAds.length > 0) {
        setShowAd(true);
        setCurrentAd((prev) => (prev + 1) % enabledAds.length);

        // Hide ad after duration
        setTimeout(() => {
          setShowAd(false);
        }, enabledAds[currentAd]?.duration || 10000);
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(adInterval);
  }, [currentMatch, ads, currentAd, broadcastAd]);

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-8">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Cricket Scoring System</h1>
          <p className="text-3xl">No active match</p>
          <p className="text-2xl mt-4 opacity-75">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  }

  const currentInnings = currentMatch.innings[currentMatch.currentInnings - 1];
  const battingTeam = currentMatch.team1.id === currentInnings.battingTeamId ? currentMatch.team1 : currentMatch.team2;
  const bowlingTeam = currentMatch.team1.id === currentInnings.bowlingTeamId ? currentMatch.team1 : currentMatch.team2;

  const striker = currentInnings.batsmen.find(b => b.isOnStrike && !b.isOut);
  const nonStriker = currentInnings.batsmen.find(b => !b.isOnStrike && !b.isOut);
  const currentBowler = currentInnings.bowlers[currentInnings.bowlers.length - 1];

  const target = currentMatch.currentInnings === 2 ? currentMatch.innings[0].runs + 1 : undefined;
  const totalBalls = getTotalBalls(currentInnings.overs, currentInnings.balls);
  const maxBalls = currentMatch.overs * 6;
  const ballsRemaining = maxBalls - totalBalls;

  const crr = getCurrentRunRate(currentInnings.runs, totalBalls);
  const rrr = target ? getRequiredRunRate(target, currentInnings.runs, ballsRemaining) : 0;

  const enabledAds = ads.filter(ad => ad.enabled);
  const adToShow = enabledAds[currentAd];

  // Last 6 balls
  const recentBalls = currentInnings.ballByBall.slice(-6).reverse();

  const handleBroadcastVideoEnded = () => {
    setBroadcastAd(null);
  };

  // Show broadcast ad (from "Show Ad" button) with priority
  if (broadcastAd) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          onEnded={handleBroadcastVideoEnded}
          controls
        />
        <div className="absolute top-8 right-8 bg-red-500 text-white px-6 py-3 rounded-lg">
          <p className="text-xl font-semibold">LIVE AD</p>
        </div>
      </div>
    );
  }

  // Show auto-rotation ad
  if (showAd && adToShow) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <video
          src={adToShow.filePath}
          autoPlay
          className="max-w-full max-h-screen"
          onEnded={() => setShowAd(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-6">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title="Close Scoreboard (ESC)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Tournament Header */}
      {tournament && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 mb-4 shadow-2xl">
          <div className="flex items-center justify-center gap-4">
            {tournament.logo ? (
              <img
                src={tournament.logo}
                alt={tournament.name}
                className="w-16 h-16 object-contain bg-white rounded-lg p-2"
              />
            ) : (
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Trophy className="w-10 h-10" />
              </div>
            )}
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black bg-opacity-40 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {battingTeam.photo && (
              <img src={battingTeam.photo} alt={battingTeam.name} className="w-20 h-20 object-contain" />
            )}
            <div>
              <h1 className="text-4xl font-bold">{battingTeam.name}</h1>
              <p className="text-xl opacity-75">vs {bowlingTeam.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl opacity-75">
              {currentMatch.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
            </p>
            <p className="text-xl opacity-75">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Main Score */}
      <div className="bg-black bg-opacity-40 rounded-2xl p-8 mb-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex items-baseline gap-4 mb-4">
              <div className="text-8xl font-bold">{currentInnings.runs}/{currentInnings.wickets}</div>
              <div className="text-4xl opacity-75">
                ({formatOvers(totalBalls)} ov)
              </div>
            </div>

            {target && (
              <div className="text-3xl mb-2">
                <span className="opacity-75">Target: </span>
                <span className="font-bold">{target}</span>
                <span className="opacity-75 ml-4">Need: </span>
                <span className="font-bold text-yellow-300">{target - currentInnings.runs}</span>
              </div>
            )}

            <div className="flex gap-8 text-2xl">
              <div>
                <span className="opacity-75">CRR: </span>
                <span className="font-bold">{crr.toFixed(2)}</span>
              </div>
              {target && (
                <div>
                  <span className="opacity-75">RRR: </span>
                  <span className="font-bold text-yellow-300">{rrr.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <h3 className="text-xl mb-3 opacity-75">Recent Balls</h3>
            <div className="flex gap-2 flex-wrap">
              {recentBalls.map((ball, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    ball.isWicket ? 'bg-red-500' :
                    ball.runs === 6 ? 'bg-purple-500' :
                    ball.runs === 4 ? 'bg-blue-500' :
                    ball.isExtra ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                >
                  {ball.isWicket ? 'W' : ball.isExtra ? (ball.extraType?.[0].toUpperCase() || 'E') : ball.runs}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black bg-opacity-40 rounded-t-2xl p-2 mb-0 flex gap-2">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'live'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setActiveTab('overs')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'overs'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
          }`}
        >
          Overs
        </button>
        <button
          onClick={() => setActiveTab('scoreboard')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'scoreboard'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
          }`}
        >
          Scoreboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'live' && (
        <>
          {/* Batsmen */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-black bg-opacity-40 rounded-2xl p-6">
          <p className="text-xl opacity-75 mb-2">Batting</p>
          <div className="space-y-4">
            {striker && (
              <div className="flex justify-between items-center border-l-4 border-green-400 pl-4">
                <div>
                  <p className="text-2xl font-bold">{striker.playerName} *</p>
                  <p className="text-lg opacity-75">
                    {striker.runs}({striker.balls}) • 4s: {striker.fours} • 6s: {striker.sixes}
                  </p>
                </div>
                <div className="text-3xl font-bold">
                  {striker.strikeRate.toFixed(1)}
                </div>
              </div>
            )}
            {nonStriker && (
              <div className="flex justify-between items-center pl-4">
                <div>
                  <p className="text-2xl font-bold">{nonStriker.playerName}</p>
                  <p className="text-lg opacity-75">
                    {nonStriker.runs}({nonStriker.balls}) • 4s: {nonStriker.fours} • 6s: {nonStriker.sixes}
                  </p>
                </div>
                <div className="text-3xl font-bold opacity-75">
                  {nonStriker.strikeRate.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-40 rounded-2xl p-6">
          <p className="text-xl opacity-75 mb-2">Bowling</p>
          {currentBowler && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{currentBowler.playerName}</p>
                <p className="text-lg opacity-75">
                  {formatOvers(currentBowler.balls)} - {currentBowler.maidens} - {currentBowler.runs} - {currentBowler.wickets}
                </p>
              </div>
              <div className="text-3xl font-bold">
                {currentBowler.economy.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match Info Footer */}
      <div className="bg-black bg-opacity-40 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center text-lg">
          <div>
            <span className="opacity-75">Extras: </span>
            <span className="font-bold">
              {currentInnings.extras.wides + currentInnings.extras.noBalls +
               currentInnings.extras.byes + currentInnings.extras.legByes}
            </span>
            <span className="opacity-75 ml-2">
              (wd {currentInnings.extras.wides}, nb {currentInnings.extras.noBalls},
               b {currentInnings.extras.byes}, lb {currentInnings.extras.legByes})
            </span>
          </div>
          <div className="opacity-75">
            {currentMatch.overs} Overs Match
          </div>
        </div>
      </div>
        </>
      )}

      {/* Overs Tab */}
      {activeTab === 'overs' && (
        <div className="bg-black bg-opacity-40 rounded-b-2xl p-6 mb-6">
          <h3 className="text-2xl font-bold mb-4">Over-by-Over Analysis</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(() => {
              const overGroups: { [key: number]: any[] } = {};
              currentInnings.ballByBall.forEach((ball: any) => {
                if (!overGroups[ball.over]) {
                  overGroups[ball.over] = [];
                }
                overGroups[ball.over].push(ball);
              });

              const overNumbers = Object.keys(overGroups).map(Number).sort((a, b) => b - a);

              if (overNumbers.length === 0) {
                return <p className="text-gray-300 text-xl">No overs completed yet</p>;
              }

              return overNumbers.map((overNum: number) => {
                const balls = overGroups[overNum];
                const overRuns = balls.reduce((sum: number, ball: any) => sum + (ball.totalRuns || ball.runs), 0);
                const overWickets = balls.filter((b: any) => b.isWicket).length;
                const bowlerName = balls[0]?.bowler || 'Unknown';

                return (
                  <div key={overNum} className="border border-white border-opacity-20 rounded-xl p-4 hover:bg-white hover:bg-opacity-5 transition">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-2xl font-bold">Over {overNum + 1}</span>
                        <span className="text-lg text-gray-300 ml-3">({bowlerName})</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {overRuns} run{overRuns !== 1 ? 's' : ''}
                        {overWickets > 0 && (
                          <span className="text-red-400 ml-3">{overWickets}W</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {balls.map((ball: any, idx: number) => (
                        <div
                          key={idx}
                          className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg ${
                            ball.isWicket ? 'bg-red-500' :
                            ball.runs === 4 ? 'bg-blue-500' :
                            ball.isExtra ? 'bg-yellow-500 text-gray-900' :
                            ball.runs === 0 ? 'bg-gray-500' :
                            'bg-green-500'
                          }`}
                          title={`${ball.batsman}: ${ball.isWicket ? 'OUT' : `${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}`}
                        >
                          {ball.isWicket ? 'W' : ball.isExtra ? ball.extraType![0].toUpperCase() : ball.runs}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Scoreboard Tab */}
      {activeTab === 'scoreboard' && (
        <div className="bg-black bg-opacity-40 rounded-b-2xl p-6 mb-6">
          <h3 className="text-2xl font-bold mb-4">Full Scorecard</h3>

          {/* All Innings */}
          {currentMatch.innings.map((innings, idx) => {
            const battingTeamForInnings = currentMatch.team1.id === innings.battingTeamId ? currentMatch.team1 : currentMatch.team2;
            const bowlingTeamForInnings = currentMatch.team1.id === innings.bowlingTeamId ? currentMatch.team1 : currentMatch.team2;

            return (
              <div key={idx} className="mb-8">
                <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-2xl font-bold">{battingTeamForInnings.name} - {innings.runs}/{innings.wickets}</h4>
                    <p className="text-xl">({formatOvers(getTotalBalls(innings.overs, innings.balls))} ov)</p>
                  </div>
                  {idx === 0 && currentMatch.currentInnings > 1 && (
                    <p className="text-lg text-gray-300 mt-1">1st Innings</p>
                  )}
                  {idx === 1 && (
                    <p className="text-lg text-gray-300 mt-1">2nd Innings • Target: {innings.targetScore}</p>
                  )}
                </div>

                {/* Batting Card */}
                <div className="bg-white bg-opacity-5 rounded-lg p-4 mb-4">
                  <h5 className="text-xl font-semibold mb-3">Batting</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white border-opacity-20">
                        <tr className="text-sm opacity-75">
                          <th className="pb-2">Batsman</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">B</th>
                          <th className="pb-2 text-right">4s</th>
                          <th className="pb-2 text-right">6s</th>
                          <th className="pb-2 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.batsmen.map((batsman, bIdx) => (
                          <tr key={bIdx} className="border-b border-white border-opacity-10">
                            <td className="py-2">{batsman.playerName} {batsman.isOnStrike && '*'}</td>
                            <td className="text-right">{batsman.runs}</td>
                            <td className="text-right">{batsman.balls}</td>
                            <td className="text-right">{batsman.fours}</td>
                            <td className="text-right">{batsman.sixes}</td>
                            <td className="text-right">{batsman.strikeRate.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-sm opacity-75">
                    Extras: {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
                    (wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes})
                  </div>
                </div>

                {/* Bowling Card */}
                <div className="bg-white bg-opacity-5 rounded-lg p-4">
                  <h5 className="text-xl font-semibold mb-3">{bowlingTeamForInnings.name} Bowling</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white border-opacity-20">
                        <tr className="text-sm opacity-75">
                          <th className="pb-2">Bowler</th>
                          <th className="pb-2 text-right">O</th>
                          <th className="pb-2 text-right">M</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">W</th>
                          <th className="pb-2 text-right">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.bowlers.map((bowler, bowIdx) => (
                          <tr key={bowIdx} className="border-b border-white border-opacity-10">
                            <td className="py-2">{bowler.playerName}</td>
                            <td className="text-right">{formatOvers(bowler.balls)}</td>
                            <td className="text-right">{bowler.maidens}</td>
                            <td className="text-right">{bowler.runs}</td>
                            <td className="text-right">{bowler.wickets}</td>
                            <td className="text-right">{bowler.economy.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentMatch.status === 'completed' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-12 text-center">
            <h2 className="text-6xl font-bold mb-6">Match Complete!</h2>
            <p className="text-3xl">
              {/* Winner logic can be added here */}
              Final Score
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
