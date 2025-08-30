import { useState, useEffect, useCallback } from 'react';
import { db, realtime, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface VirtualShowing {
  id: string;
  property_id: string;
  host_id: string;
  title: string;
  description?: string;
  scheduled_time: string;
  duration: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meeting_url?: string;
  recording_url?: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    address: string;
    city: string;
    state: string;
    property_images: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
  host?: {
    full_name: string;
    avatar_url: string;
    user_type: 'tenant' | 'landlord';
  };
  showing_participants?: Array<{
    id: string;
    user_id: string;
    role: 'host' | 'viewer';
    is_muted: boolean;
    is_video_on: boolean;
    joined_at?: string;
    left_at?: string;
  }>;
}

export interface ShowingParticipant {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  role: 'host' | 'viewer';
  is_muted: boolean;
  is_video_on: boolean;
  joined_at: string;
}

export const useVirtualShowings = (propertyId?: string) => {
  const { user } = useAuth();
  const [showings, setShowings] = useState<VirtualShowing[]>([]);
  const [activeShowing, setActiveShowing] = useState<VirtualShowing | null>(null);
  const [participants, setParticipants] = useState<ShowingParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const fetchShowings = useCallback(async (filters?: any) => {
    if (!user) return;
    
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const showingFilters = {
        ...filters,
        propertyId
      };
      
      const { data, error: fetchError } = await db.getVirtualShowings(showingFilters);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setShowings(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch virtual showings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, propertyId]);

  const createShowing = async (showingData: Partial<VirtualShowing>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const fullShowingData = {
        ...showingData,
        host_id: user.id,
        status: 'scheduled'
      };
      
      const { data, error: createError } = await db.createVirtualShowing(fullShowingData);
      
      if (createError) {
        setError(createError.message);
        return { success: false, error: createError.message };
      }
      
      // Refresh showings list
      await fetchShowings();
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create virtual showing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const startShowing = async (showingId: string, meetingUrl: string) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }

    try {
      setError(null);
      
      const { error: startError } = await db.startVirtualShowing(showingId, meetingUrl);
      
      if (startError) {
        setError(startError.message);
        return { success: false, error: startError.message };
      }
      
      // Update local state
      setShowings(prev => 
        prev.map(showing => 
          showing.id === showingId 
            ? { ...showing, status: 'live', meeting_url: meetingUrl } 
            : showing
        )
      );
      
      // Set active showing
      const showing = showings.find(s => s.id === showingId);
      if (showing) {
        setActiveShowing({ ...showing, status: 'live', meeting_url: meetingUrl });
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start virtual showing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const endShowing = async (showingId: string, recordingUrl?: string) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }

    try {
      setError(null);
      
      const { error: endError } = await db.endVirtualShowing(showingId, recordingUrl);
      
      if (endError) {
        setError(endError.message);
        return { success: false, error: endError.message };
      }
      
      // Update local state
      setShowings(prev => 
        prev.map(showing => 
          showing.id === showingId 
            ? { 
                ...showing, 
                status: 'completed', 
                recording_url: recordingUrl || showing.recording_url 
              } 
            : showing
        )
      );
      
      // Clear active showing
      setActiveShowing(null);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end virtual showing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const joinShowing = async (showingId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      // Find the showing
      const showing = showings.find(s => s.id === showingId);
      if (!showing) {
        const error = 'Showing not found';
        setError(error);
        return { success: false, error };
      }
      
      // Determine if user is host
      const userIsHost = showing.host_id === user.id;
      setIsHost(userIsHost);
      
      // Join the showing
      const { data, error: joinError } = await db.joinVirtualShowing(
        showingId, 
        user.id, 
        userIsHost ? 'host' : 'viewer'
      );
      
      if (joinError) {
        setError(joinError.message);
        return { success: false, error: joinError.message };
      }
      
      setParticipantId(data as string);
      setActiveShowing(showing);
      
      // Fetch participants
      await fetchParticipants(showingId);
      
      return { success: true, isHost: userIsHost, showing };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join virtual showing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const leaveShowing = async () => {
    if (!user || !activeShowing || !participantId) {
      return { success: false, error: 'Not in an active showing' };
    }
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      const { error: leaveError } = await db.leaveVirtualShowing(activeShowing.id, user.id);
      
      if (leaveError) {
        setError(leaveError.message);
        return { success: false, error: leaveError.message };
      }
      
      // Clear active showing and participant info
      setActiveShowing(null);
      setParticipantId(null);
      setIsHost(false);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave virtual showing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const fetchParticipants = async (showingId: string) => {
    if (!supabaseConfigured) {
      console.log('Database not configured. Cannot fetch participants.');
      return;
    }

    try {
      const { data, error: participantsError } = await db.getActiveShowingParticipants(showingId);
      
      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }
      
      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const updateParticipantStatus = async (updates: { is_muted?: boolean; is_video_on?: boolean }) => {
    if (!participantId) {
      return { success: false, error: 'Not a participant in any showing' };
    }
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      return { success: false, error };
    }
    
    try {
      const { error: updateError } = await db.updateParticipantStatus(participantId, updates);
      
      if (updateError) {
        console.error('Error updating participant status:', updateError);
        return { success: false, error: updateError.message };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error updating participant status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      return { success: false, error: errorMessage };
    }
  };

  // Subscribe to showing updates
  useEffect(() => {
    if (!user || !supabaseConfigured) return;

    const subscription = realtime.subscribeToVirtualShowings((payload) => {
      if (payload.eventType === 'INSERT') {
        // New showing created
        setShowings(prev => [payload.new as VirtualShowing, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        // Showing updated
        setShowings(prev => 
          prev.map(showing => 
            showing.id === payload.new.id ? payload.new as VirtualShowing : showing
          )
        );
        
        // Update active showing if it's the one that changed
        if (activeShowing && activeShowing.id === payload.new.id) {
          setActiveShowing(payload.new as VirtualShowing);
        }
      } else if (payload.eventType === 'DELETE') {
        // Showing deleted
        setShowings(prev => prev.filter(showing => showing.id !== payload.old.id));
        
        // Clear active showing if it's the one that was deleted
        if (activeShowing && activeShowing.id === payload.old.id) {
          setActiveShowing(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, activeShowing]);

  // Subscribe to participants updates when in a showing
  useEffect(() => {
    if (!activeShowing || !supabaseConfigured) return;

    const subscription = realtime.subscribeToShowingParticipants(activeShowing.id, async () => {
      // Refresh participants list
      await fetchParticipants(activeShowing.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeShowing]);

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchShowings();
    }
  }, [user, fetchShowings]);

  return {
    showings,
    activeShowing,
    participants,
    loading,
    error,
    isHost,
    fetchShowings,
    createShowing,
    startShowing,
    endShowing,
    joinShowing,
    leaveShowing,
    updateParticipantStatus
  };
};