-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'coach_feedback', 'system', etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (mark as read)" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Prevent Duplicate Session Submissions
-- CLEANUP: Remove any existing duplicates before adding the constraint
-- Keeps the most recent submission for each session/athlete combo
DELETE FROM public.coach_submissions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (PARTITION BY athlete_id, session_id ORDER BY created_at DESC) as row_num
        FROM public.coach_submissions
    ) t
    WHERE t.row_num > 1
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_athlete_session_submission'
    ) THEN
        ALTER TABLE public.coach_submissions 
        ADD CONSTRAINT unique_athlete_session_submission UNIQUE (athlete_id, session_id);
    END IF;
END $$;

-- 3. Enable Real-time for Notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
