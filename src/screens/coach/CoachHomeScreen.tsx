import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { coachService, Submission } from '@/services/coach';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { supabase } from '@/lib/supabase';

export function CoachHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [inbox, setInbox] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(refreshing ? false : true);
    try {
      const [athletesData, inboxData, leaderboardData] = await Promise.all([
        coachService.getMyAthletes(),
        coachService.getInbox(),
        coachService.getTeamLeaderboard('pushups', 'all', 'quality'),
      ]);
      setAthletes((athletesData || []).filter(Boolean));
      setInbox(inboxData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('[CoachHome] Data load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadData(); 

    // Real-time synchronization
    // 1. Listen for new submissions to update inbox and quality scores
    const submissionChannel = supabase.channel('coach-submissions-sync')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'coach_submissions',
          filter: `coach_id=eq.${profile?.id}`
        },
        () => {
          console.log('[CoachHome] Real-time submission update detected');
          loadData();
        }
      )
      .subscribe();

    // 2. Listen for enrollment requests/changes
    const enrollmentChannel = supabase.channel('coach-enrollments-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_enrollments',
          filter: `coach_id=eq.${profile?.id}`
        },
        () => {
          console.log('[CoachHome] Real-time enrollment update detected');
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionChannel);
      supabase.removeChannel(enrollmentChannel);
    };
  }, [profile?.id]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const pendingCount = inbox.filter(i => i.status === 'pending').length;
  const topAthlete = leaderboard[0];

  // Build sparkline from leaderboard quality scores — each bar = one athlete's avg quality
  const sparkValues = leaderboard.map((e: any) => e.quality || 0);
  const teamAvgQuality = sparkValues.length > 0
    ? Math.round(sparkValues.reduce((a: number, b: number) => a + b, 0) / sparkValues.length)
    : 0;

  const SPARK_H = 48;
  const SPARK_W = 160;
  const buildTeamLine = () => {
    if (sparkValues.length < 2) return '';
    return sparkValues.map((val: number, i: number) => {
      const x = (i / (sparkValues.length - 1)) * SPARK_W;
      const y = SPARK_H - (Math.min(Math.max(val, 0), 100) / 100) * SPARK_H;
      return `${i === 0 ? 'M' : 'L'} ${Math.round(x)},${Math.round(y)}`;
    }).join(' ');
  };
  const lastDot = sparkValues.length >= 1 ? {
    x: SPARK_W,
    y: SPARK_H - (Math.min(Math.max(sparkValues[sparkValues.length - 1], 0), 100) / 100) * SPARK_H,
  } : null;

  return (
    <AppShell hasTabBar={true}>
      <CoachHeader
        title={profile?.full_name || 'Coach'}
        subtitle="Welcome back"
        showAvatar={true}
        showNotifications={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Metric Cards — solid color, matching AnalysisScreen heroCard style */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: theme.colors.lavender }]}>
                <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{athletes.length}</AppText>
                <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={styles.metricLabel}>ACTIVE MENTEES</AppText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: pendingCount > 0 ? theme.colors.yellow : theme.colors.success }]}>
                <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{pendingCount}</AppText>
                <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={styles.metricLabel}>PENDING REVIEWS</AppText>
              </View>
            </View>

            {/* Top Performer — accentOrange card */}
            {topAthlete ? (
              <View style={[styles.performerCard, { backgroundColor: theme.colors.accentOrange }]}>
                <View style={styles.performerLeft}>
                  <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>TOP PERFORMER</AppText>
                  <AppText variant="heading" weight="bold" color={theme.colors.textDark}>{topAthlete.fullName}</AppText>
                  <AppText variant="bodySmall" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>@{topAthlete.username}</AppText>
                </View>
                <View style={styles.performerRight}>
                  <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{topAthlete.quality}%</AppText>
                  <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>AVG QUALITY</AppText>
                </View>
              </View>
            ) : null}

            {/* Team Quality Sparkline Card */}
            <View style={styles.snapCard}>
              <View style={styles.snapLeft}>
                <AppText variant="tiny" weight="bold" color="rgba(255,255,255,0.5)" style={{ letterSpacing: 1.5 }}>
                  TEAM QUALITY
                </AppText>
                <View style={styles.snapScoreRow}>
                  <AppText variant="hero" weight="bold" color={theme.colors.textPrimary}>
                    {athletes.length > 0 ? `${teamAvgQuality}%` : '--'}
                  </AppText>
                  {sparkValues.length >= 2 && (
                    <View style={[
                      styles.trendPill,
                      { backgroundColor: sparkValues[sparkValues.length - 1] >= sparkValues[0] ? 'rgba(69,197,136,0.2)' : 'rgba(255,82,82,0.2)' },
                    ]}>
                      <AppText
                        variant="bodySmall"
                        weight="bold"
                        color={sparkValues[sparkValues.length - 1] >= sparkValues[0] ? theme.colors.success : theme.colors.error}
                      >
                        {sparkValues[sparkValues.length - 1] >= sparkValues[0] ? '↑' : '↓'} Trending
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.4)">
                  {athletes.length > 0 ? `Across ${athletes.length} athlete${athletes.length !== 1 ? 's' : ''}` : 'No athletes yet'}
                </AppText>
              </View>

              <View style={styles.snapRight}>
                {sparkValues.length >= 2 ? (
                  <Svg width={SPARK_W} height={SPARK_H}>
                    {[0, SPARK_H * 0.5, SPARK_H].map(yPos => (
                      <Line
                        key={yPos}
                        x1={0} y1={yPos} x2={SPARK_W} y2={yPos}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth={1}
                      />
                    ))}
                    <Path
                      d={buildTeamLine()}
                      fill="none"
                      stroke={theme.colors.success}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {lastDot && (
                      <Circle cx={lastDot.x} cy={lastDot.y} r={4} fill={theme.colors.success} />
                    )}
                  </Svg>
                ) : (
                  <View style={styles.snapEmpty}>
                    <AppText variant="tiny" color="rgba(255,255,255,0.3)">No data</AppText>
                  </View>
                )}
                <View style={styles.snapLabels}>
                  <AppText variant="tiny" color="rgba(255,255,255,0.25)">Best</AppText>
                  <AppText variant="tiny" color="rgba(255,255,255,0.25)">Weakest</AppText>
                </View>
              </View>
            </View>

            {/* Recent Submissions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText variant="heading" weight="semibold">Recent Activity</AppText>
                <Pressable onPress={() => navigation.navigate(routes.coachInbox)}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>SEE ALL</AppText>
                </Pressable>
              </View>

              {inbox.length === 0 ? (
                <View style={styles.emptyState}>
                  <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center' }}>
                    No recent tests submitted for review.
                  </AppText>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                  {inbox.slice(0, 6).map((sub, index) => {
                    const colors = [theme.colors.lavender, theme.colors.success, theme.colors.yellow, theme.colors.accentOrange];
                    const bg = colors[index % colors.length];
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[styles.galleryCard, { backgroundColor: bg, width: 140, zIndex: 10 }]}
                        activeOpacity={0.6}
                        onPress={() => {
                          console.log('[CoachHome] Tapped submission:', sub.id);
                          // Alert.alert("Debug", "Tapped " + sub.id); // Uncomment for extreme debugging
                          navigation.navigate('CoachReview', { 
                            submissionId: sub.id,
                            athleteName: sub.athlete?.full_name || 'Athlete',
                            sessionData: sub.session
                          });
                        }}
                      >
                        <View style={styles.galleryAvatar} pointerEvents="none">
                          <AppText variant="body" weight="bold" color={theme.colors.textDark}>
                            {sub.session?.quality_score ?? '??'}%
                          </AppText>
                        </View>
                        <View style={{ alignItems: 'center' }} pointerEvents="none">
                          <AppText variant="tiny" weight="bold" color={theme.colors.textDark} numberOfLines={1}>
                            {(sub.session?.exercise_name || 'Test').toUpperCase()}
                          </AppText>
                          <AppText variant="tiny" color={theme.colors.nearBlack} numberOfLines={1} style={{ opacity: 0.7 }}>
                            {sub.athlete?.full_name?.split(' ')[0] ?? '—'}
                          </AppText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Quick Action — Inbox shortcut */}
            <Pressable
              style={[styles.inboxBanner, { backgroundColor: pendingCount > 0 ? theme.colors.yellow : 'rgba(255,255,255,0.03)' }]}
              onPress={() => navigation.navigate(routes.coachInbox)}
            >
              <View>
                <AppText variant="heading" weight="bold" color={pendingCount > 0 ? theme.colors.textDark : theme.colors.textPrimary}>
                  {pendingCount > 0 ? `${pendingCount} Pending Review${pendingCount !== 1 ? 's' : ''}` : 'Submission Inbox'}
                </AppText>
                <AppText variant="bodySmall" color={pendingCount > 0 ? theme.colors.nearBlack : theme.colors.placeholder} style={{ opacity: 0.8 }}>
                  {pendingCount > 0 ? 'Tap to review athlete submissions' : 'No new submissions right now'}
                </AppText>
              </View>
              <AppText variant="title" color={pendingCount > 0 ? theme.colors.textDark : theme.colors.placeholder}>→</AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.lg,
  },
  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: 4,
    alignItems: 'flex-start',
  },
  metricLabel: {
    opacity: 0.65,
    letterSpacing: 1,
  },
  // Top Performer
  performerCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performerLeft: {
    flex: 1,
    gap: 2,
  },
  performerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  // Recent Athletes gallery
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gallery: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  galleryCard: {
    width: 88,
    height: 100,
    borderRadius: theme.radii.largeCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  galleryAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryName: {
    textAlign: 'center',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.radii.largeCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  // Team Quality Snap card
  snapCard: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  snapLeft: {
    flex: 1,
    gap: 6,
  },
  snapScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  trendPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
  },
  snapRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  snapEmpty: {
    width: 160,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.radii.card,
  },
  snapLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 160,
  },
  // Inbox banner
  inboxBanner: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
