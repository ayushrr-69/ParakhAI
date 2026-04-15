import { supabase } from '@/lib/supabase';

export const validation = {
  /**
   * Validates email format using a robust regex.
   */
  email: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  },

  /**
   * Validates full name: 2-50 characters, letters and spaces only.
   */
  fullName: (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) return false;
    // Allow letters, common accents, spaces, hyphens and apostrophes
    const regex = /^[a-zA-ZÀ-ÿ\s\-\']+$/;
    return regex.test(trimmed);
  },

  /**
   * Validates username: 3-15 chars, alphanumeric + underscores only.
   */
  username: (username: string) => {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 15) return false;
    const regex = /^[a-zA-Z0-9_]+$/;
    return regex.test(trimmed);
  },

  /**
   * Checks if a username is already taken in the profiles table.
   * Returns true if AVAILABLE, false if TAKEN.
   */
  isUsernameAvailable: async (username: string, excludeUserId?: string) => {
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('username', username.trim());

      if (excludeUserId) {
        query = query.ne('id', excludeUserId);
      }

      const { count, error } = await query;
      
      if (error) {
        console.warn('[Validation] Username check error:', error);
        return true; // Assume available if error to avoid blocking user, or throw? Choosing soft fail for now.
      }

      return count === 0;
    } catch (e) {
      console.error('[Validation] Username check exception:', e);
      return true;
    }
  },

  /**
   * Clamps a numeric metric (weight/height) to realistic human bounds.
   */
  metric: (value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
  },

  /**
   * Basic text sanitization and max length check for bios/messages.
   */
  longText: (text: string, maxLen: number = 500) => {
    const trimmed = text.trim();
    return trimmed.length <= maxLen;
  }
};
