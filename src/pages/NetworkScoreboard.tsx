import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Trophy, RefreshCw } from 'lucide-react';
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
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('Initial useEffect - checking for server URL');
    // Get server URL from query params, or auto-detect from current page, or fall back to localStorage
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('server');
    console.log('URL param:', urlParam);

    if (urlParam) {
      console.log('Setting server URL from param:', urlParam);
      localStorage.setItem('serverUrl', urlParam);
      setServerUrl(urlParam);
    } else {
      // Auto-detect: if we're accessing the page via the server (not localhost:5173),
      // use the current hostname and port
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;

      console.log('Current host:', currentHost, 'port:', currentPort);

      // If we're on the actual server (not Vite dev server on 5173)
      if (currentPort !== '5173' && currentHost !== 'localhost') {
        const autoDetectedUrl = `http://${currentHost}:${currentPort || '3000'}`;
        console.log('Auto-detected server URL:', autoDetectedUrl);
        localStorage.setItem('serverUrl', autoDetectedUrl);
        setServerUrl(autoDetectedUrl);
      } else {
        // Fall back to localStorage
        const saved = localStorage.getItem('serverUrl');
        console.log('Server URL from localStorage:', saved);
        if (saved) {
          setServerUrl(saved);
        } else {
          console.warn('No server URL found. Please provide ?server=http://IP:3000 in URL');
        }
      }
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
              localStorage.setItem('serverUrl', url);
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
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          onEnded={handleVideoEnded}
          onLoadStart={() => console.log('Video onLoadStart event')}
          onLoadedMetadata={() => console.log('Video onLoadedMetadata event')}
          onCanPlay={() => console.log('Video onCanPlay event')}
          onPlay={() => console.log('Video onPlay event')}
          onError={(e) => console.error('Video onError event:', e)}
          controls
          autoPlay
          playsInline
          muted={false}
        />
        <div className="absolute top-8 left-8 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg">
          <p className="text-xl font-semibold">{currentAd.name}</p>
          <p className="text-sm text-gray-300">{currentAd.filePath}</p>
        </div>
        {/* Debug info */}
        <div className="absolute bottom-8 left-8 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg text-xs space-y-1">
          <p>Video Ref: {videoRef.current ? 'Available' : 'Not Available'}</p>
          <p>Current Ad ID: {currentAd.id}</p>
          {videoRef.current && (
            <>
              <p>Video Ready State: {videoRef.current.readyState}</p>
              <p>Video Network State: {videoRef.current.networkState}</p>
              <p>Video Paused: {videoRef.current.paused ? 'Yes' : 'No'}</p>
              <p>Video Current Time: {videoRef.current.currentTime.toFixed(2)}s</p>
            </>
          )}
          <button
            onClick={() => {
              if (videoRef.current) {
                console.log('Manual play attempt');
                videoRef.current.play().catch(e => console.error('Manual play failed:', e));
              }
            }}
            className="mt-2 px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white"
          >
            Manual Play
          </button>
        </div>
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
  const requiredRunRate = match.currentInnings === 2 && totalBalls > 0
    ? ((match.innings[0].runs - currentInnings.runs + 1) / (match.overs * 6 - totalBalls) * 6).toFixed(2)
    : null;

  const currentRunRate = totalBalls > 0
    ? ((currentInnings.runs / totalBalls) * 6).toFixed(2)
    : '0.00';

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900 p-4 md:p-6 lg:p-8">
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

      <div className="max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
        {/* Tournament Header */}
        {tournament && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 shadow-2xl flex-shrink-0">
            <div className="flex items-center justify-center gap-3 md:gap-4 lg:gap-6">
              {tournament.logo ? (
                <img
                  src={tournament.logo}
                  alt={tournament.name}
                  className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain bg-white rounded-lg md:rounded-xl p-2"
                />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-20 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
                </div>
              )}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all ${
              activeTab === 'live'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setActiveTab('overs')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all ${
              activeTab === 'overs'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Overs
          </button>
          <button
            onClick={() => setActiveTab('scoreboard')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all ${
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
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-8 lg:p-10 mb-4 md:mb-6 shadow-2xl flex-shrink-0">
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
              {battingTeam.name} vs {bowlingTeam.name}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300">
              {match.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-4 md:mb-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-2">
                {currentInnings.runs}/{currentInnings.wickets}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl text-gray-300">
                {currentInnings.overs}.{currentInnings.balls} Overs
              </div>
            </div>

            {/* Run Rates */}
            <div className="flex flex-col justify-center space-y-3 md:space-y-4">
              <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                <div className="text-gray-300 text-base md:text-lg lg:text-xl mb-1 md:mb-2">Current Run Rate</div>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{currentRunRate}</div>
              </div>
              {requiredRunRate && (
                <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
                  <div className="text-gray-300 text-base md:text-lg lg:text-xl mb-1 md:mb-2">Required Run Rate</div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{requiredRunRate}</div>
                </div>
              )}
            </div>
          </div>

          {/* Batsmen */}
          <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Batsmen</h3>
            <div className="space-y-2 md:space-y-3">
              {currentInnings.batsmen.filter(b => !b.isOut && b.balls > 0).map((batsman, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white bg-opacity-10 rounded-lg p-3 md:p-4 gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">{batsman.playerName}</span>
                    {batsman.isOnStrike && (
                      <span className="px-2 md:px-3 py-1 bg-green-500 text-white rounded-full text-xs md:text-sm font-semibold">
                        On Strike
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 md:gap-6 lg:gap-8 text-base md:text-lg lg:text-xl">
                    <span className="text-white font-bold">{batsman.runs}</span>
                    <span className="text-gray-300">({batsman.balls})</span>
                    <span className="text-gray-300">SR: {batsman.strikeRate.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Bowler */}
          {currentInnings.bowlers.length > 0 && (
            <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Current Bowler</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                  {currentInnings.bowlers[currentInnings.bowlers.length - 1].playerName}
                </span>
                <div className="flex gap-4 md:gap-6 lg:gap-8 text-base md:text-lg lg:text-xl">
                  <span className="text-white">
                    {currentInnings.bowlers[currentInnings.bowlers.length - 1].wickets}-
                    {currentInnings.bowlers[currentInnings.bowlers.length - 1].runs}
                  </span>
                  <span className="text-gray-300">
                    ({currentInnings.bowlers[currentInnings.bowlers.length - 1].overs.toFixed(1)} ov)
                  </span>
                  <span className="text-gray-300">
                    Econ: {currentInnings.bowlers[currentInnings.bowlers.length - 1].economy.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Overs Tab */}
        {activeTab === 'overs' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">Over by Over</h2>
            <div className="space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto">
              {currentInnings.ballByBall.reduce((overs: any[], ball) => {
                const overIndex = ball.over - 1;
                if (!overs[overIndex]) {
                  overs[overIndex] = { over: ball.over, balls: [] };
                }
                overs[overIndex].balls.push(ball);
                return overs;
              }, []).map((over, index) => {
                const overRuns = over.balls.reduce((sum: number, b: any) => sum + (b.totalRuns || b.runs), 0);
                const overWickets = over.balls.filter((b: any) => b.isWicket).length;

                return (
                  <div key={index} className="bg-white bg-opacity-20 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Over {over.over}</h3>
                      <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                        {overRuns} run{overRuns !== 1 ? 's' : ''}{overWickets > 0 && ` / ${overWickets} wicket${overWickets !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {over.balls.map((ball: any, ballIndex: number) => (
                        <div
                          key={ballIndex}
                          className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg flex items-center justify-center font-bold text-sm md:text-base lg:text-lg ${
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
                          {ball.isWicket ? 'W' : ball.extraType ? `${ball.extraType[0].toUpperCase()}${ball.runs || 0}` : ball.runs}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scoreboard Tab */}
        {activeTab === 'scoreboard' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">Full Scorecard</h2>

            {/* Batting Team */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">{battingTeam.name} - {currentInnings.runs}/{currentInnings.wickets}</h3>
              <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl overflow-hidden">
                <table className="w-full text-white">
                  <thead className="bg-white bg-opacity-10">
                    <tr className="text-sm md:text-base">
                      <th className="text-left p-2 md:p-3">Batsman</th>
                      <th className="text-center p-2 md:p-3">R</th>
                      <th className="text-center p-2 md:p-3">B</th>
                      <th className="text-center p-2 md:p-3">4s</th>
                      <th className="text-center p-2 md:p-3">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInnings.batsmen.filter(b => b.balls > 0).map((batsman, index) => (
                      <tr key={index} className="border-t border-white border-opacity-10 text-sm md:text-base">
                        <td className="p-2 md:p-3">
                          {batsman.playerName}
                          {batsman.isOut && <span className="text-xs text-gray-300 ml-2">({batsman.howOut})</span>}
                        </td>
                        <td className="text-center p-2 md:p-3 font-bold">{batsman.runs}</td>
                        <td className="text-center p-2 md:p-3">{batsman.balls}</td>
                        <td className="text-center p-2 md:p-3">{batsman.fours}</td>
                        <td className="text-center p-2 md:p-3">{batsman.strikeRate.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 md:mt-4 text-white text-sm md:text-base">
                <p>Extras: {currentInnings.extras.wides + currentInnings.extras.noBalls + currentInnings.extras.byes + currentInnings.extras.legByes}</p>
                <p className="text-xs md:text-sm text-gray-300">
                  (wd {currentInnings.extras.wides}, nb {currentInnings.extras.noBalls}, b {currentInnings.extras.byes}, lb {currentInnings.extras.legByes})
                </p>
              </div>
            </div>

            {/* Bowling Team */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Bowling - {bowlingTeam.name}</h3>
              <div className="bg-white bg-opacity-20 rounded-lg md:rounded-xl overflow-hidden">
                <table className="w-full text-white">
                  <thead className="bg-white bg-opacity-10">
                    <tr className="text-sm md:text-base">
                      <th className="text-left p-2 md:p-3">Bowler</th>
                      <th className="text-center p-2 md:p-3">O</th>
                      <th className="text-center p-2 md:p-3">R</th>
                      <th className="text-center p-2 md:p-3">W</th>
                      <th className="text-center p-2 md:p-3">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInnings.bowlers.map((bowler, index) => (
                      <tr key={index} className="border-t border-white border-opacity-10 text-sm md:text-base">
                        <td className="p-2 md:p-3">{bowler.playerName}</td>
                        <td className="text-center p-2 md:p-3">{bowler.overs.toFixed(1)}</td>
                        <td className="text-center p-2 md:p-3">{bowler.runs}</td>
                        <td className="text-center p-2 md:p-3 font-bold">{bowler.wickets}</td>
                        <td className="text-center p-2 md:p-3">{bowler.economy.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkScoreboard;
