-- Create video_tours table
CREATE TABLE IF NOT EXISTS video_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer NOT NULL, -- in seconds
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  landlord_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create video_stories table
CREATE TABLE IF NOT EXISTS video_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  caption text,
  duration integer, -- in seconds, for videos
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Create virtual_showings table
CREATE TABLE IF NOT EXISTS virtual_showings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  host_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_time timestamptz NOT NULL,
  duration integer DEFAULT 30, -- in minutes
  status text NOT NULL CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  meeting_url text,
  recording_url text,
  max_participants integer DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create showing_participants table
CREATE TABLE IF NOT EXISTS showing_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showing_id uuid REFERENCES virtual_showings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('host', 'viewer')),
  is_muted boolean DEFAULT true,
  is_video_on boolean DEFAULT false,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(showing_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE video_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE showing_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_tours
CREATE POLICY "Anyone can view video tours" ON video_tours
  FOR SELECT USING (true);

CREATE POLICY "Landlords can manage their video tours" ON video_tours
  FOR ALL USING (auth.uid() = landlord_id);

-- RLS Policies for video_stories
CREATE POLICY "Anyone can view video stories" ON video_stories
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own stories" ON video_stories
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for virtual_showings
CREATE POLICY "Anyone can view virtual showings" ON virtual_showings
  FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their virtual showings" ON virtual_showings
  FOR ALL USING (auth.uid() = host_id);

-- RLS Policies for showing_participants
CREATE POLICY "Participants can view showing participants" ON showing_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM showing_participants sp
      WHERE sp.showing_id = showing_participants.showing_id
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join showings" ON showing_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON showing_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_video_tours_updated_at
  BEFORE UPDATE ON video_tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_showings_updated_at
  BEFORE UPDATE ON virtual_showings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_tours_property ON video_tours(property_id);
CREATE INDEX IF NOT EXISTS idx_video_tours_landlord ON video_tours(landlord_id);
CREATE INDEX IF NOT EXISTS idx_video_stories_user ON video_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_video_stories_property ON video_stories(property_id);
CREATE INDEX IF NOT EXISTS idx_video_stories_expires ON video_stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_virtual_showings_property ON virtual_showings(property_id);
CREATE INDEX IF NOT EXISTS idx_virtual_showings_host ON virtual_showings(host_id);
CREATE INDEX IF NOT EXISTS idx_virtual_showings_scheduled ON virtual_showings(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_virtual_showings_status ON virtual_showings(status);
CREATE INDEX IF NOT EXISTS idx_showing_participants_showing ON showing_participants(showing_id);
CREATE INDEX IF NOT EXISTS idx_showing_participants_user ON showing_participants(user_id);

-- Create storage buckets for video content
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('video-tours', 'Video Tours', true),
  ('video-stories', 'Video Stories', true),
  ('virtual-showings', 'Virtual Showing Recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video content
CREATE POLICY "Video tours are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-tours');

CREATE POLICY "Landlords can upload video tours" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'video-tours' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_type = 'landlord'
    )
  );

CREATE POLICY "Landlords can update their video tours" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'video-tours' AND 
    EXISTS (
      SELECT 1 FROM video_tours 
      JOIN properties ON video_tours.property_id = properties.id
      WHERE properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Video stories are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-stories');

CREATE POLICY "Users can upload their own video stories" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'video-stories' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own video stories" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'video-stories' AND 
    EXISTS (
      SELECT 1 FROM video_stories 
      WHERE video_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Virtual showing recordings are accessible to participants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'virtual-showings' AND
    EXISTS (
      SELECT 1 FROM showing_participants
      JOIN virtual_showings ON showing_participants.showing_id = virtual_showings.id
      WHERE showing_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can upload virtual showing recordings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'virtual-showings' AND
    EXISTS (
      SELECT 1 FROM virtual_showings
      WHERE virtual_showings.host_id = auth.uid()
    )
  );

-- Functions for video and virtual showing management
CREATE OR REPLACE FUNCTION increment_video_tour_views(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_tours
  SET views = views + 1
  WHERE id = p_video_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_video_tour_likes(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_tours
  SET likes = likes + 1
  WHERE id = p_video_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_story_views(p_story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_stories
  SET views = views + 1
  WHERE id = p_story_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_story_likes(p_story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_stories
  SET likes = likes + 1
  WHERE id = p_story_id;
END;
$$;

-- Function to start a virtual showing
CREATE OR REPLACE FUNCTION start_virtual_showing(p_showing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE virtual_showings
  SET status = 'live'
  WHERE id = p_showing_id AND status = 'scheduled';
END;
$$;

-- Function to end a virtual showing
CREATE OR REPLACE FUNCTION end_virtual_showing(p_showing_id uuid, p_recording_url text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE virtual_showings
  SET 
    status = 'completed',
    recording_url = COALESCE(p_recording_url, recording_url)
  WHERE id = p_showing_id AND status = 'live';
END;
$$;

-- Function to join a virtual showing
CREATE OR REPLACE FUNCTION join_virtual_showing(p_showing_id uuid, p_user_id uuid, p_role text DEFAULT 'viewer')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_id uuid;
BEGIN
  -- Check if showing exists and is live or scheduled
  IF NOT EXISTS (
    SELECT 1 FROM virtual_showings
    WHERE id = p_showing_id AND status IN ('live', 'scheduled')
  ) THEN
    RAISE EXCEPTION 'Virtual showing not found or not available';
  END IF;
  
  -- Check if user is already a participant
  SELECT id INTO participant_id
  FROM showing_participants
  WHERE showing_id = p_showing_id AND user_id = p_user_id;
  
  IF participant_id IS NULL THEN
    -- Insert new participant
    INSERT INTO showing_participants (showing_id, user_id, role, joined_at)
    VALUES (p_showing_id, p_user_id, p_role, now())
    RETURNING id INTO participant_id;
  ELSE
    -- Update existing participant
    UPDATE showing_participants
    SET joined_at = now(), left_at = NULL
    WHERE id = participant_id;
  END IF;
  
  RETURN participant_id;
END;
$$;

-- Function to leave a virtual showing
CREATE OR REPLACE FUNCTION leave_virtual_showing(p_showing_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE showing_participants
  SET left_at = now()
  WHERE showing_id = p_showing_id AND user_id = p_user_id AND left_at IS NULL;
END;
$$;

-- Function to get active participants in a showing
CREATE OR REPLACE FUNCTION get_active_showing_participants(p_showing_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  role text,
  is_muted boolean,
  is_video_on boolean,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    up.full_name,
    up.avatar_url,
    sp.role,
    sp.is_muted,
    sp.is_video_on,
    sp.joined_at
  FROM showing_participants sp
  JOIN user_profiles up ON sp.user_id = up.id
  WHERE sp.showing_id = p_showing_id AND sp.left_at IS NULL
  ORDER BY sp.role DESC, sp.joined_at;
END;
$$;

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM video_stories
  WHERE expires_at < now();
END;
$$;

-- Create a scheduled job to clean up expired stories
-- Note: We're removing the cron dependency and will handle this with application logic instead
-- or you can set up a separate scheduled job outside of the migration

-- Create a function that can be called periodically to clean up expired stories
CREATE OR REPLACE FUNCTION run_cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_expired_stories();
END;
$$;