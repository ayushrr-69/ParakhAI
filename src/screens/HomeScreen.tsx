import { useFocusEffect } from '@react-navigation/native';
import { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { CalendarStrip } from '@/components/home/CalendarStrip';
import { ActionBlockGrid } from '@/components/home/ActionBlockGrid';
import { BottomNav } from '@/components/navigation/BottomNav';
import { PerformanceSnap } from '@/components/home/PerformanceSnap';
import { calendarDays, homeTestActions } from '@/constants/content';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { historyService, Session } from '@/services/history';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<Session[]>([]);
  const [stats, setStats] = useState({ score: 0, trend: 0, sparkline: [0, 0] });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await historyService.getHistory();
        setHistory(data);
        
        if (data.length === 0) return;

        // Simple weekly logic: 
        // 1. Sparkline: Full available history (reversed so latest is right)
        const sparkline = data.slice().reverse().map(s => s.qualityScore || s.consistency);
        
        // 2. Weekly Avg: Last 7 days vs previous 7 days
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const currentWeekSessions = data.filter(s => new Date(s.date) >= oneWeekAgo);
        const prevWeekSessions = data.filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo);

        const currentAvg = currentWeekSessions.length > 0 
          ? Math.round(currentWeekSessions.reduce((acc, s) => acc + (s.qualityScore || s.consistency), 0) / currentWeekSessions.length)
          : (data[0]?.qualityScore || 0); // Fallback to last score if no sessions this week

        const prevAvg = prevWeekSessions.length > 0
          ? prevWeekSessions.reduce((acc, s) => acc + (s.qualityScore || s.consistency), 0) / prevWeekSessions.length
          : currentAvg;

        const trend = prevAvg === 0 ? 0 : Math.round(((currentAvg - prevAvg) / prevAvg) * 100);

        setStats({
          score: currentAvg,
          trend: trend,
          sparkline: sparkline.length > 1 ? sparkline : [currentAvg, currentAvg]
        });
      };
      loadData();
    }, [])
  );

  const initialDay = calendarDays.find((item) => item.isSelected)?.key ?? calendarDays[0]?.key ?? 'thu';
  const [selectedDayKey, setSelectedDayKey] = useState(initialDay);
  const visibleDays = useMemo(
    () =>
      calendarDays.map((item) => ({
        ...item,
        isSelected: item.key === selectedDayKey,
      })),
    [selectedDayKey],
  );

  return (
    <AppShell scrollable footerMode='sticky'>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant='bodyLarge' color={theme.colors.placeholder}>Welcome back</AppText>
            <AppText variant='heading' weight='semibold'>{profile?.full_name || 'Athlete'}</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => navigation.navigate(routes.profile as any)}>
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <Image 
                  source={{ uri: user?.user_metadata?.avatar_url || user?.user_metadata?.picture }} 
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
              <Svg width={20} height={20} viewBox='0 0 22 22' fill='none'>
                <Path d='M11 4.5a4 4 0 0 0-4 4v2.2c0 .7-.2 1.4-.6 2l-1.2 1.8h11.6l-1.2-1.8a3.6 3.6 0 0 1-.6-2V8.5a4 4 0 0 0-4-4Z' stroke={theme.colors.surface} strokeWidth={1.7} />
                <Path d='M9 17a2.4 2.4 0 0 0 4 0' stroke={theme.colors.surface} strokeWidth={1.7} strokeLinecap='round' />
                <Circle cx={16.5} cy={5.5} r={2.5} fill={theme.colors.primary} />
              </Svg>
            </Pressable>
          </View>
        </View>

        <CalendarStrip days={visibleDays} onSelectDay={setSelectedDayKey} />

        <PerformanceSnap 
          score={stats.score} 
          trend={stats.trend} 
          history={stats.sparkline} 
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
                <View 
                  key={session.id} 
                  style={[
                    styles.activityCard, 
                    { backgroundColor: cardBg }
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
                </View>
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
    paddingBottom: 150, // Global buffer to clear the floating bottom nav
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    // Solid color, premium look
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
  emptyFeed: {
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
    elevation: 4, // Make it pop
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
