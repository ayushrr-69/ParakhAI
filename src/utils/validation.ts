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
    const regex = /^[a-z0-9_]+$/;
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
        query = query.neq('id', excludeUserId);
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
  },

  /**
   * Calculates password strength score (0-4).
   */
  getPasswordStrength: (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }
};
