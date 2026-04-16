import { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { CalendarStrip } from '@/components/home/CalendarStrip';
import { PerformanceSnap } from '@/components/home/PerformanceSnap';
import { getCurrentWeekDays, getTodayKey } from '@/utils/date';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { historyService, Session } from '@/services/history';
import { coachService } from '@/services/coach';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { profile } = useAuth();
  
  // Dynamic Calendar Data
  const [calendarDays, setCalendarDays] = useState(getCurrentWeekDays());
  const [selectedDayKey, setSelectedDayKey] = useState(getTodayKey());
  
  const [history, setHistory] = useState<Session[]>([]);
  const [stats, setStats] = useState({ score: 0, trend: 0, sparkline: [] as number[] });
  const [teamAvg, setTeamAvg] = useState(0);

  const visibleDays = useMemo(
    () =>
      calendarDays.map((item) => ({
        ...item,
        isSelected: item.key === selectedDayKey,
      })),
    [selectedDayKey, calendarDays],
  );

  const calculateQuickStats = (sessions: Session[]) => {
    if (!sessions || sessions.length === 0) {
      return { score: 0, trend: 0, sparkline: [] };
    }

    // Sort by date descending
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Latest score
    const currentScore = sorted[0].qualityScore || 0;
    
    // Trend (vs previous session)
    let trendValue = 0;
    if (sorted.length > 1) {
      const prevScore = sorted[1].qualityScore || 0;
      trendValue = currentScore - prevScore;
    }

    // Sparkline (last 7 sessions in chronological order for chart)
    const last7 = sorted.slice(0, 7).reverse().map(s => s.qualityScore || 0);

    return {
      score: Math.round(currentScore),
      trend: Math.round(trendValue),
      sparkline: last7,
    };
  };

  const loadData = async () => {
    try {
      // 1. Load History
      const historyData = await historyService.getHistory();
      setHistory(historyData);

      // 2. Calculate local stats
      const localStats = calculateQuickStats(historyData);
      setStats(localStats);

      // 3. Load team average if enrolled with a coach
      if (profile?.coach_id) {
        const avg = await coachService.getTeamAverage(profile.coach_id);
        setTeamAvg(avg);
      }
    } catch (e) {
      console.error('[HomeScreen] Data load error:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [profile?.coach_id])
  );

  return (
    <AppShell scrollable hasTabBar={true}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant="heading" weight="semibold">Athlete HQ</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder}>Welcome back, {profile?.full_name?.split(' ')[0] || 'Player'}</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => navigation.navigate(routes.profile as any)}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarInitial]}>
                  <AppText variant="body" weight="bold" color={theme.colors.textPrimary}>
                    {(profile?.username || profile?.full_name || 'A').charAt(0).toUpperCase()}
                  </AppText>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.bellButton} onPress={() => navigation.navigate(routes.notifications as any)}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={theme.colors.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>
        </View>

        <CalendarStrip days={visibleDays} onSelectDay={setSelectedDayKey} />

        <PerformanceSnap 
          score={stats.score} 
          trend={stats.trend} 
          history={stats.sparkline} 
          teamAverage={teamAvg}
        />

        <View style={styles.insightSection}>
          <AppText variant='bodySmall' color='rgba(18, 18, 18, 0.6)' weight='bold'>PERFORMANCE SPOTLIGHT</AppText>
          <View style={styles.spotlightRow}>
            <View style={styles.spotlightItem}>
              <AppText variant='title' weight='bold' color={theme.colors.textDark}>{history.length > 0 ? `${stats.score}%` : '--'}</AppText>
              <AppText variant='bodySmall' color='rgba(18, 18, 18, 0.6)' weight='bold'>PRO QUALITY</AppText>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.spotlightItem}>
              <AppText variant='title' weight='bold' color={theme.colors.textDark}>
                {history.length > 0 ? (history.length > 1 ? (stats.trend >= 0 ? `+${stats.trend}%` : `${stats.trend}%`) : '--' ) : '--'}
              </AppText>
              <AppText variant='bodySmall' color='rgba(18, 18, 18, 0.6)' weight='bold'>TREND</AppText>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant='bodyLarge' weight='bold' color={theme.colors.textDark}>
              {history.length > 0 ? "Top Analysis: " : "Ready to Train"}
            </AppText>
            <AppText variant='body' weight='semibold' color='rgba(18, 18, 18, 0.8)'>
              {history.length > 0 ? (
                (() => {
                  const types = [...new Set(history.map(s => s.exerciseType))];
                  return types[0]?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Keep playing!';
                })()
              ) : (
                "Complete a test to unlock AI insights."
              )}
            </AppText>
          </View>
        </View>

        <View style={styles.activityHeader}>
          <AppText variant='heading' weight='semibold'>Recent Activity</AppText>
        </View>

        <View style={styles.activityFeed}>
          {history.length > 0 ? (
            history.slice(0, 3).map((session, idx) => {
              const bgColors = [theme.colors.lavender, theme.colors.success, theme.colors.accentOrange];
              const cardBg = bgColors[idx % bgColors.length];
              return (
                <Pressable 
                  key={session.id} 
                  onPress={() => {
                    navigation.navigate(routes.analysisResults as any, { 
                      session, 
                      exerciseType: session.exerciseType 
                    });
                  }}
                  style={({ pressed }) => [
                    styles.activityCard, 
                    { 
                      backgroundColor: cardBg,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: theme.colors.textDark }]}>
                    <AppText variant="bodySmall" weight="bold" color={theme.colors.surface}>
                      {session.exerciseType.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" weight="semibold" color={theme.colors.textDark}>
                      {(session.exerciseType || 'Exercise').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </AppText>
                    <AppText variant="bodySmall" color="rgba(18, 18, 18, 0.6)">
                      {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </AppText>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                    <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>{session.qualityScore || 0}%</AppText>
                  </View>
                </Pressable>
              );
            })
          ) : (
           <View style={styles.emptyFeed}>
              <AppText variant="bodyLarge" weight="bold" color={theme.colors.surface}>No recent activities</AppText>
              <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center', marginTop: 4 }}>
                Start a training session or test to visualize your performance metrics.
              </AppText>
              <Pressable 
                onPress={() => navigation.navigate(routes.training as any)}
                style={styles.emptyAction}
              >
                <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>START TRAINING</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.lavender,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightSection: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.largeCard,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.lavender,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  spotlightItem: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: theme.spacing.lg,
  },
  activityHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  activityFeed: {
    gap: theme.spacing.md,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.card,
    gap: theme.spacing.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  emptyState: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyAction: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.pill,
    elevation: 4, 
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
