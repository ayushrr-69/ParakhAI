-- ============================================================
-- FIX: Ensure coaches can read athlete profiles via the join
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Ensure profiles are readable by everyone (coaches need to read athlete profiles in joins)
-- Drop first if it exists, then recreate safely
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles
    FOR SELECT USING (true);

-- 2. Re-create the acceptance function
CREATE OR REPLACE FUNCTION public.handle_enrollment_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        UPDATE public.profiles 
        SET coach_id = NEW.coach_id,
            coach_name = (SELECT full_name FROM public.profiles WHERE id = NEW.coach_id)
        WHERE id = NEW.athlete_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate the trigger cleanly
DROP TRIGGER IF EXISTS on_enrollment_accepted ON public.coach_enrollments;
CREATE TRIGGER on_enrollment_accepted
    AFTER UPDATE ON public.coach_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_enrollment_acceptance();

-- 4. Manually backfill any already-accepted enrollments that didn't get synced
UPDATE public.profiles AS p
SET 
    coach_id = e.coach_id,
    coach_name = (SELECT full_name FROM public.profiles WHERE id = e.coach_id)
FROM public.coach_enrollments e
WHERE e.athlete_id = p.id
  AND e.status = 'accepted'
  AND p.coach_id IS NULL;
