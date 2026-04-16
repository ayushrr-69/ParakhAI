import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export const messagingService = {
  /**
   * Fetches messages between the current user and a target user (coach or athlete)
   */
  async getMessages(targetUserId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[MessagingService] Fetch error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Sends a message to a target user
   */
  async sendMessage(receiver_id: string, content: string): Promise<Message | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        receiver_id,
        content,
      }])
      .select()
      .single();

    if (error) {
      console.error('[MessagingService] Send error:', error);
      return null;
    }

    return data;
  },

  /**
   * Subscribes to real-time message updates for a specific conversation
   */
  subscribeToMessages(currentUserId: string, targetUserId: string, onNewMessage: (msg: Message) => void) {
    // Generate a consistent channel name for this specific pair of users
    const roomId = [currentUserId, targetUserId].sort().join('_');
    
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Note: Real-time filters are most reliable when enabled in the DB, 
          // but we'll use participant logic to ensure "Instant" delivery
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Logic check: only process if this message belongs to THIS conversation
          const isRelevant = 
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === targetUserId) ||
            (newMsg.sender_id === targetUserId && newMsg.receiver_id === currentUserId);

          if (isRelevant) {
            console.log('[Realtime] New relevant message received:', newMsg.id);
            onNewMessage(newMsg);
          }
        }
      );

    channel.subscribe((status) => {
      console.log(`[Realtime] Subscription status for roomId ${roomId}:`, status);
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Failed to connect to chat channel. Check DB replication settings.');
      }
    });

    return channel;
  }
};
