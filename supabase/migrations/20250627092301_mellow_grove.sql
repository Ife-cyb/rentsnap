/*
  # Complete RentSnap Database Schema

  1. New Tables
    - `user_profiles` - Extended user information linked to auth.users
    - `properties` - Rental property listings
    - `property_images` - Property photos and media
    - `property_interactions` - User interactions (like, pass, view, save)
    - `property_views` - Detailed view tracking
    - `user_preferences` - User search and matching preferences
    - `conversations` - Chat conversations between tenants and landlords
    - `messages` - Individual messages within conversations
    - `match_scores` - AI-calculated compatibility scores

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for data access control
    - User-specific data isolation

  3. Features
    - AI matching algorithm with scoring factors
    - Real-time messaging system
    - Property interaction tracking
    - Advanced search preferences
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  user_type text NOT NULL DEFAULT 'tenant' CHECK (user_type IN ('tenant', 'landlord')),
  phone text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price integer NOT NULL,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms numeric NOT NULL DEFAULT 1,
  square_feet integer,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  amenities text[] DEFAULT '{}',
  pet_friendly boolean DEFAULT false,
  furnished boolean DEFAULT false,
  parking_included boolean DEFAULT false,
  available_date date DEFAULT CURRENT_DATE,
  property_type text DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'house', 'condo', 'townhouse', 'studio', 'loft')),
  status text DEFAULT 'available' CHECK (status IN ('available', 'pending', 'rented', 'draft')),
  deposit_amount integer,
  lease_term_months integer DEFAULT 12,
  utilities_included text[] DEFAULT '{}',
  landlord_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create property_interactions table
CREATE TABLE IF NOT EXISTS property_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'view', 'save', 'unsave')),
  created_at timestamptz DEFAULT now()
);

-- Create property_views table
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  view_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  budget_min integer DEFAULT 1000,
  budget_max integer DEFAULT 5000,
  preferred_bedrooms integer[] DEFAULT '{1,2}',
  search_radius integer DEFAULT 10,
  preferred_amenities text[] DEFAULT '{}',
  pet_friendly boolean DEFAULT false,
  furnished_preferred boolean DEFAULT false,
  parking_required boolean DEFAULT false,
  location_lat numeric,
  location_lng numeric,
  location_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create match_scores table
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  factors jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles" ON user_profiles
  FOR SELECT USING (true);

-- RLS Policies for properties
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
DROP POLICY IF EXISTS "Landlords can manage own properties" ON properties;

CREATE POLICY "Anyone can view available properties" ON properties
  FOR SELECT USING (status = 'available');

CREATE POLICY "Landlords can manage own properties" ON properties
  FOR ALL USING (auth.uid() = landlord_id);

-- RLS Policies for property_images
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
DROP POLICY IF EXISTS "Landlords can manage property images" ON property_images;

CREATE POLICY "Anyone can view property images" ON property_images
  FOR SELECT USING (true);

CREATE POLICY "Landlords can manage property images" ON property_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_images.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

-- RLS Policies for property_interactions
DROP POLICY IF EXISTS "Users can view own interactions" ON property_interactions;
DROP POLICY IF EXISTS "Users can create own interactions" ON property_interactions;

CREATE POLICY "Users can view own interactions" ON property_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions" ON property_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for property_views
DROP POLICY IF EXISTS "Users can view own property views" ON property_views;
DROP POLICY IF EXISTS "Users can create own property views" ON property_views;

CREATE POLICY "Users can view own property views" ON property_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own property views" ON property_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can view conversation messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.tenant_id = auth.uid() OR conversations.landlord_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.tenant_id = auth.uid() OR conversations.landlord_id = auth.uid())
    )
  );

-- RLS Policies for match_scores
DROP POLICY IF EXISTS "Users can view own match scores" ON match_scores;
DROP POLICY IF EXISTS "System can insert match scores" ON match_scores;
DROP POLICY IF EXISTS "System can update match scores" ON match_scores;

CREATE POLICY "Users can view own match scores" ON match_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert match scores" ON match_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update match scores" ON match_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers and recreate them
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_match_scores_updated_at ON match_scores;

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_scores_updated_at
  BEFORE UPDATE ON match_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate match score
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user_id uuid,
  p_property_id uuid
)
RETURNS integer AS $$
DECLARE
  user_prefs record;
  property_data record;
  score integer := 0;
  factors jsonb := '{}';
  budget_score integer := 0;
  bedroom_score integer := 0;
  amenity_score integer := 0;
  location_score integer := 0;
  feature_score integer := 0;
  distance_miles numeric;
  amenity_match_count integer;
  total_preferred_amenities integer;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs
  FROM user_preferences
  WHERE user_id = p_user_id;

  -- Get property data
  SELECT * INTO property_data
  FROM properties
  WHERE id = p_property_id;

  -- Return 0 if no preferences or property found
  IF user_prefs IS NULL OR property_data IS NULL THEN
    RETURN 0;
  END IF;

  -- Budget matching (30 points max)
  IF property_data.price >= user_prefs.budget_min AND property_data.price <= user_prefs.budget_max THEN
    budget_score := 30;
  ELSIF property_data.price < user_prefs.budget_min THEN
    budget_score := 20; -- Under budget is still good
  ELSE
    -- Over budget, score decreases with distance from max
    budget_score := GREATEST(0, 15 - ((property_data.price - user_prefs.budget_max) / 100)::integer);
  END IF;

  -- Bedroom matching (25 points max)
  IF property_data.bedrooms = ANY(user_prefs.preferred_bedrooms) THEN
    bedroom_score := 25;
  ELSE
    -- Partial score for close matches
    IF array_length(user_prefs.preferred_bedrooms, 1) > 0 THEN
      bedroom_score := GREATEST(0, 15 - ABS(property_data.bedrooms - user_prefs.preferred_bedrooms[1]) * 5);
    ELSE
      bedroom_score := 10; -- Default if no preferences
    END IF;
  END IF;

  -- Amenity matching (20 points max)
  total_preferred_amenities := COALESCE(array_length(user_prefs.preferred_amenities, 1), 0);
  IF total_preferred_amenities > 0 THEN
    -- Count matching amenities
    SELECT COUNT(*) INTO amenity_match_count
    FROM unnest(property_data.amenities) AS prop_amenity
    WHERE prop_amenity = ANY(user_prefs.preferred_amenities);
    
    amenity_score := (amenity_match_count * 20 / total_preferred_amenities)::integer;
  ELSE
    amenity_score := 10; -- Default score if no preferences
  END IF;

  -- Location matching (15 points max)
  IF user_prefs.location_lat IS NOT NULL AND user_prefs.location_lng IS NOT NULL 
     AND property_data.latitude IS NOT NULL AND property_data.longitude IS NOT NULL THEN
    -- Calculate distance using Haversine formula
    distance_miles := (
      3959 * acos(
        LEAST(1.0, 
          cos(radians(user_prefs.location_lat)) * 
          cos(radians(property_data.latitude)) * 
          cos(radians(property_data.longitude) - radians(user_prefs.location_lng)) + 
          sin(radians(user_prefs.location_lat)) * 
          sin(radians(property_data.latitude))
        )
      )
    );
    
    IF distance_miles <= user_prefs.search_radius THEN
      location_score := GREATEST(0, (15 - (distance_miles * 15 / NULLIF(user_prefs.search_radius, 0)))::integer);
    ELSE
      location_score := 0;
    END IF;
  ELSE
    location_score := 8; -- Default score if no location data
  END IF;

  -- Feature matching (10 points max)
  feature_score := 0;
  
  -- Pet friendly matching
  IF user_prefs.pet_friendly = true AND property_data.pet_friendly = true THEN
    feature_score := feature_score + 3;
  ELSIF user_prefs.pet_friendly = false THEN
    feature_score := feature_score + 1; -- Small bonus for not needing pets
  END IF;
  
  -- Furnished preference matching
  IF user_prefs.furnished_preferred = true AND property_data.furnished = true THEN
    feature_score := feature_score + 3;
  ELSIF user_prefs.furnished_preferred = false THEN
    feature_score := feature_score + 1; -- Small bonus for not needing furnished
  END IF;
  
  -- Parking requirement matching
  IF user_prefs.parking_required = true AND property_data.parking_included = true THEN
    feature_score := feature_score + 4;
  ELSIF user_prefs.parking_required = false THEN
    feature_score := feature_score + 2; -- Small bonus for not needing parking
  END IF;

  -- Calculate total score
  score := budget_score + bedroom_score + amenity_score + location_score + feature_score;
  score := LEAST(100, score); -- Cap at 100

  -- Build factors object
  factors := jsonb_build_object(
    'budget_score', budget_score,
    'bedroom_score', bedroom_score,
    'amenity_score', amenity_score,
    'location_score', location_score,
    'feature_score', feature_score,
    'total_score', score
  );

  -- Insert or update match score
  INSERT INTO match_scores (user_id, property_id, score, factors)
  VALUES (p_user_id, p_property_id, score, factors)
  ON CONFLICT (user_id, property_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    factors = EXCLUDED.factors,
    updated_at = now();

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update all match scores for a user
CREATE OR REPLACE FUNCTION update_user_match_scores(p_user_id uuid)
RETURNS void AS $$
DECLARE
  property_record record;
BEGIN
  FOR property_record IN
    SELECT id FROM properties WHERE status = 'available'
  LOOP
    PERFORM calculate_match_score(p_user_id, property_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update match scores when preferences change
CREATE OR REPLACE FUNCTION trigger_update_match_scores()
RETURNS trigger AS $$
BEGIN
  PERFORM update_user_match_scores(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for preferences changes
DROP TRIGGER IF EXISTS update_match_scores_on_preferences_change ON user_preferences;
CREATE TRIGGER update_match_scores_on_preferences_change
  AFTER INSERT OR UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_update_match_scores();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_user ON match_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_property ON match_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_score ON match_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_user_score ON match_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_property_interactions_user ON property_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_property ON property_interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_landlord ON conversations(landlord_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);