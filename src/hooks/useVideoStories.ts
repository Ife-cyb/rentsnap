import { useState, useEffect, useCallback } from 'react';
import { db, storage, realtime, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface VideoStory {
  id: string;
  user_id: string;
  property_id?: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  caption: string;
  duration?: number;
  views: number;
  likes: number;
  created_at: string;
  expires_at: string;
  user_profiles?: {
    full_name: string;
    avatar_url: string;
    user_type: 'tenant' | 'landlord';
  };
  properties?: {
    title: string;
    price: number;
    city: string;
    state: string;
  };
}

export const useVideoStories = (userId?: string) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<VideoStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchStories = useCallback(async () => {
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getVideoStories(userId);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setStories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stories';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createStory = async (
    mediaFile: File, 
    mediaType: 'image' | 'video', 
    caption: string, 
    propertyId?: string,
    duration?: number
  ) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Upload media file
      const { data: uploadData, error: uploadError } = await storage.uploadVideoStory(
        user.id, 
        mediaFile, 
        mediaType
      );
      
      clearInterval(progressInterval);
      
      if (uploadError) {
        setError(uploadError.message);
        setUploadProgress(0);
        return { success: false, error: uploadError.message };
      }
      
      setUploadProgress(95);
      
      // Create story record in database
      const storyData: any = {
        user_id: user.id,
        media_url: uploadData.url,
        media_type: mediaType,
        caption,
        duration: mediaType === 'video' ? duration || 0 : null
      };
      
      if (propertyId) {
        storyData.property_id = propertyId;
      }
      
      const { data: storyResult, error: storyError } = await db.createVideoStory(storyData);
      
      if (storyError) {
        setError(storyError.message);
        setUploadProgress(0);
        return { success: false, error: storyError.message };
      }
      
      setUploadProgress(100);
      
      // Refresh stories list
      await fetchStories();
      
      return { success: true, data: storyResult };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create story';
      setError(errorMessage);
      setUploadProgress(0);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const viewStory = async (storyId: string) => {
    if (!supabaseConfigured) {
      console.log('Database not configured. Cannot view story.');
      return;
    }

    try {
      await db.incrementStoryViews(storyId);
      
      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, views: story.views + 1 } 
            : story
        )
      );
    } catch (err) {
      console.error('Error viewing story:', err);
    }
  };

  const likeStory = async (storyId: string) => {
    if (!supabaseConfigured) {
      console.log('Database not configured. Cannot like story.');
      return;
    }

    try {
      await db.incrementStoryLikes(storyId);
      
      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: story.likes + 1 } 
            : story
        )
      );
    } catch (err) {
      console.error('Error liking story:', err);
    }
  };

  // Subscribe to new stories
  useEffect(() => {
    if (!supabaseConfigured) return;

    const subscription = realtime.subscribeToVideoStories((payload) => {
      if (payload.eventType === 'INSERT') {
        const newStory = payload.new as VideoStory;
        setStories(prev => [newStory, ...prev]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (supabaseConfigured) {
      fetchStories();
    }
  }, [fetchStories]);

  return {
    stories,
    loading,
    error,
    uploading,
    uploadProgress,
    fetchStories,
    createStory,
    viewStory,
    likeStory
  };
};