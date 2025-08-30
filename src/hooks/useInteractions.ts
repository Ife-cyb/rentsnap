import { useState, useEffect } from 'react';
import { db, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Property } from './useProperties';

export interface PropertyInteraction {
  id: string;
  user_id: string;
  property_id: string;
  interaction_type: 'like' | 'pass' | 'view' | 'save' | 'unsave';
  created_at: string;
  properties?: Property;
}

export const useInteractions = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<PropertyInteraction[]>([]);
  const [likedProperties, setLikedProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordInteraction = async (propertyId: string, type: 'like' | 'pass' | 'view' | 'save' | 'unsave') => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      const { data, error: interactionError } = await db.recordInteraction(user.id, propertyId, type);
      
      if (interactionError) {
        setError(interactionError.message);
        return { success: false, error: interactionError.message };
      }
      
      // Update local state
      setInteractions(prev => {
        const filtered = prev.filter(i => !(i.property_id === propertyId && i.interaction_type === type));
        return [...filtered, data];
      });
      
      // Refresh specific lists if needed
      if (type === 'like' || type === 'save') {
        await fetchUserInteractions();
      }
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record interaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const fetchUserInteractions = async (type?: string) => {
    if (!user) return;
    
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getUserInteractions(user.id, type);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      if (type) {
        if (type === 'like') {
          setLikedProperties(data?.map(i => i.properties).filter(Boolean) || []);
        } else if (type === 'save') {
          setSavedProperties(data?.map(i => i.properties).filter(Boolean) || []);
        }
      } else {
        setInteractions(data || []);
        
        // Separate liked and saved properties
        const liked = data?.filter(i => i.interaction_type === 'like').map(i => i.properties).filter(Boolean) || [];
        const saved = data?.filter(i => i.interaction_type === 'save').map(i => i.properties).filter(Boolean) || [];
        
        setLikedProperties(liked);
        setSavedProperties(saved);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch interactions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const likeProperty = async (propertyId: string) => {
    return await recordInteraction(propertyId, 'like');
  };

  const passProperty = async (propertyId: string) => {
    return await recordInteraction(propertyId, 'pass');
  };

  const saveProperty = async (propertyId: string) => {
    return await recordInteraction(propertyId, 'save');
  };

  const unsaveProperty = async (propertyId: string) => {
    return await recordInteraction(propertyId, 'unsave');
  };

  const viewProperty = async (propertyId: string) => {
    return await recordInteraction(propertyId, 'view');
  };

  const isPropertyLiked = (propertyId: string) => {
    return likedProperties.some(p => p.id === propertyId);
  };

  const isPropertySaved = (propertyId: string) => {
    return savedProperties.some(p => p.id === propertyId);
  };

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchUserInteractions();
    }
  }, [user]);

  return {
    interactions,
    likedProperties,
    savedProperties,
    loading,
    error,
    recordInteraction,
    likeProperty,
    passProperty,
    saveProperty,
    unsaveProperty,
    viewProperty,
    isPropertyLiked,
    isPropertySaved,
    fetchUserInteractions,
    refetch: fetchUserInteractions
  };
};