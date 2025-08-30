import { useState, useEffect } from 'react';
import { db, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UserPreferences {
  id: string;
  user_id: string;
  budget_min: number;
  budget_max: number;
  preferred_bedrooms: number[];
  search_radius: number;
  preferred_amenities: string[];
  pet_friendly: boolean;
  furnished_preferred: boolean;
  parking_required: boolean;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  created_at: string;
  updated_at: string;
}

export const usePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    if (!user) return;
    
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getUserPreferences(user.id);
      
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        setError(fetchError.message);
        return;
      }
      
      setPreferences(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preferences';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: updateError } = await db.upsertUserPreferences(user.id, updates);
      
      if (updateError) {
        setError(updateError.message);
        return { success: false, error: updateError.message };
      }
      
      setPreferences(data);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPreferences = async () => {
    const defaultPreferences = {
      budget_min: 1000,
      budget_max: 5000,
      preferred_bedrooms: [1, 2],
      search_radius: 10,
      preferred_amenities: [],
      pet_friendly: false,
      furnished_preferred: false,
      parking_required: false
    };
    
    return await updatePreferences(defaultPreferences);
  };

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchPreferences();
    }
  }, [user]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
    refetch: fetchPreferences
  };
};