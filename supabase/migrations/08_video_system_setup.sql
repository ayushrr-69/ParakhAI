-- SQL Migration to support video features
-- Run this in Supabase SQL Editor

-- 1. Add video_url to exercise_sessions if it doesn't exist
ALTER TABLE public.exercise_sessions 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Create the storage bucket for exercise videos if it doesn't exist
-- Note: Supabase storage buckets are managed via the storage schema
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-videos', 'exercise-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for 'exercise-videos'
-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'exercise-videos' );

-- Allow authenticated uploads
CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'exercise-videos' );

-- Allow users to delete their own videos
CREATE POLICY "Owner Deletion" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'exercise-videos' AND (storage.foldername(name))[1] = auth.uid()::text );
