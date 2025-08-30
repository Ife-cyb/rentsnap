import { useState, useEffect, useCallback } from 'react';
import { db, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  pet_friendly: boolean;
  furnished: boolean;
  parking_included: boolean;
  available_date: string;
  property_type: string;
  status: string;
  deposit_amount: number;
  lease_term_months: number;
  utilities_included: string[];
  landlord_id: string;
  created_at: string;
  updated_at: string;
  property_images: any[];
  user_profiles: any;
}

interface UsePropertiesState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export const useProperties = (filters?: any) => {
  const [state, setState] = useState<UsePropertiesState>({
    properties: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0
  });

  const fetchProperties = useCallback(async (customFilters?: any, loadMore = false) => {
    if (!supabaseConfigured) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Database not configured. Please set up Supabase credentials.' 
      }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }));
      
      const currentPage = loadMore ? state.page + 1 : 0;
      const limit = 10; // Pagination for better performance
      const offset = currentPage * limit;
      
      const { data, error } = await db.getProperties({
        ...customFilters || filters,
        limit,
        offset
      });
      
      if (error) {
        console.error('Properties fetch error:', error.message);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message
        }));
        return;
      }

      const newProperties = data || [];
      const hasMore = newProperties.length === limit;

      setState(prev => ({
        ...prev,
        properties: loadMore ? [...prev.properties, ...newProperties] : newProperties,
        loading: false,
        error: null,
        hasMore,
        page: currentPage
      }));
    } catch (err) {
      console.error('Properties fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
    }
  }, [filters, state.page]);

  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      fetchProperties(filters, true);
    }
  }, [fetchProperties, filters, state.loading, state.hasMore]);

  useEffect(() => {
    if (supabaseConfigured) {
      fetchProperties();
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!supabaseConfigured) {
      setState(prev => ({ 
        ...prev, 
        error: 'Database not configured. Please set up Supabase credentials.' 
      }));
      return;
    }
    setState(prev => ({ ...prev, page: 0, hasMore: true }));
    await fetchProperties();
  }, [fetchProperties]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const createProperty = useCallback(async (propertyData: any) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await db.createProperty(propertyData);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Refresh properties list
      await refetch();
      
      setState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create property';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [refetch]);

  return {
    ...state,
    fetchProperties,
    createProperty,
    loadMore,
    refetch,
    clearError
  };
};

export const useProperty = (propertyId: string) => {
  const [state, setState] = useState<{
    property: Property | null;
    loading: boolean;
    error: string | null;
  }>({
    property: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setState(prev => ({ ...prev, loading: false, error: 'No property ID provided' }));
        return;
      }

      if (!supabaseConfigured) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Database not configured. Please set up Supabase credentials.' 
        }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const { data, error } = await db.getProperty(propertyId);
        
        if (error) {
          console.error('Property fetch error:', error.message);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: error.message,
            property: null
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          property: data,
          loading: false,
          error: null
        }));
      } catch (err) {
        console.error('Property fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch property';
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage,
          property: null
        }));
      }
    };

    fetchProperty();
  }, [propertyId]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    clearError
  };
};

// Hook for landlord's properties
export const useLandlordProperties = () => {
  const { user } = useAuth();
  const [state, setState] = useState<{
    properties: Property[];
    loading: boolean;
    error: string | null;
  }>({
    properties: [],
    loading: false,
    error: null
  });

  const fetchLandlordProperties = useCallback(async () => {
    if (!user) return;

    if (!supabaseConfigured) {
      setState(prev => ({ 
        ...prev, 
        error: 'Database not configured. Please set up Supabase credentials.' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await db.getLandlordProperties(user.id);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      setState(prev => ({
        ...prev,
        properties: data || [],
        loading: false,
        error: null
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [user]);

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchLandlordProperties();
    }
  }, [user, fetchLandlordProperties]);

  const updateProperty = useCallback(async (propertyId: string, updates: any) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await db.updateProperty(propertyId, updates);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        properties: prev.properties.map(p => p.id === propertyId ? { ...p, ...updates } : p),
        loading: false,
        error: null
      }));

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await db.deleteProperty(propertyId);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        properties: prev.properties.filter(p => p.id !== propertyId),
        loading: false,
        error: null
      }));

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    ...state,
    refetch: fetchLandlordProperties,
    updateProperty,
    deleteProperty
  };
};