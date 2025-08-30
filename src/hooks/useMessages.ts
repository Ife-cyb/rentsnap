import { useState, useEffect } from 'react';
import { db, realtime, supabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  read_at?: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    property_images: Array<{ image_url: string }>;
  };
  tenant?: {
    full_name: string;
    avatar_url?: string;
  };
  landlord?: {
    full_name: string;
    avatar_url?: string;
  };
  messages?: Message[];
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) return;
    
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await db.getConversations(user.id);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setConversations(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!supabaseConfigured) {
      setError('Database not configured. Please set up Supabase credentials.');
      return;
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await db.getMessages(conversationId);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
    }
  };

  const createConversation = async (propertyId: string, landlordId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      const { data, error: createError } = await db.createConversation(propertyId, user.id, landlordId);
      
      if (createError) {
        setError(createError.message);
        return { success: false, error: createError.message };
      }
      
      // Refresh conversations
      await fetchConversations();
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }
    
    try {
      setError(null);
      
      const { data, error: sendError } = await db.sendMessage(conversationId, user.id, content);
      
      if (sendError) {
        setError(sendError.message);
        return { success: false, error: sendError.message };
      }
      
      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), data]
      }));
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!supabaseConfigured) {
      const error = 'Database not configured. Please set up Supabase credentials.';
      setError(error);
      return { success: false, error };
    }

    try {
      setError(null);
      
      const { error: readError } = await db.markMessageAsRead(messageId);
      
      if (readError) {
        setError(readError.message);
        return { success: false, error: readError.message };
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark message as read';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !supabaseConfigured) return;

    const conversationSubscription = realtime.subscribeToConversations(user.id, (payload) => {
      console.log('Conversation update:', payload);
      fetchConversations();
    });

    return () => {
      conversationSubscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (user && supabaseConfigured) {
      fetchConversations();
    }
  }, [user]);

  const subscribeToMessages = (conversationId: string) => {
    if (!supabaseConfigured) {
      console.log('Database not configured. Cannot subscribe to messages.');
      return { unsubscribe: () => {} };
    }

    return realtime.subscribeToMessages(conversationId, (payload) => {
      console.log('New message:', payload);
      if (payload.eventType === 'INSERT') {
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), payload.new]
        }));
      }
    });
  };

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    subscribeToMessages,
    refetch: fetchConversations
  };
};