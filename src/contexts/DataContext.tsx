import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { historyService, Session } from '@/services/history';
import { coachService, Submission, Enrollment, AppNotification } from '@/services/coach';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  history: Session[];
  reviewHistory: Submission[];
  notifications: AppNotification[];
  enrollmentHistory: any[];
  coachProfile: any | null;
  enrollment: Enrollment | null;
  teamAvg: number | undefined;
  stats: {
    score: number;
    trend: number;
    sparkline: number[];
  };
  isLatestSessionShared: boolean;
  loading: boolean;
  refreshing: boolean;
  refreshAll: () => Promise<void>;
  ensureDataLoaded: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  
  const [history, setHistory] = useState<Session[]>([]);
  const [reviewHistory, setReviewHistory] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [enrollmentHistory, setEnrollmentHistory] = useState<any[]>([]);
  const [coachProfile, setCoachProfile] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [teamAvg, setTeamAvg] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState({ score: 0, trend: 0, sparkline: [0, 0] });
  const [isLatestSessionShared, setIsLatestSessionShared] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);

  const calculateStats = useCallback((data: Session[]) => {
    if (data.length === 0) return;

    const sparkline = data.slice().reverse().map(s => s.qualityScore || s.consistency);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekSessions = data.filter(s => new Date(s.date) >= oneWeekAgo);
    const prevWeekSessions = data.filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo);

    const currentAvg = currentWeekSessions.length > 0 
      ? Math.round(currentWeekSessions.reduce((acc, s) => acc + (s.qualityScore || s.consistency), 0) / currentWeekSessions.length)
      : (data[0]?.qualityScore || 0);

    const prevAvg = prevWeekSessions.length > 0
      ? prevWeekSessions.reduce((acc, s) => acc + (s.qualityScore || s.consistency), 0) / prevWeekSessions.length
      : currentAvg;

    const trend = prevAvg === 0 ? 0 : Math.round(((currentAvg - prevAvg) / prevAvg) * 100);

    setStats({
      score: currentAvg,
      trend: trend,
      sparkline: sparkline.length > 1 ? sparkline : [currentAvg, currentAvg]
    });
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [newHistory, newReviewHistory, newNotifs, newEnrollHistory] = await Promise.all([
        historyService.getHistory(),
        coachService.getReviewsHistory(profile.id),
        coachService.getNotifications(),
        coachService.getEnrollmentHistory()
      ]);

      setHistory(newHistory);
      calculateStats(newHistory);
      setReviewHistory(newReviewHistory);
      setNotifications(newNotifs);
      setEnrollmentHistory(newEnrollHistory);

      // Check if latest session is already shared
      if (newHistory.length > 0) {
        const latestId = newHistory[0].id;
        const { data: existing } = await supabase
          .from('coach_submissions')
          .select('id')
          .eq('session_id', latestId)
          .single();
        setIsLatestSessionShared(!!existing);
      }

      // Find active enrollment
      const activeEnrollment = newEnrollHistory.find(e => e.status === 'accepted' || e.status === 'pending');
      setEnrollment(activeEnrollment || null);

      if (profile.coach_id) {
        const [cProfile, avg] = await Promise.all([
          coachService.getCoachProfile(profile.coach_id),
          coachService.getTeamAverage(profile.coach_id)
        ]);
        setCoachProfile(cProfile);
        setTeamAvg(avg);
      } else if (activeEnrollment?.coach) {
        setCoachProfile(activeEnrollment.coach);
        setTeamAvg(undefined);
      } else {
        setCoachProfile(null);
        setTeamAvg(undefined);
      }

      setHasLoadedInitially(true);
    } catch (error) {
      console.error('[DataContext] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, profile?.coach_id, calculateStats]);

  const refreshAll = useCallback(() => loadData(true), [loadData]);
  
  const ensureDataLoaded = useCallback(async () => {
    if (!hasLoadedInitially) {
      await loadData();
    }
  }, [hasLoadedInitially, loadData]);

  return (
    <DataContext.Provider value={{
      history,
      reviewHistory,
      notifications,
      enrollmentHistory,
      coachProfile,
      enrollment,
      teamAvg,
      stats,
      isLatestSessionShared,
      loading,
      refreshing,
      refreshAll,
      ensureDataLoaded
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
