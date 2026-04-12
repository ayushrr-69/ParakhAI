-- Enable Realtime for the messages table
-- This allows Supabase to broadcast INSERT events to the connected clients in real-time.

begin;
  -- Add the messages table to the supabase_realtime publication
  alter publication supabase_realtime add table public.messages;
commit;
