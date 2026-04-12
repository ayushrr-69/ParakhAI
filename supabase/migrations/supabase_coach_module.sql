-- 1. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Coach Submissions Table
CREATE TABLE IF NOT EXISTS public.coach_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'reviewed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Coach Feedback Table
CREATE TABLE IF NOT EXISTS public.coach_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.coach_submissions(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Messages: Users can see messages where they are the sender or receiver
CREATE POLICY "Users can see their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for Submissions: Athletes can see their own, Coaches can see assigned ones
CREATE POLICY "Users can see relevant submissions" ON public.coach_submissions
    FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Athletes can submit to coaches" ON public.coach_submissions
    FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- RLS Policies for Feedback: Both can see feedback for their connection
CREATE POLICY "Users can see relevant feedback" ON public.coach_feedback
    FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Coaches can provide feedback" ON public.coach_feedback
    FOR INSERT WITH CHECK (auth.uid() = coach_id);
