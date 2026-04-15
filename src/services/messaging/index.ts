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
    
    return supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Optionally add filter if your Supabase project supports it for performance:
          // filter: `sender_id=in.(${currentUserId},${targetUserId})`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Security/Context check: only fire if this message is part of the conversation
          const isParticipant = 
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === targetUserId) ||
            (newMsg.sender_id === targetUserId && newMsg.receiver_id === currentUserId);

          if (isParticipant) {
            onNewMessage(newMsg);
          }
        }
      )
      .subscribe();
  }
};
