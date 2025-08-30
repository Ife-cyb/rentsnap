import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'https://your-project-ref.supabase.co' &&
         supabaseAnonKey !== 'your-anon-key-here' &&
         supabaseUrl.includes('.supabase.co');
};

if (!isSupabaseConfigured()) {
  console.error('Supabase is not properly configured. Please set up your Supabase project and update the environment variables.');
}

// Create the Supabase client with optimized configuration
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey
        },
        fetch: (url, options = {}) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased from 15000 to 30000
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => {
            clearTimeout(timeoutId);
          });
        }
      }
    })
  : null;

// Helper function to create a timeout promise with longer timeouts
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => { // Increased from 15000 to 30000
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Helper function to retry failed requests with exponential backoff
const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, // Increased from 2 to 3
  baseDelay: number = 1000, // Increased from 500 to 1000
  timeoutMs: number = 30000 // Increased from 15000 to 30000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Auth helpers with improved error handling and timeout
export const auth = {
  signUp: async (email: string, password: string, userData: any) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.' } 
      };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        });
      }, 3, 1000, 30000); // Increased timeouts
      
      if (result.error) {
        console.error('Auth signup error:', result.error);
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your internet connection and try again.';
      return { 
        data: null, 
        error: { message: errorMessage } 
      };
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please click "Connect to Supabase" in the top right to set up your database.' } 
      };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.auth.signInWithPassword({
          email,
          password
        });
      }, 3, 1000, 30000); // Increased timeouts
      
      if (result.error) {
        console.error('Auth signin error:', result.error);
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (err) {
      console.error('Signin error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your internet connection and try again.';
      return { 
        data: null, 
        error: { message: errorMessage } 
      };
    }
  },

  signOut: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.auth.signOut();
      }, 3, 1000, 20000); // Increased timeout
      
      if (result.error) {
        console.error('Auth signout error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Signout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error during sign out.';
      return { error: { message: errorMessage } };
    }
  },

  getCurrentUser: async () => {
    if (!supabase) {
      return { user: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.auth.getUser();
      }, 3, 1000, 20000); // Increased timeout
      
      if (result.error) {
        console.error('Get user error:', result.error);
      }
      return { user: result.data.user, error: result.error };
    } catch (err) {
      console.error('Get user error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error getting user.';
      return { user: null, error: { message: errorMessage } };
    }
  },

  getSession: async () => {
    if (!supabase) {
      return { session: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.auth.getSession();
      }, 3, 1000, 20000); // Increased timeout
      
      if (result.error) {
        console.error('Get session error:', result.error);
      }
      return { session: result.data.session, error: result.error };
    } catch (err) {
      console.error('Get session error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error getting session.';
      return { session: null, error: { message: errorMessage } };
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    try {
      return supabase.auth.onAuthStateChange(callback);
    } catch (err) {
      console.error('Auth state change error:', err);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

// Storage helpers for file uploads
export const storage = {
  uploadAvatar: async (userId: string, file: File) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await withRetry(async () => {
        return await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
      }, 3, 1000, 60000); // Longer timeout for file uploads
      
      if (error) {
        console.error('Avatar upload error:', error);
        return { data: null, error };
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      return { 
        data: { 
          path: data.path, 
          url: publicUrl 
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar.';
      return { data: null, error: { message: errorMessage } };
    }
  },
  
  uploadPropertyImage: async (propertyId: string, file: File, isPrimary: boolean = false) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${propertyId}/${isPrimary ? 'primary' : 'image'}-${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await withRetry(async () => {
        return await supabase.storage
          .from('property-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
      }, 3, 1000, 60000); // Longer timeout for file uploads
      
      if (error) {
        console.error('Property image upload error:', error);
        return { data: null, error };
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);
      
      return { 
        data: { 
          path: data.path, 
          url: publicUrl 
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Property image upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload property image.';
      return { data: null, error: { message: errorMessage } };
    }
  },
  
  uploadVideoTour: async (propertyId: string, videoFile: File, thumbnailFile?: File) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      // Create unique file paths
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${propertyId}/tour-${Date.now()}.${videoExt}`;
      
      // Upload the video file
      const { data: videoData, error: videoError } = await withRetry(async () => {
        return await supabase.storage
          .from('video-tours')
          .upload(videoPath, videoFile, {
            cacheControl: '3600',
            upsert: true
          });
      }, 3, 2000, 120000); // Much longer timeout for video uploads
      
      if (videoError) {
        console.error('Video tour upload error:', videoError);
        return { data: null, error: videoError };
      }
      
      // Get the video public URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('video-tours')
        .getPublicUrl(videoData.path);
      
      let thumbnailUrl = '';
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailExt = thumbnailFile.name.split('.').pop();
        const thumbnailPath = `${propertyId}/thumbnail-${Date.now()}.${thumbnailExt}`;
        
        const { data: thumbnailData, error: thumbnailError } = await withRetry(async () => {
          return await supabase.storage
            .from('video-tours')
            .upload(thumbnailPath, thumbnailFile, {
              cacheControl: '3600',
              upsert: true
            });
        }, 3, 1000, 60000);
        
        if (thumbnailError) {
          console.error('Thumbnail upload error:', thumbnailError);
          // Continue without thumbnail
        } else {
          // Get the thumbnail public URL
          const { data: { publicUrl } } = supabase.storage
            .from('video-tours')
            .getPublicUrl(thumbnailData.path);
          
          thumbnailUrl = publicUrl;
        }
      }
      
      return { 
        data: { 
          videoPath: videoData.path, 
          videoUrl,
          thumbnailUrl
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Video tour upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video tour.';
      return { data: null, error: { message: errorMessage } };
    }
  },
  
  uploadVideoStory: async (userId: string, file: File, mediaType: 'image' | 'video') => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${mediaType}-${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await withRetry(async () => {
        return await supabase.storage
          .from('video-stories')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
      }, 3, 1000, mediaType === 'video' ? 90000 : 60000); // Longer timeout for videos
      
      if (error) {
        console.error('Story upload error:', error);
        return { data: null, error };
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-stories')
        .getPublicUrl(data.path);
      
      return { 
        data: { 
          path: data.path, 
          url: publicUrl 
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Story upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload story.';
      return { data: null, error: { message: errorMessage } };
    }
  }
};

// Database helpers with improved error handling and caching
export const db = {
  // User profiles
  getUserProfile: async (userId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      }, 3, 1000, 20000); // Increased timeout
      
      if (result.error) {
        console.error('Get user profile error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get user profile error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching user profile.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  updateUserProfile: async (userId: string, updates: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Update user profile error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Update user profile error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error updating user profile.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // User preferences
  getUserPreferences: async (userId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      }, 3, 1000, 20000); // Increased timeout
      
      if (result.error && result.error.code !== 'PGRST116') {
        console.error('Get user preferences error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get user preferences error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching user preferences.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  upsertUserPreferences: async (userId: string, preferences: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('user_preferences')
          .upsert({ user_id: userId, ...preferences })
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Upsert user preferences error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Upsert user preferences error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error updating user preferences.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // Properties with pagination and optimized queries
  getProperties: async (filters?: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let query = supabase
          .from('properties')
          .select(`
            id,
            title,
            description,
            price,
            bedrooms,
            bathrooms,
            square_feet,
            address,
            city,
            state,
            zip_code,
            amenities,
            pet_friendly,
            furnished,
            parking_included,
            available_date,
            property_type,
            status,
            deposit_amount,
            lease_term_months,
            utilities_included,
            landlord_id,
            created_at,
            updated_at,
            property_images(image_url, alt_text, display_order, is_primary),
            user_profiles!properties_landlord_id_fkey(full_name, avatar_url)
          `)
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters) {
          if (filters.minPrice) query = query.gte('price', filters.minPrice);
          if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
          if (filters.bedrooms && filters.bedrooms.length > 0) {
            query = query.in('bedrooms', filters.bedrooms);
          }
          if (filters.petFriendly !== undefined) query = query.eq('pet_friendly', filters.petFriendly);
          if (filters.furnished !== undefined) query = query.eq('furnished', filters.furnished);
          if (filters.parking !== undefined) query = query.eq('parking_included', filters.parking);
          if (filters.city) query = query.ilike('city', `%${filters.city}%`);
          if (filters.state) query = query.ilike('state', `%${filters.state}%`);
          
          // Pagination
          if (filters.limit) query = query.limit(filters.limit);
          if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        } else {
          query = query.limit(20); // Default limit
        }

        return await query;
      }, 3, 1000, 40000); // Increased timeout for complex queries
      
      if (result.error) {
        console.error('Get properties error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get properties error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching properties.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  getProperty: async (propertyId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('properties')
          .select(`
            *,
            property_images(*),
            user_profiles!properties_landlord_id_fkey(full_name, avatar_url, phone, email)
          `)
          .eq('id', propertyId)
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get property error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get property error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching property.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  getLandlordProperties: async (landlordId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('properties')
          .select(`
            *,
            property_images(image_url, is_primary),
            property_interactions(interaction_type, created_at),
            conversations(id, status, created_at)
          `)
          .eq('landlord_id', landlordId)
          .order('created_at', { ascending: false });
      }, 3, 1000, 40000);
      
      if (result.error) {
        console.error('Get landlord properties error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get landlord properties error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching landlord properties.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  createProperty: async (propertyData: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Create property error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Create property error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error creating property.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  updateProperty: async (propertyId: string, updates: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('properties')
          .update(updates)
          .eq('id', propertyId)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Update property error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Update property error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error updating property.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  deleteProperty: async (propertyId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('properties')
          .delete()
          .eq('id', propertyId);
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Delete property error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Delete property error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error deleting property.';
      return { error: { message: errorMessage } };
    }
  },

  // Property interactions
  recordInteraction: async (userId: string, propertyId: string, type: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('property_interactions')
          .upsert({
            user_id: userId,
            property_id: propertyId,
            interaction_type: type
          })
          .select()
          .single();
      }, 2, 500, 10000); // Faster for interactions
      
      if (result.error) {
        console.error('Record interaction error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Record interaction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error recording interaction.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  getUserInteractions: async (userId: string, type?: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let query = supabase
          .from('property_interactions')
          .select(`
            *,
            properties(*, property_images(image_url, is_primary), user_profiles!properties_landlord_id_fkey(full_name, avatar_url))
          `)
          .eq('user_id', userId);

        if (type) {
          query = query.eq('interaction_type', type);
        }

        return await query.order('created_at', { ascending: false });
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get user interactions error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get user interactions error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching user interactions.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // Conversations and messages
  getConversations: async (userId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('conversations')
          .select(`
            *,
            properties(title, property_images(image_url)),
            tenant:user_profiles!conversations_tenant_id_fkey(full_name, avatar_url),
            landlord:user_profiles!conversations_landlord_id_fkey(full_name, avatar_url),
            messages(content, created_at, sender_id)
          `)
          .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
          .eq('status', 'active')
          .order('updated_at', { ascending: false });
      }, 3, 1000, 30000);

      if (result.error) {
        console.error('Get conversations error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get conversations error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching conversations.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  createConversation: async (propertyId: string, tenantId: string, landlordId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('conversations')
          .insert({
            property_id: propertyId,
            tenant_id: tenantId,
            landlord_id: landlordId
          })
          .select()
          .single();
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Create conversation error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Create conversation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error creating conversation.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  getMessages: async (conversationId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(full_name, avatar_url)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get messages error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get messages error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching messages.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content
          })
          .select()
          .single();
      }, 2, 500, 10000); // Faster for messages
      
      if (result.error) {
        console.error('Send message error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Send message error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error sending message.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  markMessageAsRead: async (messageId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', messageId);
      }, 2, 500, 10000);
      
      if (result.error) {
        console.error('Mark message as read error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Mark message as read error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error marking message as read.';
      return { error: { message: errorMessage } };
    }
  },

  // Match scores
  getMatchScores: async (userId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('match_scores')
          .select(`
            *,
            properties(*, property_images(image_url, is_primary), user_profiles!properties_landlord_id_fkey(full_name, avatar_url))
          `)
          .eq('user_id', userId)
          .order('score', { ascending: false })
          .limit(50); // Limit for performance
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get match scores error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get match scores error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching match scores.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  calculateMatchScore: async (userId: string, propertyId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('calculate_match_score', {
          p_user_id: userId,
          p_property_id: propertyId
        });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Calculate match score error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Calculate match score error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error calculating match score.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  updateUserMatchScores: async (userId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('update_user_match_scores', {
          p_user_id: userId
        });
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Update user match scores error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Update user match scores error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error updating match scores.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // Analytics and insights
  getPropertyAnalytics: async (propertyId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('property_interactions')
          .select('interaction_type, created_at')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Get property analytics error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get property analytics error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching property analytics.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // Search functionality
  searchProperties: async (query: string, filters?: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let dbQuery = supabase
          .from('properties')
          .select(`
            *,
            property_images(image_url, is_primary),
            user_profiles!properties_landlord_id_fkey(full_name, avatar_url)
          `)
          .eq('status', 'available')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,amenities.cs.{${query}}`)
          .order('created_at', { ascending: false })
          .limit(20);

        // Apply additional filters
        if (filters) {
          if (filters.minPrice) dbQuery = dbQuery.gte('price', filters.minPrice);
          if (filters.maxPrice) dbQuery = dbQuery.lte('price', filters.maxPrice);
          if (filters.bedrooms) dbQuery = dbQuery.in('bedrooms', filters.bedrooms);
        }

        return await dbQuery;
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Search properties error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Search properties error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error searching properties.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  // Video Tours
  getVideoTours: async (propertyId?: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let query = supabase
          .from('video_tours')
          .select(`
            *,
            properties(title, city, state, bedrooms, bathrooms, price),
            user_profiles!video_tours_landlord_id_fkey(full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });
        
        if (propertyId) {
          query = query.eq('property_id', propertyId);
        }
        
        return await query;
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get video tours error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get video tours error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching video tours.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  createVideoTour: async (tourData: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('video_tours')
          .insert(tourData)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Create video tour error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Create video tour error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error creating video tour.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  incrementVideoTourViews: async (tourId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('increment_video_tour_views', {
          p_video_id: tourId
        });
      }, 2, 500, 10000);
      
      if (result.error) {
        console.error('Increment video tour views error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Increment video tour views error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error incrementing views.';
      return { error: { message: errorMessage } };
    }
  },

  incrementVideoTourLikes: async (tourId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('increment_video_tour_likes', {
          p_video_id: tourId
        });
      }, 2, 500, 10000);
      
      if (result.error) {
        console.error('Increment video tour likes error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Increment video tour likes error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error incrementing likes.';
      return { error: { message: errorMessage } };
    }
  },

  // Video Stories
  getVideoStories: async (userId?: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let query = supabase
          .from('video_stories')
          .select(`
            *,
            user_profiles!video_stories_user_id_fkey(full_name, avatar_url, user_type),
            properties(title, price, city, state)
          `)
          .lt('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // Only stories that haven't expired
          .gt('expires_at', new Date().toISOString()) // Only stories that haven't expired
          .order('created_at', { ascending: false });
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        return await query;
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get video stories error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get video stories error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching video stories.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  createVideoStory: async (storyData: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('video_stories')
          .insert(storyData)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Create video story error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Create video story error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error creating video story.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  incrementStoryViews: async (storyId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('increment_story_views', {
          p_story_id: storyId
        });
      }, 2, 500, 10000);
      
      if (result.error) {
        console.error('Increment story views error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Increment story views error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error incrementing views.';
      return { error: { message: errorMessage } };
    }
  },

  incrementStoryLikes: async (storyId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('increment_story_likes', {
          p_story_id: storyId
        });
      }, 2, 500, 10000);
      
      if (result.error) {
        console.error('Increment story likes error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Increment story likes error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error incrementing likes.';
      return { error: { message: errorMessage } };
    }
  },

  // Virtual Showings
  getVirtualShowings: async (filters?: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        let query = supabase
          .from('virtual_showings')
          .select(`
            *,
            properties(title, address, city, state, property_images(image_url, is_primary)),
            host:user_profiles!virtual_showings_host_id_fkey(full_name, avatar_url, user_type),
            showing_participants(id, user_id, role, is_muted, is_video_on, joined_at, left_at)
          `)
          .order('scheduled_time', { ascending: true });
        
        if (filters) {
          if (filters.propertyId) {
            query = query.eq('property_id', filters.propertyId);
          }
          if (filters.hostId) {
            query = query.eq('host_id', filters.hostId);
          }
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.upcoming) {
            query = query.gte('scheduled_time', new Date().toISOString());
          }
        }
        
        return await query;
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Get virtual showings error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get virtual showings error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching virtual showings.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  createVirtualShowing: async (showingData: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('virtual_showings')
          .insert(showingData)
          .select()
          .single();
      }, 3, 1000, 30000);
      
      if (result.error) {
        console.error('Create virtual showing error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Create virtual showing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error creating virtual showing.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  startVirtualShowing: async (showingId: string, meetingUrl: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        // First update the showing status
        await supabase.rpc('start_virtual_showing', {
          p_showing_id: showingId
        });
        
        // Then update the meeting URL
        return await supabase
          .from('virtual_showings')
          .update({ meeting_url: meetingUrl })
          .eq('id', showingId);
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Start virtual showing error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Start virtual showing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error starting virtual showing.';
      return { error: { message: errorMessage } };
    }
  },

  endVirtualShowing: async (showingId: string, recordingUrl?: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('end_virtual_showing', {
          p_showing_id: showingId,
          p_recording_url: recordingUrl
        });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('End virtual showing error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('End virtual showing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error ending virtual showing.';
      return { error: { message: errorMessage } };
    }
  },

  joinVirtualShowing: async (showingId: string, userId: string, role: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('join_virtual_showing', {
          p_showing_id: showingId,
          p_user_id: userId,
          p_role: role
        });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Join virtual showing error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Join virtual showing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error joining virtual showing.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  leaveVirtualShowing: async (showingId: string, userId: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('leave_virtual_showing', {
          p_showing_id: showingId,
          p_user_id: userId
        });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Leave virtual showing error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Leave virtual showing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error leaving virtual showing.';
      return { error: { message: errorMessage } };
    }
  },

  getActiveShowingParticipants: async (showingId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('get_active_showing_participants', {
          p_showing_id: showingId
        });
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Get active showing participants error:', result.error);
      }
      return { data: result.data, error: result.error };
    } catch (err) {
      console.error('Get active showing participants error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching participants.';
      return { data: null, error: { message: errorMessage } };
    }
  },

  updateParticipantStatus: async (participantId: string, updates: { is_muted?: boolean; is_video_on?: boolean }) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase
          .from('showing_participants')
          .update(updates)
          .eq('id', participantId);
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Update participant status error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Update participant status error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error updating participant status.';
      return { error: { message: errorMessage } };
    }
  },

  // Cleanup expired stories
  cleanupExpiredStories: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    
    try {
      const result = await withRetry(async () => {
        return await supabase.rpc('run_cleanup_expired_stories');
      }, 3, 1000, 20000);
      
      if (result.error) {
        console.error('Cleanup expired stories error:', result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error('Cleanup expired stories error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error cleaning up expired stories.';
      return { error: { message: errorMessage } };
    }
  }
};

// Real-time subscriptions with error handling
export const realtime = {
  subscribeToMessages: (conversationId: string, callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to messages error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToConversations: (userId: string, callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel(`conversations:${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${userId}`
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `landlord_id=eq.${userId}`
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to conversations error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToProperties: (callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel('properties')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'properties'
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to properties error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToVideoTours: (callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel('video_tours')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_tours'
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to video tours error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToVideoStories: (callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel('video_stories')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_stories'
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to video stories error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToVirtualShowings: (callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel('virtual_showings')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'virtual_showings'
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to virtual showings error:', err);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToShowingParticipants: (showingId: string, callback: (payload: any) => void) => {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    try {
      return supabase
        .channel(`participants:${showingId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'showing_participants',
          filter: `showing_id=eq.${showingId}`
        }, callback)
        .subscribe();
    } catch (err) {
      console.error('Subscribe to showing participants error:', err);
      return { unsubscribe: () => {} };
    }
  }
};

// Export configuration status for components to check
export const supabaseConfigured = isSupabaseConfigured();