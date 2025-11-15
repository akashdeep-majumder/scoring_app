import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Plus, Film, Trash2, Play, Eye, EyeOff, Upload } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { Ad } from '../types';
import AdPlayer from '../components/AdPlayer';
import ConfirmDialog from '../components/ConfirmDialog';

const AdManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, ads, addAd, updateAd, deleteAd } = useApp();
  const tournament = tournaments.find(t => t.id === id);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [adName, setAdName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);

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

  // Filter ads for this tournament
  const tournamentAds = ads.filter(ad => ad.tournamentId === id);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName.trim() || !selectedFile) return;

    try {
      setUploading(true);
      console.log('Starting ad upload...', { name: adName, file: selectedFile.name });

      // Convert video file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          console.log('File read complete');
          resolve(reader.result as string);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(selectedFile);
      });

      const base64Video = await base64Promise;
      console.log('Base64 conversion complete, size:', base64Video.length);

      // Try to get video duration, but don't fail if we can't
      let videoDuration = 0;
      try {
        const video = document.createElement('video');
        video.src = base64Video;
        video.preload = 'metadata';

        await new Promise<void>((resolve, _reject) => {
          const timeout = setTimeout(() => {
            console.warn('Video metadata loading timeout - using default duration');
            resolve(); // Resolve instead of reject
          }, 5000); // 5 second timeout

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            console.log('Video metadata loaded, duration:', video.duration);
            videoDuration = Math.floor(video.duration) || 30; // Default to 30 if duration is invalid
            resolve();
          };

          video.onerror = (error) => {
            clearTimeout(timeout);
            console.warn('Video loading error (will use default duration):', error);
            videoDuration = 30; // Default duration if metadata fails
            resolve(); // Resolve instead of reject
          };
        });
      } catch (error) {
        console.warn('Could not load video metadata, using default duration:', error);
        videoDuration = 30;
      }

      const newAd: Ad = {
        id: generateId(),
        tournamentId: id!,
        name: adName.trim(),
        type: 'video',
        filePath: base64Video, // Store as base64 data URL
        duration: videoDuration || 30, // Use detected duration or default to 30 seconds
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      console.log('Calling addAd with:', { id: newAd.id, name: newAd.name, duration: newAd.duration });
      await addAd(newAd);
      console.log('addAd completed successfully');

      setAdName('');
      setSelectedFile(null);
      setShowUploadForm(false);
      toast.success('Ad uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload ad:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload ad. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleAd = async (ad: Ad) => {
    try {
      await updateAd({
        ...ad,
        enabled: !ad.enabled,
      });
      toast.success(ad.enabled ? 'Ad disabled' : 'Ad enabled');
    } catch (error) {
      console.error('Failed to toggle ad:', error);
      toast.error('Failed to update ad. Please try again.');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await deleteAd(adId);
      toast.success('Ad deleted successfully');
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error('Failed to delete ad. Please try again.');
    }
  };

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
            <h1 className="text-4xl font-bold text-gray-900">Advertisement Management</h1>
            <p className="text-gray-600 mt-2">{tournament.name}</p>
          </div>

          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Upload Advertisement
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Upload New Advertisement</h3>
            <form onSubmit={handleUploadAd} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertisement Name *
                </label>
                <input
                  type="text"
                  value={adName}
                  onChange={(e) => setAdName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Sponsor Ad, Half-Time Commercial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File * (Max 100MB)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-upload"
                    required
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    {selectedFile ? (
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          Click to upload video
                        </p>
                        <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Advertisement'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ads Grid */}
        {tournamentAds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Film className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Advertisements Yet</h3>
            <p className="text-gray-600 mb-6">Upload video advertisements to display during matches</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournamentAds.map((ad) => (
              <div
                key={ad.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                  !ad.enabled ? 'opacity-60' : ''
                }`}
              >
                {/* Video Preview */}
                <div className="relative bg-gray-900 aspect-video">
                  <video
                    src={ad.filePath}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <button
                      onClick={() => setPreviewAd(ad)}
                      className="p-4 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Play className="w-8 h-8 text-gray-900" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ad.enabled
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {ad.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Ad Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{ad.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>{ad.duration} seconds</span>
                    <span>•</span>
                    <span>{ad.type}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewAd(ad)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleToggleAd(ad)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        ad.enabled
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {ad.enabled ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setAdToDelete(ad.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ad Preview Modal */}
        {previewAd && (
          <AdPlayer
            ad={previewAd}
            onClose={() => setPreviewAd(null)}
            autoPlay={true}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setAdToDelete(null);
          }}
          onConfirm={() => {
            if (adToDelete) {
              handleDeleteAd(adToDelete);
              setAdToDelete(null);
            }
          }}
          title="Delete Advertisement"
          message="Are you sure you want to delete this advertisement? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default AdManagement;
