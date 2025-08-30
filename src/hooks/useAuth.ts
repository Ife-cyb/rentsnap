import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth, db, storage, supabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null
  });

  const getInitialSession = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if Supabase is configured before making any requests
      if (!supabaseConfigured) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.',
          user: null,
          session: null,
          profile: null
        }));
        return;
      }

      const { session, error } = await auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error.message);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message,
          user: null,
          session: null,
          profile: null
        }));
        return;
      }

      if (session?.user) {
        // Get user profile only if session exists and Supabase is configured
        try {
          const { data: profile, error: profileError } = await db.getUserProfile(session.user.id);
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error getting user profile:', profileError.message);
            // Don't fail the entire auth flow if profile fetch fails
            // Just log the error and continue with null profile
          }

          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            profile: profile || null,
            loading: false,
            error: null
          }));
        } catch (profileErr) {
          console.error('Profile fetch error:', profileErr);
          // Continue with session but no profile
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            profile: null,
            loading: false,
            error: null
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null
        }));
      }
    } catch (err) {
      console.error('Error getting initial session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get session';
      
      // Check if it's a network error and provide appropriate message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Unable to connect to the database. Please check your internet connection and Supabase configuration.',
          user: null,
          session: null,
          profile: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage,
          user: null,
          session: null,
          profile: null
        }));
      }
    }
  };

  useEffect(() => {
    // Get initial session with timeout handling
    const initializeAuth = async () => {
      try {
        // Early return if Supabase is not configured
        if (!supabaseConfigured) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.'
          }));
          return;
        }

        await getInitialSession();
      } catch (err) {
        console.error('Auth initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication';
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: errorMessage
          }));
        }
      }
    };

    initializeAuth();

    // Only set up auth listener if Supabase is configured
    if (!supabaseConfigured) {
      return;
    }

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile, error: profileError } = await db.getUserProfile(session.user.id);
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error getting user profile on sign in:', profileError.message);
              // Don't fail the auth flow, just log the error
            }

            setState(prev => ({
              ...prev,
              user: session.user,
              session,
              profile: profile || null,
              loading: false,
              error: null
            }));
          } catch (profileErr) {
            console.error('Profile fetch error on sign in:', profileErr);
            // Continue with session but no profile
            setState(prev => ({
              ...prev,
              user: session.user,
              session,
              profile: null,
              loading: false,
              error: null
            }));
          }
        } else if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          }));
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            loading: false,
            error: null
          }));
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication state change failed';
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: errorMessage
          }));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!supabaseConfigured) {
        const error = 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }
      
      const { data, error } = await auth.signUp(email, password, userData);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      const finalError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')
        ? 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
        : errorMessage;
      setState(prev => ({ ...prev, loading: false, error: finalError }));
      return { success: false, error: finalError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!supabaseConfigured) {
        const error = 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }
      
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      const finalError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')
        ? 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
        : errorMessage;
      setState(prev => ({ ...prev, loading: false, error: finalError }));
      return { success: false, error: finalError };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!supabaseConfigured) {
        setState(prev => ({ 
          ...prev, 
          user: null, 
          session: null, 
          profile: null, 
          loading: false, 
          error: null 
        }));
        return { success: true };
      }
      
      const { error } = await auth.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ 
        ...prev, 
        user: null, 
        session: null, 
        profile: null, 
        loading: false, 
        error: null 
      }));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      const finalError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')
        ? 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
        : errorMessage;
      setState(prev => ({ ...prev, loading: false, error: finalError }));
      return { success: false, error: finalError };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!state.user) {
      return { success: false, error: 'No user logged in' };
    }

    if (!supabaseConfigured) {
      return { success: false, error: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await db.updateUserProfile(state.user.id, updates);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ ...prev, profile: data, loading: false, error: null }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      const finalError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')
        ? 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
        : errorMessage;
      setState(prev => ({ ...prev, loading: false, error: finalError }));
      return { success: false, error: finalError };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!state.user) {
      return { success: false, error: 'No user logged in' };
    }

    if (!supabaseConfigured) {
      return { success: false, error: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Upload avatar to Supabase Storage
      const { data: uploadData, error: uploadError } = await storage.uploadAvatar(state.user.id, file);
      
      if (uploadError) {
        setState(prev => ({ ...prev, loading: false, error: uploadError.message }));
        return { success: false, error: uploadError.message };
      }

      // Update profile with new avatar URL
      const { data: profileData, error: profileError } = await db.updateUserProfile(state.user.id, {
        avatar_url: uploadData.url
      });
      
      if (profileError) {
        setState(prev => ({ ...prev, loading: false, error: profileError.message }));
        return { success: false, error: profileError.message };
      }

      setState(prev => ({ ...prev, profile: profileData, loading: false, error: null }));
      return { success: true, data: { url: uploadData.url, profile: profileData } };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar upload failed';
      const finalError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')
        ? 'Unable to connect to the database. Please check your internet connection and Supabase configuration.'
        : errorMessage;
      setState(prev => ({ ...prev, loading: false, error: finalError }));
      return { success: false, error: finalError };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadAvatar,
    clearError,
    isAuthenticated: !!state.user,
    supabaseConfigured
  };
};