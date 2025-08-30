/*
  # Create missing database functions and triggers

  1. Functions
    - `update_updated_at_column()` - Updates the updated_at timestamp
    - `calculate_match_score()` - Calculates compatibility score between user and property
    - `update_user_match_scores()` - Updates all match scores for a user
    - `trigger_update_match_scores()` - Trigger function to update match scores
    - `uid()` - Helper function to get current user ID

  2. Security
    - Ensure all functions have proper security context
    - Add RLS policies where needed

  3. Triggers
    - Set up triggers for automatic timestamp updates
    - Set up triggers for match score calculations
*/

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to calculate match score between user and property
CREATE OR REPLACE FUNCTION calculate_match_score(p_user_id uuid, p_property_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_prefs record;
  property_info record;
  score integer := 0;
  max_score integer := 100;
  factors jsonb := '{}';
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs 
  FROM user_preferences 
  WHERE user_id = p_user_id;
  
  -- Get property information
  SELECT * INTO property_info 
  FROM properties 
  WHERE id = p_property_id;
  
  -- If no preferences found, return default score
  IF user_prefs IS NULL OR property_info IS NULL THEN
    RETURN 50;
  END IF;
  
  -- Budget compatibility (30 points)
  IF property_info.price >= COALESCE(user_prefs.budget_min, 0) 
     AND property_info.price <= COALESCE(user_prefs.budget_max, 999999) THEN
    score := score + 30;
    factors := factors || jsonb_build_object('budget_match', true);
  ELSE
    factors := factors || jsonb_build_object('budget_match', false);
  END IF;
  
  -- Bedroom compatibility (20 points)
  IF user_prefs.preferred_bedrooms IS NOT NULL 
     AND property_info.bedrooms = ANY(user_prefs.preferred_bedrooms) THEN
    score := score + 20;
    factors := factors || jsonb_build_object('bedroom_match', true);
  ELSE
    factors := factors || jsonb_build_object('bedroom_match', false);
  END IF;
  
  -- Pet compatibility (15 points)
  IF user_prefs.pet_friendly = property_info.pet_friendly THEN
    score := score + 15;
    factors := factors || jsonb_build_object('pet_match', true);
  ELSE
    factors := factors || jsonb_build_object('pet_match', false);
  END IF;
  
  -- Furnished preference (10 points)
  IF user_prefs.furnished_preferred = property_info.furnished THEN
    score := score + 10;
    factors := factors || jsonb_build_object('furnished_match', true);
  ELSE
    factors := factors || jsonb_build_object('furnished_match', false);
  END IF;
  
  -- Parking requirement (10 points)
  IF user_prefs.parking_required = property_info.parking_included THEN
    score := score + 10;
    factors := factors || jsonb_build_object('parking_match', true);
  ELSE
    factors := factors || jsonb_build_object('parking_match', false);
  END IF;
  
  -- Location proximity (15 points)
  IF user_prefs.location_lat IS NOT NULL 
     AND user_prefs.location_lng IS NOT NULL 
     AND property_info.latitude IS NOT NULL 
     AND property_info.longitude IS NOT NULL THEN
    
    -- Simple distance calculation (this could be enhanced with proper geospatial functions)
    DECLARE
      distance_score integer;
      lat_diff numeric;
      lng_diff numeric;
      approx_distance numeric;
    BEGIN
      lat_diff := abs(user_prefs.location_lat - property_info.latitude);
      lng_diff := abs(user_prefs.location_lng - property_info.longitude);
      approx_distance := sqrt(lat_diff * lat_diff + lng_diff * lng_diff);
      
      -- Convert to rough miles (very approximate)
      approx_distance := approx_distance * 69;
      
      IF approx_distance <= COALESCE(user_prefs.search_radius, 10) THEN
        distance_score := 15 - LEAST(15, (approx_distance::integer * 2));
        score := score + GREATEST(0, distance_score);
        factors := factors || jsonb_build_object('location_match', true, 'distance_miles', approx_distance);
      ELSE
        factors := factors || jsonb_build_object('location_match', false, 'distance_miles', approx_distance);
      END IF;
    END;
  END IF;
  
  -- Upsert the match score
  INSERT INTO match_scores (user_id, property_id, score, factors)
  VALUES (p_user_id, p_property_id, score, factors)
  ON CONFLICT (user_id, property_id) 
  DO UPDATE SET 
    score = EXCLUDED.score,
    factors = EXCLUDED.factors,
    updated_at = now();
  
  RETURN score;
END;
$$;

-- Function to update all match scores for a user
CREATE OR REPLACE FUNCTION update_user_match_scores(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  property_record record;
BEGIN
  -- Calculate match scores for all available properties
  FOR property_record IN 
    SELECT id FROM properties WHERE status = 'available'
  LOOP
    PERFORM calculate_match_score(p_user_id, property_record.id);
  END LOOP;
END;
$$;

-- Trigger function to update match scores when preferences change
CREATE OR REPLACE FUNCTION trigger_update_match_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update match scores for the user whose preferences changed
  PERFORM update_user_match_scores(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DO $$
BEGIN
  -- Check and create trigger for user_preferences
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_match_scores_on_preferences_change'
  ) THEN
    CREATE TRIGGER update_match_scores_on_preferences_change
      AFTER INSERT OR UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION trigger_update_match_scores();
  END IF;
  
  -- Check and create triggers for updated_at columns
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_match_scores_updated_at'
  ) THEN
    CREATE TRIGGER update_match_scores_updated_at
      BEFORE UPDATE ON match_scores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_conversations_updated_at'
  ) THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;