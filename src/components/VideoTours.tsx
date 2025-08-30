import React, { useState, useRef, useEffect } from 'react';
import { useVideoTours } from '../hooks/useVideoTours';
import { useAuth } from '../hooks/useAuth';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Share, 
  Heart, MessageCircle, Upload, Loader, X, Clock, Eye, Plus
} from 'lucide-react';

interface VideoToursProps {
  propertyId?: string;
}

const VideoTours: React.FC<VideoToursProps> = ({ propertyId }) => {
  const { user, profile } = useAuth();
  const { 
    videoTours, 
    loading, 
    error, 
    uploading, 
    uploadProgress,
    uploadVideoTour, 
    incrementViews, 
    likeVideoTour 
  } = useVideoTours(propertyId);
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    duration: 0
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset video state when changing videos
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [currentVideoIndex]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      nextVideo();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      // Record view when video metadata is loaded
      if (videoTours.length > 0) {
        incrementViews(videoTours[currentVideoIndex].id);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentVideoIndex, videoTours, incrementViews]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showControls]);

  const togglePlay = () => {
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
    setIsMuted(video.muted);
  };

  const nextVideo = () => {
    if (videoTours.length === 0) return;
    
    const nextIndex = (currentVideoIndex + 1) % videoTours.length;
    setCurrentVideoIndex(nextIndex);
  };

  const previousVideo = () => {
    if (videoTours.length === 0) return;
    
    const prevIndex = currentVideoIndex === 0 ? videoTours.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
  };

  const handleVideoClick = () => {
    togglePlay();
    setShowControls(true);
  };

  const handleShare = async () => {
    if (videoTours.length === 0) return;
    
    const currentVideo = videoTours[currentVideoIndex];
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentVideo.title,
          text: currentVideo.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleLike = () => {
    if (videoTours.length === 0) return;
    
    likeVideoTour(videoTours[currentVideoIndex].id);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }
    
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('Video must be less than 100MB');
      return;
    }
    
    setUploadData(prev => ({ ...prev, videoFile: file }));
    
    // Create a temporary URL for the video to get its duration
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = () => {
      setUploadData(prev => ({ 
        ...prev, 
        duration: Math.round(videoElement.duration) 
      }));
      URL.revokeObjectURL(videoElement.src);
    };
    
    videoElement.src = URL.createObjectURL(file);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Thumbnail must be less than 5MB');
      return;
    }
    
    setUploadData(prev => ({ ...prev, thumbnailFile: file }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !propertyId || !uploadData.videoFile) {
      alert('Missing required information');
      return;
    }
    
    const result = await uploadVideoTour(
      propertyId,
      uploadData.videoFile,
      uploadData.thumbnailFile,
      uploadData.title,
      uploadData.description,
      uploadData.duration
    );
    
    if (result.success) {
      setShowUploadModal(false);
      setUploadData({
        title: '',
        description: '',
        videoFile: null,
        thumbnailFile: null,
        duration: 0
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if user is a landlord
  const isLandlord = profile?.user_type === 'landlord';

  if (loading && videoTours.length === 0) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading video tours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (videoTours.length === 0) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Video Tours Available</h3>
          <p className="text-gray-300 mb-6">
            {propertyId 
              ? "This property doesn't have any video tours yet." 
              : "No video tours available at the moment."}
          </p>
          
          {isLandlord && propertyId && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2 inline-block" />
              Add Video Tour
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentVideo = videoTours[currentVideoIndex];

  return (
    <div className="flex-1 bg-black relative overflow-hidden" ref={containerRef}>
      {/* Video Player */}
      <video
        ref={videoRef}
        src={currentVideo.video_url}
        poster={currentVideo.thumbnail_url}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        playsInline
        muted={isMuted}
      />

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-black/20">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <img
                src={currentVideo.user_profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                alt={currentVideo.user_profiles?.full_name || 'Landlord'}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{currentVideo.user_profiles?.full_name || 'Landlord'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-4 right-4">
            <div className="flex items-center justify-between text-white mb-2">
              <span className="text-sm">
                {videoRef.current 
                  ? formatDuration(videoRef.current.currentTime) 
                  : '0:00'}
              </span>
              <span className="text-sm">
                {formatDuration(currentVideo.duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Property Info Overlay */}
      <div className="absolute bottom-20 left-4 right-4 text-white">
        <h3 className="text-xl font-bold mb-1">{currentVideo.title}</h3>
        <p className="text-white/80 mb-2">{currentVideo.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span>${currentVideo.properties?.price?.toLocaleString() || 'N/A'}/mo</span>
            <span>
              {currentVideo.properties?.bedrooms || 'N/A'} bed • {currentVideo.properties?.bathrooms || 'N/A'} bath
            </span>
            <span>
              {currentVideo.properties?.city || 'N/A'}, {currentVideo.properties?.state || 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span>{currentVideo.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{currentVideo.likes} likes</span>
          </div>
        </div>
      </div>

      {/* Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
        <button 
          onClick={handleLike}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <Heart className="w-6 h-6" />
        </button>
        <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <MessageCircle className="w-6 h-6" />
        </button>
        <button
          onClick={handleShare}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <Share className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            setCurrentVideoIndex(0);
            setProgress(0);
            setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.pause();
            }
          }}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {videoTours.length > 1 && (
        <>
          <button
            onClick={previousVideo}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            ←
          </button>
          <button
            onClick={nextVideo}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            →
          </button>
        </>
      )}

      {/* Video Counter */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-3 py-1 text-white text-sm">
        {currentVideoIndex + 1} / {videoTours.length}
      </div>

      {/* Add Video Button (for landlords) */}
      {isLandlord && propertyId && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="absolute top-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Video Tour</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {uploading ? (
              <div className="text-center py-8">
                <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Uploading video tour...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
                  <input
                    type="text"
                    required
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Full Tour of Modern Downtown Loft"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what viewers will see in this video tour..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {uploadData.videoFile ? (
                      <div>
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">{uploadData.videoFile.name}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {(uploadData.videoFile.size / (1024 * 1024)).toFixed(2)} MB • 
                          {uploadData.duration > 0 ? ` ${formatDuration(uploadData.duration)}` : ''}
                        </p>
                        <button
                          type="button"
                          onClick={() => setUploadData(prev => ({ ...prev, videoFile: null, duration: 0 }))}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drag and drop a video file, or click to browse
                        </p>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors inline-block cursor-pointer"
                        >
                          Select Video
                        </label>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 100MB. Supported formats: MP4, MOV, WebM
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {uploadData.thumbnailFile ? (
                      <div>
                        <div className="w-32 h-24 mx-auto mb-2 relative">
                          <img
                            src={URL.createObjectURL(uploadData.thumbnailFile)}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{uploadData.thumbnailFile.name}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {(uploadData.thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setUploadData(prev => ({ ...prev, thumbnailFile: null }))}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-2">
                          Add a custom thumbnail image
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailFileChange}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <label
                          htmlFor="thumbnail-upload"
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block cursor-pointer"
                        >
                          Select Image
                        </label>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadData.videoFile || !uploadData.title}
                    className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Video
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTours;