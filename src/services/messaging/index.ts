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
   * Subscribes to real-time message updates
   */
  subscribeToMessages(targetUserId: string, onNewMessage: (msg: Message) => void) {
    return supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only trigger if it belongs to this conversation
          if (
            (newMsg.sender_id === targetUserId) ||
            (newMsg.receiver_id === targetUserId)
          ) {
            onNewMessage(newMsg);
          }
        }
      )
      .subscribe();
  }
};
