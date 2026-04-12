-- 1. Create Coach Enrollments Table
CREATE TABLE IF NOT EXISTS public.coach_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')) NOT NULL,
    message TEXT NOT NULL, -- Mandatory intro message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(athlete_id, coach_id)
);

-- 2. Enable RLS
ALTER TABLE public.coach_enrollments ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own enrollment requests
CREATE POLICY "Athletes can view their own enrollments" ON public.coach_enrollments
    FOR SELECT USING (auth.uid() = athlete_id);

-- Athletes can create their own enrollment requests
CREATE POLICY "Athletes can request enrollment" ON public.coach_enrollments
    FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- Coaches can view and update their incoming requests
CREATE POLICY "Coaches can manage incoming enrollments" ON public.coach_enrollments
    FOR ALL USING (auth.uid() = coach_id);

-- 3. Update Submission RLS (Data Sharing Tunnel)
-- Athletes can only share sessions if there is an ACCEPTED enrollment
DROP POLICY IF EXISTS "Athletes can submit to coaches" ON public.coach_submissions;
CREATE POLICY "Athletes can submit to enrolled coaches" ON public.coach_submissions
    FOR INSERT WITH CHECK (
        auth.uid() = athlete_id AND
        EXISTS (
            SELECT 1 FROM public.coach_enrollments 
            WHERE athlete_id = auth.uid() 
            AND coach_id = coach_submissions.coach_id 
            AND status = 'accepted'
        )
    );

-- 4. Update Profile Sync Trigger (Optional but helpful)
-- Update profiles.coach_id automatically when enrollment is accepted
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

CREATE TRIGGER on_enrollment_accepted
    AFTER UPDATE ON public.coach_enrollments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
    EXECUTE FUNCTION public.handle_enrollment_acceptance();
