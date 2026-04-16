-- 14_enable_realtime_messages.sql
-- Enable Real-time replication for the messages table
-- This allows Supabase to broadcast INSERT events to active listeners

DO $$
BEGIN
    -- Enable for Messages
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Enable for Submissions (fix for slow coach inbox)
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'coach_submissions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_submissions;
    END IF;

    -- Enable for Enrollments (fix for slow request notifications)
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'coach_enrollments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_enrollments;
    END IF;
END $$;
