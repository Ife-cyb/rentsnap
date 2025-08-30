import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface VideoTour {
  id: string;
  property_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  landlord_id: string;
  properties?: {
    title: string;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    price: number;
  };
  user_profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export const useVideoTours = (propertyId?: string) => {
  const { user } = useAuth();
  const [videoTours, setVideoTours] = useState<VideoTour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchVideoTours = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getVideoTours(propertyId);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setVideoTours(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video tours';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, propertyId]);

  const uploadVideoTour = async (
    propertyId: string, 
    videoFile: File, 
    thumbnailFile: File | null, 
    title: string, 
    description: string, 
    duration: number
  ) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
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
      }, 500);
      
      // Upload video file
      const { data: uploadData, error: uploadError } = await storage.uploadVideoTour(
        propertyId, 
        videoFile, 
        thumbnailFile || undefined
      );
      
      clearInterval(progressInterval);
      
      if (uploadError) {
        setError(uploadError.message);
        setUploadProgress(0);
        return { success: false, error: uploadError.message };
      }
      
      setUploadProgress(95);
      
      // Create video tour record in database
      const { data: tourData, error: tourError } = await db.createVideoTour({
        property_id: propertyId,
        title,
        description,
        video_url: uploadData.videoUrl,
        thumbnail_url: uploadData.thumbnailUrl || '',
        duration,
        landlord_id: user.id
      });
      
      if (tourError) {
        setError(tourError.message);
        setUploadProgress(0);
        return { success: false, error: tourError.message };
      }
      
      setUploadProgress(100);
      
      // Refresh video tours list
      await fetchVideoTours();
      
      return { success: true, data: tourData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video tour';
      setError(errorMessage);
      setUploadProgress(0);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const incrementViews = async (tourId: string) => {
    try {
      await db.incrementVideoTourViews(tourId);
      
      // Update local state
      setVideoTours(prev => 
        prev.map(tour => 
          tour.id === tourId 
            ? { ...tour, views: tour.views + 1 } 
            : tour
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const likeVideoTour = async (tourId: string) => {
    try {
      await db.incrementVideoTourLikes(tourId);
      
      // Update local state
      setVideoTours(prev => 
        prev.map(tour => 
          tour.id === tourId 
            ? { ...tour, likes: tour.likes + 1 } 
            : tour
        )
      );
    } catch (err) {
      console.error('Error liking video tour:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideoTours();
    }
  }, [user, fetchVideoTours]);

  return {
    videoTours,
    loading,
    error,
    uploading,
    uploadProgress,
    fetchVideoTours,
    uploadVideoTour,
    incrementViews,
    likeVideoTour
  };
};