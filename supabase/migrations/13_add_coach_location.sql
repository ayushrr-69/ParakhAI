-- Migration: Add location column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update comment for clarity
COMMENT ON COLUMN public.profiles.location IS 'Physical location of the user (City, Country), primarily for coaches.';
