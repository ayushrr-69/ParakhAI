-- Add Profile Enhancements for Coach Discovery
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 4.8;

-- Comment on columns for clarity
COMMENT ON COLUMN public.profiles.avatar_url IS 'External URL for profile picture, synced from auth metadata';
COMMENT ON COLUMN public.profiles.rating IS 'Average performance rating for coach discovery';
