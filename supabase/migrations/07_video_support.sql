-- Migration to add video_url to exercise_sessions
ALTER TABLE public.exercise_sessions 
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.exercise_sessions.video_url IS 'Public URL of the recorded exercise video stored in Supabase Storage';
