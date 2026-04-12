import { supabase } from '@/lib/supabase';

export interface Submission {
  id: string;
  athlete_id: string;
  coach_id: string;
  session_id: string;
  status: 'pending' | 'reviewed';
  created_at: string;
  session?: any; // To be joined
  athlete?: any; // To be joined
}

export interface Feedback {
  id: string;
  submission_id: string;
  athlete_id: string;
  coach_id: string;
  content: string;
  rating: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  athlete_id: string;
  coach_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  athlete?: any;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'coach_feedback' | 'enrollment_update' | 'system';
  read: boolean;
  created_at: string;
}

export const coachService = {
  /**
   * Fetches the inbox of submissions for the current coach
   */
  async getInbox(): Promise<Submission[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('coach_submissions')
      .select(`
        *,
        athlete:athlete_id (id, full_name, username),
        session:session_id (*)
      `)
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoachService] Inbox fetch error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Submits a feedback for a specific submission
   */
  async submitFeedback(submission_id: string, athlete_id: string, content: string, rating: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 1. Insert Feedback
    const { error: feedbackError } = await supabase
      .from('coach_feedback')
      .insert([{
        submission_id,
        athlete_id,
        coach_id: user.id,
        content,
        rating
      }]);

    if (feedbackError) {
      console.error('[CoachService] Feedback submission error:', feedbackError);
      return false;
    }

    // 2. Update Submission Status
    const { error: updateError } = await supabase
      .from('coach_submissions')
      .update({ status: 'reviewed' })
      .eq('id', submission_id);

    if (updateError) {
      console.error('[CoachService] Submission status update error:', updateError);
    }

    // 3. Create Notification for Athlete
    const { error: notifError } = await supabase
      .from('notifications')
      .insert([{
        user_id: athlete_id,
        title: 'New Coach Feedback',
        message: `Your coach has reviewed your recent session and provided feedback.`,
        type: 'coach_feedback'
      }]);

    if (notifError) {
      console.error('[CoachService] Notification creation error:', notifError);
    }

    return true;
  },

  /**
   * Fetches all athletes assigned to the current coach
   */
  async getMyAthletes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('coach_enrollments')
      .select('athlete:athlete_id (*)')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('[CoachService] Fetch athletes error:', error);
      return [];
    }

    return (data || []).map((x: any) => x.athlete);
  },

  /**
   * Fetches the latest feedback received by an athlete
   */
  async getLatestFeedback(athlete_id: string): Promise<Feedback | null> {
    const { data, error } = await supabase
      .from('coach_feedback')
      .select('*')
      .eq('athlete_id', athlete_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[CoachService] Latest feedback fetch error:', error);
      return null;
    }

    return data;
  },

  /**
   * Fetches public coaches
   */
  async getPublicCoaches(): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'coach')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching public coaches:', error);
      return [];
    }
    return data || [];
  },

  async getCoachProfile(coachId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', coachId)
      .eq('role', 'coach')
      .single();

    if (error) {
      console.error('Error fetching coach profile:', error);
      return null;
    }
    return data;
  },

  /**
   * Fetches the review history for an athlete
   */
  async getReviewsHistory(athleteId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('coach_submissions')
      .select(`
        *,
        coach_feedback (*),
        session:session_id (*)
      `)
      .eq('athlete_id', athleteId)
      .eq('status', 'reviewed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoachService] Reviews history fetch error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Fetches latest notifications for a user
   */
  async getNotifications(): Promise<AppNotification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[CoachService] Notifications fetch error:', error);
      return [];
    }

    return data || [];
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('[CoachService] Error marking notification as read:', error);
    }
  },

  /**
   * Creates a new submission from an athlete to their coach
   */
  async createSubmission(sessionId: string, coachId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('coach_submissions')
      .insert([{
        session_id: sessionId,
        athlete_id: user.id,
        coach_id: coachId,
        status: 'pending'
      }]);

    if (error) {
      if (error.code === '23505') {
        console.log('[CoachService] Session already shared');
        return true; // Treat as success if already shared
      }
      console.error('[CoachService] Create submission error:', error);
      return false;
    }

    return true;
  },

  /**
   * Fetches team leaderboard data for a coach
   */
  async getTeamLeaderboard(exerciseType: string = 'pushups', timeframe: 'today' | 'week' | 'month' | 'all' = 'all', sortBy: 'quality' | 'reps' = 'quality') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('coach_submissions')
      .select(`
        id,
        status,
        created_at,
        athlete:athlete_id (id, full_name, username),
        session:session_id (*)
      `)
      .eq('coach_id', user.id);

    // Timeframe filtering
    const now = new Date();
    if (timeframe === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      query = query.gte('created_at', startOfDay);
    } else if (timeframe === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', lastWeek);
    } else if (timeframe === 'month') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', lastMonth);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CoachService] Leaderboard fetch error:', error);
      return [];
    }

    // Process and aggregate data by athlete
    const flattened = ((data as any[]) || [])
      .filter(item => item.session?.exercise_type === exerciseType)
      .map(item => ({
        athleteId: item.athlete?.id,
        fullName: item.athlete?.full_name,
        username: item.athlete?.username,
        reps: item.session?.total_reps,
        quality: item.session?.quality_score,
        createdAt: item.created_at
      }));

    // Group by athlete and find best
    const aggregated = flattened.reduce((acc: any, curr) => {
      if (!acc[curr.athleteId] || 
         (sortBy === 'quality' ? curr.quality > acc[curr.athleteId].quality : curr.reps > acc[curr.athleteId].reps)) {
        acc[curr.athleteId] = curr;
      }
      return acc;
    }, {});

    const result = Object.values(aggregated).sort((a: any, b: any) => 
      sortBy === 'quality' ? b.quality - a.quality : b.reps - a.reps
    );

    return result;
  },

  /**
   * Athletes request to join a coach
   */
  async requestEnrollment(coachId: string, message: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('coach_enrollments')
      .upsert({
        athlete_id: user.id,
        coach_id: coachId,
        message,
        status: 'pending'
      }, { onConflict: 'athlete_id,coach_id' });

    if (error) {
      console.error('[CoachService] Request enrollment error:', error);
      return false;
    }

    return true;
  },

  /**
   * Coaches view incoming athlete requests
   */
  async getEnrollmentRequests(): Promise<Enrollment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('coach_enrollments')
      .select('*, athlete:athlete_id (*)')
      .eq('coach_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('[CoachService] Fetch enrollment requests error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Coaches accept or reject an athlete
   */
  async updateEnrollmentStatus(enrollmentId: string, status: 'accepted' | 'rejected'): Promise<boolean> {
    const { error } = await supabase
      .from('coach_enrollments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', enrollmentId);

    if (error) {
      console.error('[CoachService] Update enrollment status error:', error);
      return false;
    }

    return true;
  },

  /**
   * Get the status of an athlete's enrollment with a specific coach
   */
  async getEnrollmentStatus(coachId: string): Promise<Enrollment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('coach_enrollments')
      .select('*')
      .eq('athlete_id', user.id)
      .eq('coach_id', coachId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[CoachService] Fetch enrollment status error:', error);
      return null;
    }

    return data;
  },

  /**
   * Fetches the average quality score for a coach's entire team
   */
  async getTeamAverage(coachId: string): Promise<number> {
    const { data, error } = await supabase
      .from('coach_submissions')
      .select('session:session_id (quality_score)')
      .eq('coach_id', coachId);

    if (error || !data) {
      console.error('[CoachService] Team average fetch error:', error);
      return 0;
    }

    const scores = data
      .map((item: any) => item.session?.quality_score)
      .filter((s): s is number => typeof s === 'number');

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  },

  /**
   * Fetches all unique coaches an athlete has ever been enrolled with
   */
  async getEnrollmentHistory(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('coach_enrollments')
      .select('*, coach:coach_id (*)')
      .eq('athlete_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoachService] Enrollment history error:', error);
      return [];
    }

    return data || [];
  }
};
