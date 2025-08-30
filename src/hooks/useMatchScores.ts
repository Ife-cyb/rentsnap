import { useState, useEffect } from 'react';
import { db, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Property } from './useProperties';

export interface MatchScore {
  id: string;
  user_id: string;
  property_id: string;
  score: number;
  factors: {
    budget_score?: number;
    bedroom_score?: number;
    amenity_score?: number;
    location_score?: number;
    feature_score?: number;
    total_score?: number;
  };
  created_at: string;
  updated_at: string;
  properties?: Property;
}

export const useMatchScores = () => {
  const { user } = useAuth();
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchScores = async () => {
    if (!user) return;
    
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getMatchScores(user.id);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setMatchScores(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch match scores';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = async (propertyId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      const { data, error: calcError } = await db.calculateMatchScore(user.id, propertyId);
      
      if (calcError) {
        setError(calcError.message);
        return { success: false, error: calcError.message };
      }
      
      // Refresh match scores
      await fetchMatchScores();
      
      return { success: true, score: data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate match score';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateAllMatchScores = async () => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error: updateError } = await db.updateUserMatchScores(user.id);
      
      if (updateError) {
        setError(updateError.message);
        return { success: false, error: updateError.message };
      }
      
      // Refresh match scores
      await fetchMatchScores();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update match scores';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getPropertyMatchScore = (propertyId: string): number => {
    const match = matchScores.find(m => m.property_id === propertyId);
    return match?.score || 0;
  };

  const getTopMatches = (limit: number = 10): MatchScore[] => {
    return matchScores
      .filter(m => m.properties)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchMatchScores();
    }
  }, [user]);

  return {
    matchScores,
    loading,
    error,
    fetchMatchScores,
    calculateMatchScore,
    updateAllMatchScores,
    getPropertyMatchScore,
    getTopMatches,
    refetch: fetchMatchScores
  };
};