export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          property_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          property_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      match_scores: {
        Row: {
          created_at: string
          factors: Json
          id: string
          property_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          factors?: Json
          id?: string
          property_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          factors?: Json
          id?: string
          property_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: string[]
          available_date: string
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string
          deposit_amount: number | null
          description: string | null
          furnished: boolean
          id: string
          landlord_id: string
          latitude: number | null
          lease_term_months: number
          longitude: number | null
          parking_included: boolean
          pet_friendly: boolean
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet: number | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          utilities_included: string[]
          zip_code: string
        }
        Insert: {
          address: string
          amenities?: string[]
          available_date?: string
          bathrooms?: number
          bedrooms?: number
          city: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          furnished?: boolean
          id?: string
          landlord_id: string
          latitude?: number | null
          lease_term_months?: number
          longitude?: number | null
          parking_included?: boolean
          pet_friendly?: boolean
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          utilities_included?: string[]
          zip_code: string
        }
        Update: {
          address?: string
          amenities?: string[]
          available_date?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          furnished?: boolean
          id?: string
          landlord_id?: string
          latitude?: number | null
          lease_term_months?: number
          longitude?: number | null
          parking_included?: boolean
          pet_friendly?: boolean
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          utilities_included?: string[]
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          property_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          property_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          }
        ]
      }
      property_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_interactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
          view_duration: number
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
          view_duration?: number
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
          view_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          budget_max: number
          budget_min: number
          created_at: string
          furnished_preferred: boolean
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          parking_required: boolean
          pet_friendly: boolean
          preferred_amenities: string[]
          preferred_bedrooms: number[]
          search_radius: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          furnished_preferred?: boolean
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          parking_required?: boolean
          pet_friendly?: boolean
          preferred_amenities?: string[]
          preferred_bedrooms?: number[]
          search_radius?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          furnished_preferred?: boolean
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          parking_required?: boolean
          pet_friendly?: boolean
          preferred_amenities?: string[]
          preferred_bedrooms?: number[]
          search_radius?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_score: {
        Args: {
          p_user_id: string
          p_property_id: string
        }
        Returns: number
      }
      update_user_match_scores: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      conversation_status: "active" | "archived" | "blocked"
      interaction_type: "like" | "pass" | "view" | "save" | "unsave"
      message_type: "text" | "image" | "system"
      property_status: "available" | "pending" | "rented" | "draft"
      property_type: "apartment" | "house" | "condo" | "townhouse" | "studio" | "loft"
      user_type: "tenant" | "landlord"
    }
    Composite: {
      [_ in never]: never
    }
  }
}