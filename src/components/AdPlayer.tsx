import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import type { Ad } from '../types';

interface AdPlayerProps {
  ad: Ad;
  onClose: () => void;
  onComplete?: () => void;
  autoPlay?: boolean;
}

const AdPlayer: React.FC<AdPlayerProps> = ({ ad, onClose, onComplete, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('AdPlayer: Loading video', { name: ad.name, filePathLength: ad.filePath?.length });

    const handleLoadedMetadata = () => {
      console.log('AdPlayer: Video metadata loaded', { duration: video.duration });
      setDuration(video.duration);
      setIsLoading(false);
      if (autoPlay) {
        video.play().catch(err => console.error('AdPlayer: Auto-play failed:', err));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      console.log('AdPlayer: Video ended');
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handlePlay = () => {
      console.log('AdPlayer: Video playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('AdPlayer: Video paused');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('AdPlayer: Video error:', e);
      console.error('AdPlayer: Video error details:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        src: ad.filePath?.substring(0, 100) + '...'
      });
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log('AdPlayer: Video can play');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay, onComplete, ad.name, ad.filePath]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      <div className="relative w-full h-full max-w-7xl max-h-screen p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ad Info */}
        <div className="absolute top-6 left-6 z-10 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-semibold">{ad.name}</p>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
          )}

          <video
            ref={videoRef}
            src={ad.filePath}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            muted={isMuted}
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                }}
              />
              <div className="flex justify-between text-white text-sm mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlayPause}
                className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>

              <button
                onClick={onClose}
                className="ml-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Close Ad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdPlayer;
