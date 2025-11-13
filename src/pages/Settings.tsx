import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Plus, Trash2, Play, Copy, Check, Wifi } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { Ad } from '../types';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { ads, addAd, updateAd, deleteAd } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [videoPath, setVideoPath] = useState('');
  const [duration, setDuration] = useState('10');
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get server info when component mounts
    if (window.electronAPI?.getServerInfo) {
      window.electronAPI.getServerInfo().then((response: any) => {
        console.log('Server info response:', response);
        if (response && response.data) {
          setServerInfo(response.data);
        } else if (response && response.ip) {
          // Handle direct response format
          setServerInfo(response);
        }
      }).catch((err: any) => {
        console.error('Failed to get server info:', err);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !videoPath.trim()) return;

    const ad: Ad = {
      id: generateId(),
      tournamentId: '', // Will be set by the specific tournament page
      name: name.trim(),
      type: 'video',
      filePath: videoPath.trim(),
      duration: parseInt(duration), // In seconds
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await addAd(ad);
      setName('');
      setVideoPath('');
      setDuration('10');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add ad:', error);
      alert('Failed to add advertisement. Please try again.');
    }
  };

  const toggleAdStatus = async (ad: Ad) => {
    try {
      await updateAd({ ...ad, enabled: !ad.enabled });
    } catch (error) {
      console.error('Failed to update ad:', error);
      alert('Failed to update advertisement. Please try again.');
    }
  };

  const copyNetworkUrl = () => {
    if (serverInfo) {
      const url = `http://${serverInfo.ip}:${serverInfo.port}/network-scoreboard`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Advertisement Settings
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add Ad</span>
          </button>
        </div>

        {serverInfo && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wifi className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2 text-lg">Network Scoreboard Access</h3>
                <p className="text-green-800 mb-3">
                  Open this URL on any device connected to the same network to view the scoreboard:
                </p>
                <div className="bg-white border border-green-300 rounded-lg p-4 flex items-center justify-between">
                  <code className="text-green-900 font-mono text-sm md:text-base break-all">
                    http://{serverInfo.ip}:{serverInfo.port}/network-scoreboard
                  </code>
                  <button
                    onClick={copyNetworkUrl}
                    className="ml-4 p-2 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-green-700" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-green-700 mt-3">
                  💡 The URL will automatically update if your IP address changes. Just refresh this page to see the new URL.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Add Local Video Ads:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Place your video files in a local folder (e.g., /videos/ads/)</li>
            <li>When running the app locally, use the full file path (e.g., /Users/yourname/videos/ad.mp4)</li>
            <li>For production build, place videos in the public folder and reference as /ad.mp4</li>
            <li>Ads will auto-rotate every 2 minutes during matches on the scoreboard</li>
            <li>Supported formats: MP4, WebM, OGG</li>
          </ol>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Add Advertisement</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Ad Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Local Shop Ad"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Video File Path
                  </label>
                  <input
                    type="text"
                    value={videoPath}
                    onChange={(e) => setVideoPath(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/path/to/video.mp4 or /video.mp4"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Full path to video file or path relative to public folder
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-3 h-3 rounded-full ${ad.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">{ad.name}</h3>
                  <p className="text-gray-600 text-sm mb-1">{ad.filePath}</p>
                  <p className="text-gray-500 text-sm">
                    Duration: {ad.duration / 1000}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAdStatus(ad)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    ad.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ad.enabled ? 'Enabled' : 'Disabled'}
                </button>

                <button
                  onClick={async () => {
                    if (confirm('Delete this ad?')) {
                      try {
                        await deleteAd(ad.id);
                      } catch (error) {
                        console.error('Failed to delete ad:', error);
                        alert('Failed to delete advertisement. Please try again.');
                      }
                    }
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {ads.length === 0 && (
          <div className="text-center py-20">
            <Play className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No advertisements added</p>
            <p className="text-gray-400">Add video ads to display during matches</p>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800">
            <li>For local deployment, ensure video files are accessible from the app</li>
            <li>Ads will only show on the Scoreboard display, not on the scoring interface</li>
            <li>Make sure video files are in a supported format (MP4 recommended)</li>
            <li>Keep file sizes reasonable for smooth playback</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
