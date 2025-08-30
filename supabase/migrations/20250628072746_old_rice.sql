/*
  # Add User Interactions System

  1. New Tables
    - `property_interactions` - Track user interactions (like, pass, view, save, unsave)
    - `property_views` - Detailed view tracking with duration

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own interactions

  3. Indexes
    - Performance indexes for common queries
*/

-- Create property_interactions table
CREATE TABLE IF NOT EXISTS property_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  interaction_type interaction_type NOT NULL,
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

-- Enable RLS on new tables
ALTER TABLE property_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_interactions_user ON property_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_property ON property_interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_type ON property_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_property_interactions_user_type ON property_interactions(user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_created_at ON property_views(created_at DESC);

-- Function to get user interaction summary
CREATE OR REPLACE FUNCTION get_user_interaction_summary(p_user_id uuid)
RETURNS TABLE (
  total_views bigint,
  total_likes bigint,
  total_passes bigint,
  total_saves bigint,
  avg_view_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM property_interactions WHERE user_id = p_user_id AND interaction_type = 'view'), 0) as total_views,
    COALESCE((SELECT COUNT(*) FROM property_interactions WHERE user_id = p_user_id AND interaction_type = 'like'), 0) as total_likes,
    COALESCE((SELECT COUNT(*) FROM property_interactions WHERE user_id = p_user_id AND interaction_type = 'pass'), 0) as total_passes,
    COALESCE((SELECT COUNT(*) FROM property_interactions WHERE user_id = p_user_id AND interaction_type = 'save'), 0) as total_saves,
    COALESCE((SELECT AVG(view_duration) FROM property_views WHERE user_id = p_user_id), 0) as avg_view_duration;
END;
$$;

-- Function to get property interaction summary
CREATE OR REPLACE FUNCTION get_property_interaction_summary(p_property_id uuid)
RETURNS TABLE (
  total_views bigint,
  total_likes bigint,
  total_passes bigint,
  total_saves bigint,
  avg_view_duration numeric,
  engagement_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_count bigint;
  like_count bigint;
  pass_count bigint;
  save_count bigint;
  avg_duration numeric;
  engagement numeric;
BEGIN
  -- Get interaction counts
  SELECT COUNT(*) INTO view_count FROM property_interactions WHERE property_id = p_property_id AND interaction_type = 'view';
  SELECT COUNT(*) INTO like_count FROM property_interactions WHERE property_id = p_property_id AND interaction_type = 'like';
  SELECT COUNT(*) INTO pass_count FROM property_interactions WHERE property_id = p_property_id AND interaction_type = 'pass';
  SELECT COUNT(*) INTO save_count FROM property_interactions WHERE property_id = p_property_id AND interaction_type = 'save';
  
  -- Get average view duration
  SELECT COALESCE(AVG(view_duration), 0) INTO avg_duration FROM property_views WHERE property_id = p_property_id;
  
  -- Calculate engagement rate (likes + saves / total interactions)
  IF (view_count + like_count + pass_count + save_count) > 0 THEN
    engagement := (like_count + save_count)::numeric / (view_count + like_count + pass_count + save_count)::numeric * 100;
  ELSE
    engagement := 0;
  END IF;
  
  RETURN QUERY
  SELECT view_count, like_count, pass_count, save_count, avg_duration, engagement;
END;
$$;