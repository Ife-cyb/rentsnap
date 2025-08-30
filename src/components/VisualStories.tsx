import React, { useState, useEffect } from 'react';
import { useVideoStories } from '../hooks/useVideoStories';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, Play, Eye, Heart, MessageCircle, Share, X, Camera, 
  Video, Loader, CheckCircle, Clock, Upload, AlertCircle
} from 'lucide-react';

interface VisualStoriesProps {
  userId?: string;
  propertyId?: string;
}

const VisualStories: React.FC<VisualStoriesProps> = ({ userId, propertyId }) => {
  const { user, profile } = useAuth();
  const { 
    stories, 
    loading, 
    error, 
    uploading, 
    uploadProgress,
    createStory, 
    viewStory, 
    likeStory 
  } = useVideoStories(userId);
  
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [storyData, setStoryData] = useState({
    mediaType: 'image' as 'image' | 'video',
    mediaFile: null as File | null,
    caption: '',
    propertyId: propertyId || '',
    duration: 0
  });

  // Progress timer for active story
  useEffect(() => {
    if (activeStory && isPlaying) {
      const duration = activeStory.media_type === 'video' 
        ? activeStory.duration || 10 
        : 5; // Default 5 seconds for images
      
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (duration * 10));
          if (newProgress >= 100) {
            nextStory();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [activeStory, isPlaying]);

  // Record view when story is opened
  useEffect(() => {
    if (activeStory) {
      viewStory(activeStory.id);
    }
  }, [activeStory]);

  const openStory = (story: any, index: number) => {
    setActiveStory(story);
    setCurrentStoryIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const closeStory = () => {
    setActiveStory(null);
    setProgress(0);
    setIsPlaying(false);
  };

  const nextStory = () => {
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < stories.length) {
      setCurrentStoryIndex(nextIndex);
      setActiveStory(stories[nextIndex]);
      setProgress(0);
    } else {
      closeStory();
    }
  };

  const previousStory = () => {
    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
      setActiveStory(stories[prevIndex]);
      setProgress(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLikeStory = () => {
    if (activeStory) {
      likeStory(activeStory.id);
    }
  };

  const handleShareStory = async () => {
    if (!activeStory) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeStory.caption,
          text: `Check out this property story from ${activeStory.user_profiles?.full_name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      alert('Please select an image or video file');
      return;
    }
    
    // Check file size
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for image
    if (file.size > maxSize) {
      alert(`File must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    setStoryData(prev => ({ 
      ...prev, 
      mediaFile: file,
      mediaType: isVideo ? 'video' : 'image'
    }));
    
    // If it's a video, get its duration
    if (isVideo) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      
      videoElement.onloadedmetadata = () => {
        setStoryData(prev => ({ 
          ...prev, 
          duration: Math.round(videoElement.duration) 
        }));
        URL.revokeObjectURL(videoElement.src);
      };
      
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !storyData.mediaFile) {
      alert('Missing required information');
      return;
    }
    
    const result = await createStory(
      storyData.mediaFile,
      storyData.mediaType,
      storyData.caption,
      storyData.propertyId || undefined,
      storyData.duration
    );
    
    if (result.success) {
      setShowCreateModal(false);
      setStoryData({
        mediaType: 'image',
        mediaFile: null,
        caption: '',
        propertyId: propertyId || '',
        duration: 0
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as { [key: string]: typeof stories });

  if (loading && stories.length === 0) {
    return (
      <div className="bg-white p-4 flex items-center justify-center">
        <Loader className="w-6 h-6 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 flex items-center justify-center">
        <div className="text-red-500 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Stories Header */}
      <div className="flex items-center space-x-4 p-4 overflow-x-auto">
        {/* Add Story Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 flex flex-col items-center space-y-2"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs text-gray-600">Add Story</span>
        </button>

        {/* User Stories */}
        {Object.entries(groupedStories).map(([userId, userStories]) => {
          const firstStory = userStories[0];
          const hasUnseenStories = userStories.some(story => story.views === 0); // Simple logic for demo
          
          return (
            <button
              key={userId}
              onClick={() => openStory(firstStory, stories.indexOf(firstStory))}
              className="flex-shrink-0 flex flex-col items-center space-y-2"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                hasUnseenStories 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gray-300'
              }`}>
                <img
                  src={firstStory.user_profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={firstStory.user_profiles?.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover bg-white p-0.5"
                />
              </div>
              <span className="text-xs text-gray-600 max-w-16 truncate">
                {firstStory.user_profiles?.full_name?.split(' ')[0] || 'User'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story Viewer */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 flex space-x-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full max-w-md mx-auto">
            {activeStory.media_type === 'image' ? (
              <img
                src={activeStory.media_url}
                alt={activeStory.caption}
                className="w-full h-full object-cover"
                onClick={togglePlayPause}
              />
            ) : (
              <video
                src={activeStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                onClick={togglePlayPause}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Story Header */}
            <div className="absolute top-16 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <img
                  src={activeStory.user_profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={activeStory.user_profiles?.full_name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium">{activeStory.user_profiles?.full_name || 'User'}</p>
                  <p className="text-xs text-white/80">{getTimeAgo(activeStory.created_at)}</p>
                </div>
              </div>
              <button
                onClick={closeStory}
                className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Caption */}
            <div className="absolute bottom-20 left-4 right-4 text-white">
              <p className="text-sm mb-2">{activeStory.caption}</p>
              {activeStory.properties && (
                <div className="bg-black/50 rounded-lg p-3">
                  <h4 className="font-medium">{activeStory.properties.title}</h4>
                  <p className="text-sm text-white/80">
                    ${activeStory.properties.price?.toLocaleString()}/mo • {activeStory.properties.city}, {activeStory.properties.state}
                  </p>
                </div>
              )}
            </div>

            {/* Story Actions */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLikeStory}
                  className="flex items-center space-x-1"
                >
                  <Heart className="w-6 h-6" />
                  <span className="text-sm">{activeStory.likes}</span>
                </button>
                <button className="flex items-center space-x-1">
                  <Eye className="w-6 h-6" />
                  <span className="text-sm">{activeStory.views}</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button>
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button onClick={handleShareStory}>
                  <Share className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Areas */}
            <button
              onClick={previousStory}
              className="absolute left-0 top-0 bottom-0 w-1/3 bg-transparent"
            />
            <button
              onClick={nextStory}
              className="absolute right-0 top-0 bottom-0 w-1/3 bg-transparent"
            />
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Story</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {uploading ? (
              <div className="text-center py-8">
                <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Uploading your story...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
              </div>
            ) : (
              <form onSubmit={handleCreateStory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer ${
                      storyData.mediaType === 'image' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="type" 
                        value="image" 
                        checked={storyData.mediaType === 'image'}
                        onChange={() => setStoryData(prev => ({ ...prev, mediaType: 'image' }))}
                        className="sr-only" 
                      />
                      <Camera className={`w-5 h-5 mr-2 ${
                        storyData.mediaType === 'image' ? 'text-purple-500' : 'text-gray-500'
                      }`} />
                      <span className={storyData.mediaType === 'image' ? 'text-purple-700' : 'text-gray-700'}>
                        Photo
                      </span>
                    </label>
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer ${
                      storyData.mediaType === 'video' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="type" 
                        value="video" 
                        checked={storyData.mediaType === 'video'}
                        onChange={() => setStoryData(prev => ({ ...prev, mediaType: 'video' }))}
                        className="sr-only" 
                      />
                      <Video className={`w-5 h-5 mr-2 ${
                        storyData.mediaType === 'video' ? 'text-purple-500' : 'text-gray-500'
                      }`} />
                      <span className={storyData.mediaType === 'video' ? 'text-purple-700' : 'text-gray-700'}>
                        Video
                      </span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {storyData.mediaFile ? (
                      <div>
                        {storyData.mediaType === 'image' ? (
                          <div className="w-32 h-32 mx-auto mb-2 relative">
                            <img
                              src={URL.createObjectURL(storyData.mediaFile)}
                              alt="Media preview"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 mx-auto mb-2 relative bg-gray-100 rounded flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-900">{storyData.mediaFile.name}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {(storyData.mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                          {storyData.mediaType === 'video' && storyData.duration > 0 && 
                            ` • ${formatDuration(storyData.duration)}`
                          }
                        </p>
                        <button
                          type="button"
                          onClick={() => setStoryData(prev => ({ 
                            ...prev, 
                            mediaFile: null,
                            duration: 0
                          }))}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {storyData.mediaType === 'image' 
                            ? 'Upload a photo for your story' 
                            : 'Upload a short video for your story'
                          }
                        </p>
                        <input
                          type="file"
                          accept={storyData.mediaType === 'image' ? 'image/*' : 'video/*'}
                          onChange={handleMediaFileChange}
                          className="hidden"
                          id="media-upload"
                        />
                        <label
                          htmlFor="media-upload"
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors inline-block cursor-pointer"
                        >
                          Select {storyData.mediaType === 'image' ? 'Photo' : 'Video'}
                        </label>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {storyData.mediaType === 'image'
                      ? 'Maximum file size: 5MB. Supported formats: JPG, PNG, WebP'
                      : 'Maximum file size: 50MB. Supported formats: MP4, MOV, WebM'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <textarea
                    name="caption"
                    rows={3}
                    value={storyData.caption}
                    onChange={(e) => setStoryData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Add a caption to your story..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {profile?.user_type === 'landlord' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Property (Optional)
                    </label>
                    <select
                      value={storyData.propertyId}
                      onChange={(e) => setStoryData(prev => ({ ...prev, propertyId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a property</option>
                      {/* In a real app, this would be populated with the landlord's properties */}
                      <option value={propertyId || ''}>Current Property</option>
                    </select>
                  </div>
                )}
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!storyData.mediaFile}
                    className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Share Story
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

export default VisualStories;