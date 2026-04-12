-- 1. Enable Public Discovery of Coaches
-- Currently, athletes might not be able to see coaches in the "Pick a Coach" list due to RLS.
-- This policy allows all authenticated users to see profiles where role is set to 'coach'.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Anyone can view coach profiles'
    ) THEN
        CREATE POLICY "Anyone can view coach profiles" ON public.profiles
            FOR SELECT
            USING (role = 'coach');
    END IF;
END $$;

-- 2. Ensure users can still see their own profile (standard policy)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
    END IF;
END $$;
