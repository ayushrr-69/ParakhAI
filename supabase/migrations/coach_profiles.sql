-- 1. FIX THE COLUMN TYPE BACK TO UUID
-- We remove the foreign key constraint temporarily to make the change easier
ALTER TABLE profiles 
DROP COLUMN IF EXISTS coach_id;

ALTER TABLE profiles 
ADD COLUMN coach_id UUID;

-- 2. INSERT MOCK COACHES AS REAL ENTRIES
-- Use 'on conflict' to avoid errors if run multiple times
INSERT INTO profiles (id, full_name, role, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Coach Virat', 'coach', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Coach Sarah', 'coach', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Coach Aryan', 'coach', NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Coach Neha', 'coach', NOW())
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name, role = 'coach';

-- 3. APPLY FOREIGN KEY (OPTIONAL BUT RECOMMENDED)
-- This ensures coach_id always points to a real profile
ALTER TABLE profiles
ADD CONSTRAINT fk_coach
FOREIGN KEY (coach_id) 
REFERENCES profiles(id);
