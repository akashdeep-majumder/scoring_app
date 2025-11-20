import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Trophy, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import type { Match, Ad, Tournament } from '../types';

const NetworkScoreboard: React.FC = () => {
  console.log('NetworkScoreboard component mounted');

  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [availableMatches, setAvailableMatches] = useState<Array<{id: string, name: string, status: string, tournamentName: string}>>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showMatchSelector, setShowMatchSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'overs' | 'scoreboard'>('live');
  const [selectedInningsIndex, setSelectedInningsIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('Initial useEffect - checking for server URL');
    // Get server URL from query params, or auto-detect from hostname
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('server');
    console.log('URL param:', urlParam);

    if (urlParam) {
      console.log('Setting server URL from param:', urlParam);
      setServerUrl(urlParam);
    } else {
      // Auto-detect from hostname
      const currentHost = window.location.hostname;

      console.log('Current host:', currentHost);

      // Auto-detect server URL based on hostname
      // If localhost, use localhost:3000
      // If IP address (e.g., 192.168.1.68), use that IP with port 3000
      const autoDetectedUrl = currentHost === 'localhost' || currentHost === '127.0.0.1'
        ? 'http://localhost:3000'
        : `http://${currentHost}:3000`;

      console.log('Auto-detected server URL:', autoDetectedUrl);
      setServerUrl(autoDetectedUrl);
    }
  }, []);

  useEffect(() => {
    console.log('Socket useEffect triggered, serverUrl:', serverUrl);
    if (!serverUrl) {
      console.log('No server URL, skipping socket connection');
      return;
    }

    // Fetch available matches first
    console.log('Fetching available matches...');
    fetchAvailableMatches();

    // Fetch initial match data
    console.log('Fetching initial match data...');
    fetchMatchData();

    // Connect to Socket.IO
    console.log('Connecting to Socket.IO at:', serverUrl);
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO Connection error:', error);
    });

    // Listen for match updates
    socket.on('match:updated', (updatedMatch: Match) => {
      console.log('Received match update:', updatedMatch);
      setMatch(updatedMatch);
    });

    // Listen for ad display requests
    socket.on('ad:show', (ad: Ad) => {
      console.log('Received ad display request:', ad);
      setCurrentAd(ad);
    });

    // Listen for ad close requests
    socket.on('ad:close', () => {
      console.log('Received ad close request');
      setCurrentAd(null);
    });

    // Poll for match updates every 5 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchMatchData();
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [serverUrl]);

  const fetchAvailableMatches = async () => {
    if (!serverUrl) return;

    try {
      const response = await fetch(`${serverUrl}/api/tournaments`);
      const result = await response.json();

      if (result.success && result.data) {
        const tournaments = result.data;
        const matches: Array<{id: string, name: string, status: string, tournamentName: string}> = [];

        tournaments.forEach((tournament: Tournament) => {
          tournament.matches.forEach((match: Match) => {
            matches.push({
              id: match.id,
              name: `${match.team1.name} vs ${match.team2.name}`,
              status: match.status,
              tournamentName: tournament.name
            });
          });
        });

        setAvailableMatches(matches);

        // Auto-select first in-progress match or last match
        const inProgressMatch = matches.find(m => m.status === 'in-progress');
        if (inProgressMatch && !selectedMatchId) {
          setSelectedMatchId(inProgressMatch.id);
        } else if (matches.length > 0 && !selectedMatchId) {
          setSelectedMatchId(matches[matches.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Error fetching available matches:', error);
    }
  };

  const fetchMatchData = async () => {
    if (!serverUrl) return;

    try {
      // If a specific match is selected, fetch that
      const endpoint = selectedMatchId
        ? `${serverUrl}/api/match/${selectedMatchId}`
        : `${serverUrl}/api/match/current`;

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success && result.data) {
        setMatch(result.data);

        // Fetch tournament data if we have a tournamentId
        if (result.data.tournamentId) {
          fetchTournamentData(result.data.tournamentId);
        }
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    }
  };

  const fetchTournamentData = async (tournamentId: string) => {
    if (!serverUrl) return;

    try {
      const response = await fetch(`${serverUrl}/api/tournament/${tournamentId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTournament(result.data);
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    }
  };

  // Refetch match data when selected match changes
  useEffect(() => {
    if (selectedMatchId) {
      fetchMatchData();
    }
  }, [selectedMatchId]);

  // Handle video playback when ad changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.log('Video ref not available yet');
      return;
    }

    if (currentAd && currentAd.filePath) {
      console.log('Setting video source:', currentAd.filePath);

      // Test if URL is accessible
      fetch(currentAd.filePath, { method: 'HEAD' })
        .then(response => {
          console.log('Video URL test:', {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          });
        })
        .catch(err => console.error('Video URL not accessible:', err));

      // Add event listeners for debugging
      const handleLoadStart = () => console.log('Video: loadstart');
      const handleLoadedData = () => console.log('Video: loadeddata');
      const handleCanPlay = () => console.log('Video: canplay');
      const handlePlaying = () => console.log('Video: playing');
      const handleError = (e: Event) => {
        console.error('Video error:', e);
        if (video.error) {
          console.error('Video error details:', {
            code: video.error.code,
            message: video.error.message
          });
        }
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);

      video.src = currentAd.filePath;
      video.load(); // Force load the video

      // Attempt to play with a slight delay to ensure video is loaded
      const playTimer = setTimeout(() => {
        video.play()
          .then(() => {
            console.log('Video playback started successfully');
          })
          .catch(err => {
            console.error('Auto-play failed:', err);
            console.log('Video element state:', {
              readyState: video.readyState,
              networkState: video.networkState,
              error: video.error,
              src: video.src,
              currentSrc: video.currentSrc
            });
          });
      }, 100);

      return () => {
        clearTimeout(playTimer);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
      };
    } else if (!currentAd) {
      // Clear video when ad is closed
      video.pause();
      video.src = '';
    }
  }, [currentAd]);

  const handleVideoEnded = () => {
    setCurrentAd(null);
  };

  // Server configuration screen
  if (!serverUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect to Scoring Server</h2>
          <p className="text-gray-600 mb-6">
            Enter the server URL displayed on the main scoring application
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).server as HTMLInputElement;
            const url = input.value.trim();
            if (url) {
              setServerUrl(url);
            }
          }}>
            <input
              name="server"
              type="text"
              placeholder="http://192.168.1.100:3000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg"
            >
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ad display overlay
  if (currentAd) {
    console.log('Rendering ad overlay for:', currentAd);
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        {/* Ad Name at Top */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-8 py-4 rounded-lg shadow-2xl">
          <p className="text-3xl font-bold tracking-wide">{currentAd.name}</p>
        </div>

        {/* Mute/Unmute Button */}
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (videoRef.current) {
              videoRef.current.muted = !isMuted;
            }
          }}
          className="absolute bottom-8 right-8 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-4 rounded-full transition-all shadow-2xl z-10"
        >
          {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
        </button>

        {/* Full-screen Video without controls */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onEnded={handleVideoEnded}
          onLoadStart={() => console.log('Video onLoadStart event')}
          onLoadedMetadata={() => console.log('Video onLoadedMetadata event')}
          onCanPlay={() => console.log('Video onCanPlay event')}
          onPlay={() => console.log('Video onPlay event')}
          onError={(e) => console.error('Video onError event:', e)}
          autoPlay
          playsInline
          muted={isMuted}
          loop={false}
        />
      </div>
    );
  }

  // No match screen
  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className={`inline-block w-4 h-4 rounded-full mb-4 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h2 className="text-4xl font-bold text-white mb-4">
            {isConnected ? 'Waiting for Match to Start' : 'Connecting to Server...'}
          </h2>
          <p className="text-xl text-gray-300">
            {serverUrl}
          </p>
        </div>
      </div>
    );
  }

  const currentInnings = match.innings[match.currentInnings - 1];
  const battingTeam = match.team1.id === currentInnings.battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = match.team1.id === currentInnings.bowlingTeamId ? match.team1 : match.team2;

  const totalBalls = currentInnings.overs * 6 + currentInnings.balls;
  const ballsRemaining = match.overs * 6 - totalBalls;

  const requiredRunRate = match.currentInnings === 2 && totalBalls > 0
    ? ballsRemaining > 0
      ? ((match.innings[0].runs - currentInnings.runs + 1) / ballsRemaining * 6).toFixed(2)
      : null  // No balls remaining
    : null;

  const currentRunRate = totalBalls > 0
    ? ((currentInnings.runs / totalBalls) * 6).toFixed(2)
    : '0.00';

  // Use selected innings for Overs and Scoreboard tabs, but current innings for Live tab
  const displayInnings = activeTab === 'live' ? currentInnings : match.innings[selectedInningsIndex];
  const displayBattingTeam = displayInnings.battingTeamId === match.team1.id ? match.team1 : match.team2;
  const displayBowlingTeam = displayInnings.bowlingTeamId === match.team1.id ? match.team1 : match.team2;

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-900 to-purple-900 p-4 md:p-6 lg:p-8 overflow-hidden">
      {/* Connection status and match selector */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-2 md:gap-3 z-30">
        <div className="flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white text-sm">{isConnected ? 'Live' : 'Reconnecting...'}</span>
        </div>

        {/* Match Selector Button */}
        {availableMatches.length > 1 && (
          <button
            onClick={() => setShowMatchSelector(!showMatchSelector)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Switch Match</span>
          </button>
        )}
      </div>

      {/* Match Selector Modal */}
      {showMatchSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40" onClick={() => setShowMatchSelector(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Select Match to Display</h2>
            <div className="space-y-3">
              {availableMatches.map((matchInfo) => (
                <button
                  key={matchInfo.id}
                  onClick={() => {
                    setSelectedMatchId(matchInfo.id);
                    setShowMatchSelector(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedMatchId === matchInfo.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{matchInfo.name}</p>
                      <p className={`text-sm ${selectedMatchId === matchInfo.id ? 'text-indigo-100' : 'text-gray-600'}`}>
                        {matchInfo.tournamentName}
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        matchInfo.status === 'in-progress'
                          ? 'bg-green-500 text-white'
                          : matchInfo.status === 'completed'
                          ? 'bg-gray-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {matchInfo.status === 'in-progress' ? 'LIVE' : matchInfo.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMatchSelector(false)}
              className="w-full mt-6 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="w-full h-full flex flex-col px-2 md:px-4">
        {/* Tournament Header */}
        {tournament && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-2 md:p-3 mb-2 md:mb-3 shadow-xl flex-shrink-0">
            <div className="flex items-center justify-center gap-2">
              {tournament.logo ? (
                <img
                  src={tournament.logo}
                  alt={tournament.name}
                  className="w-8 h-8 md:w-10 md:h-10 object-contain bg-white rounded-lg p-1"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-2 md:mb-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm md:text-base transition-all ${
              activeTab === 'live'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setActiveTab('overs')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm md:text-base transition-all ${
              activeTab === 'overs'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Overs
          </button>
          <button
            onClick={() => setActiveTab('scoreboard')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm md:text-base transition-all ${
              activeTab === 'scoreboard'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Scoreboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'live' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-2 md:p-3 shadow-xl flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 overflow-hidden min-h-0">
          {/* LEFT: Match Info & Score */}
          <div className="flex flex-col gap-2 min-h-0">
            {/* Match Header */}
            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center flex-shrink-0">
              <h2 className="text-sm md:text-base font-bold text-white">
                {battingTeam.name} vs {bowlingTeam.name}
              </h2>
              <p className="text-xs text-gray-300">
                {match.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
              </p>
            </div>

            {/* Score */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 md:p-6 text-center flex-shrink-0">
              <div className="text-6xl md:text-8xl font-bold text-white mb-2">
                {currentInnings.runs}/{currentInnings.wickets}
              </div>
              <div className="text-base md:text-lg text-gray-200 mb-2">
                {currentInnings.overs}.{currentInnings.balls} Overs
              </div>
              {/* Target Info for 2nd Innings */}
              {match.currentInnings === 2 && match.innings[0] && (
                <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                  <div className="text-sm md:text-base text-gray-200 mb-1">
                    Target: {match.innings[0].runs + 1}
                  </div>
                  {currentInnings.runs < match.innings[0].runs + 1 ? (
                    <div className="text-base md:text-xl font-semibold text-yellow-300">
                      Need {match.innings[0].runs + 1 - currentInnings.runs} runs in {match.overs * 6 - (currentInnings.overs * 6 + currentInnings.balls)} balls
                    </div>
                  ) : (
                    <div className="text-base md:text-xl font-semibold text-green-300">
                      Target Achieved!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run Rates */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <div className="text-xs text-gray-300">Current RR</div>
                <div className="text-lg md:text-xl font-bold text-white">{currentRunRate}</div>
              </div>
              {requiredRunRate && (
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="text-xs text-gray-300">Required RR</div>
                  <div className="text-lg md:text-xl font-bold text-white">{requiredRunRate}</div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Batsmen */}
          <div className="bg-white bg-opacity-10 rounded-lg p-2 flex flex-col min-h-0">
            <h3 className="text-sm md:text-base font-bold text-white mb-2 flex-shrink-0">Batsmen</h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {currentInnings.batsmen.filter(b => !b.isOut && !b.isRetiredHurt && (b.balls > 0 || b.isOnStrike)).map((batsman, index) => (
                <div key={index} className="bg-white bg-opacity-10 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs md:text-sm font-bold text-white">{batsman.playerName}</span>
                    {batsman.isOnStrike && (
                      <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs">★</span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-bold">{batsman.runs}({batsman.balls})</span>
                    <span className="text-gray-300">4s: {batsman.fours}</span>
                    <span className="text-gray-300">SR: {batsman.strikeRate.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Current Bowler */}
          <div className="flex flex-col gap-2 min-h-0">
            {/* Current Bowler */}
            {currentInnings.bowlers.length > 0 && (() => {
              // Get current bowler from last ball, fallback to last bowler in list
              const currentBowlerName = currentInnings.ballByBall.length > 0
                ? currentInnings.ballByBall[currentInnings.ballByBall.length - 1].bowler
                : currentInnings.bowlers[currentInnings.bowlers.length - 1].playerName;

              const currentBowler = currentInnings.bowlers.find(b => b.playerName === currentBowlerName)
                || currentInnings.bowlers[currentInnings.bowlers.length - 1];

              return (
                <div className="bg-white bg-opacity-10 rounded-lg p-2 flex-shrink-0">
                  <h3 className="text-xs md:text-sm font-bold text-white mb-2">Current Bowler</h3>
                  <div className="bg-white bg-opacity-10 rounded-lg p-2">
                    <div className="text-xs md:text-sm font-bold text-white mb-1">
                      {currentBowler.playerName}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white">{currentBowler.wickets}-{currentBowler.runs}</span>
                      <span className="text-gray-300">({currentBowler.overs.toFixed(1)} ov)</span>
                      <span className="text-gray-300">Econ: {currentBowler.economy.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        )}

        {/* Overs Tab */}
        {activeTab === 'overs' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-2 md:p-3 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="text-base md:text-lg font-bold text-white">Ball by Ball</h2>
              {match.innings.length > 1 && (
                <div className="flex gap-1">
                  {match.innings.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedInningsIndex(idx)}
                      className={`px-3 py-1 text-xs rounded font-bold transition-all ${
                        selectedInningsIndex === idx
                          ? 'bg-white text-blue-900'
                          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                      }`}
                    >
                      {idx + 1}{idx === 0 ? 'st' : 'nd'} Inn
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {displayInnings.ballByBall && displayInnings.ballByBall.length > 0 ? (
                Object.values(
                  displayInnings.ballByBall.reduce((overs: Record<number, any>, ball) => {
                    if (!overs[ball.over]) {
                      overs[ball.over] = { over: ball.over, balls: [], bowler: ball.bowler };
                    }
                    overs[ball.over].balls.push(ball);
                    return overs;
                  }, {})
                ).reverse().map((over, index) => {
                const overRuns = over.balls.reduce((sum: number, b: any) => sum + (b.totalRuns || b.runs), 0);
                const overWickets = over.balls.filter((b: any) => b.isWicket).length;

                return (
                  <div key={index} className="bg-white bg-opacity-20 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm md:text-base font-bold text-white">Over {over.over}</span>
                        <span className="text-xs text-gray-300 ml-2">{over.bowler}</span>
                      </div>
                      <div className="text-sm md:text-base font-bold text-white">
                        {overRuns} run{overRuns !== 1 ? 's' : ''}{overWickets > 0 && ` • ${overWickets}W`}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {over.balls.map((ball: any, ballIndex: number) => (
                        <div
                          key={ballIndex}
                          className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                            ball.isWicket
                              ? 'bg-red-500 text-white'
                              : ball.extraType === 'wide' || ball.extraType === 'no-ball'
                              ? 'bg-yellow-500 text-gray-900'
                              : ball.runs === 4
                              ? 'bg-blue-500 text-white'
                              : ball.runs === 6
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          {ball.isWicket && ball.extraType ? `${ball.extraType[0].toUpperCase()}+W` : ball.isWicket ? 'W' : ball.extraType ? `${ball.extraType[0].toUpperCase()}${ball.runs || 0}` : ball.runs}
                        </div>
                      ))}
                    </div>
                    {/* Live Commentary */}
                    <div className="space-y-1">
                      {over.balls.slice().reverse().map((ball: any, ballIndex: number) => {
                        const actualBallIndex = over.balls.length - 1 - ballIndex;
                        let commentary = '';
                        if (ball.isWicket) {
                          // Check if it's an extra + wicket scenario
                          if (ball.extraType === 'wide') {
                            commentary = `${over.over}.${actualBallIndex + 1} Wide! ${ball.batsman} is out, by ${ball.fielderId || 'fielder'} (${ball.wicketType || 'run-out'})`;
                          } else if (ball.extraType === 'no-ball') {
                            commentary = `${over.over}.${actualBallIndex + 1} No Ball! ${ball.batsman} is out, by ${ball.fielderId || 'fielder'} (${ball.wicketType || 'run-out'})`;
                          } else if (ball.extraType === 'bye') {
                            commentary = `${over.over}.${actualBallIndex + 1} Bye! ${ball.batsman} is out, by ${ball.fielderId || 'fielder'} (${ball.wicketType || 'run-out'})`;
                          } else if (ball.extraType === 'leg-bye') {
                            commentary = `${over.over}.${actualBallIndex + 1} Leg Bye! ${ball.batsman} is out, by ${ball.fielderId || 'fielder'} (${ball.wicketType || 'run-out'})`;
                          } else {
                            commentary = `${over.over}.${actualBallIndex + 1} ${ball.batsman} OUT! ${ball.wicketType || 'Wicket'}${ball.fielderId ? ` (${ball.fielderId})` : ''}`;
                          }
                        } else if (ball.runs === 6) {
                          commentary = `${over.over}.${actualBallIndex + 1} SIX! ${ball.batsman} smashes it for 6 runs`;
                        } else if (ball.runs === 4) {
                          commentary = `${over.over}.${actualBallIndex + 1} FOUR! ${ball.batsman} finds the boundary`;
                        } else if (ball.extraType === 'wide') {
                          commentary = `${over.over}.${actualBallIndex + 1} Wide ball, ${ball.extraRuns || 1} extra${ball.extraRuns > 1 ? 's' : ''}`;
                        } else if (ball.extraType === 'no-ball') {
                          commentary = `${over.over}.${actualBallIndex + 1} No ball! 1 run penalty`;
                        } else if (ball.runs > 0) {
                          commentary = `${over.over}.${actualBallIndex + 1} ${ball.batsman} scores ${ball.runs} run${ball.runs > 1 ? 's' : ''}`;
                        } else {
                          commentary = `${over.over}.${actualBallIndex + 1} Dot ball`;
                        }
                        return (
                          <div key={ballIndex} className="text-xs text-gray-200 bg-white bg-opacity-5 rounded px-2 py-1">
                            {commentary}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-white">No balls bowled yet in this innings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scoreboard Tab */}
        {activeTab === 'scoreboard' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-2 md:p-3 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="text-base md:text-lg font-bold text-white">Scorecard</h2>
              {match.innings.length > 1 && (
                <div className="flex gap-1">
                  {match.innings.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedInningsIndex(idx)}
                      className={`px-3 py-1 text-xs rounded font-bold transition-all ${
                        selectedInningsIndex === idx
                          ? 'bg-white text-blue-900'
                          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                      }`}
                    >
                      {idx + 1}{idx === 0 ? 'st' : 'nd'} Inn
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Batting Team */}
              <div className="bg-white bg-opacity-10 rounded-lg p-2">
                <h3 className="text-sm md:text-base font-bold text-white mb-2">{displayBattingTeam.name} - {displayInnings.runs}/{displayInnings.wickets}</h3>
              <div className="bg-white bg-opacity-5 rounded overflow-hidden">
                <table className="w-full text-white text-xs">
                  <thead className="bg-white bg-opacity-10">
                    <tr>
                      <th className="text-left p-1">Batsman</th>
                      <th className="text-center p-1">R</th>
                      <th className="text-center p-1">B</th>
                      <th className="text-center p-1">4s</th>
                      <th className="text-center p-1">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayInnings.batsmen.filter(b => b.balls > 0).map((batsman, index) => (
                      <tr key={index} className="border-t border-white border-opacity-10">
                        <td className="p-1">
                          {batsman.playerName}
                          {batsman.isOut && <div className="text-xs text-gray-400">{batsman.howOut}</div>}
                        </td>
                        <td className="text-center p-1 font-bold">{batsman.runs}</td>
                        <td className="text-center p-1">{batsman.balls}</td>
                        <td className="text-center p-1">{batsman.fours}</td>
                        <td className="text-center p-1">{batsman.strikeRate.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-white text-xs">
                <p>Extras: {displayInnings.extras.wides + displayInnings.extras.noBalls + displayInnings.extras.byes + displayInnings.extras.legByes} (wd {displayInnings.extras.wides}, nb {displayInnings.extras.noBalls}, b {displayInnings.extras.byes}, lb {displayInnings.extras.legByes})</p>
              </div>
            </div>

            {/* Bowling Team */}
            <div className="bg-white bg-opacity-10 rounded-lg p-2">
              <h3 className="text-sm md:text-base font-bold text-white mb-2">Bowling - {displayBowlingTeam.name}</h3>
              <div className="bg-white bg-opacity-5 rounded overflow-hidden">
                <table className="w-full text-white text-xs">
                  <thead className="bg-white bg-opacity-10">
                    <tr>
                      <th className="text-left p-1">Bowler</th>
                      <th className="text-center p-1">O</th>
                      <th className="text-center p-1">R</th>
                      <th className="text-center p-1">W</th>
                      <th className="text-center p-1">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayInnings.bowlers.map((bowler, index) => (
                      <tr key={index} className="border-t border-white border-opacity-10">
                        <td className="p-1">{bowler.playerName}</td>
                        <td className="text-center p-1">{bowler.overs.toFixed(1)}</td>
                        <td className="text-center p-1">{bowler.runs}</td>
                        <td className="text-center p-1 font-bold">{bowler.wickets}</td>
                        <td className="text-center p-1">{bowler.economy.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkScoreboard;
