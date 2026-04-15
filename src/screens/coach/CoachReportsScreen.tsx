import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { coachService } from '@/services/coach';
import { CoachHeader } from '@/components/coach/CoachHeader';

const EXERCISES = [
  { id: 'pushups', label: 'Pushups' },
  { id: 'squats', label: 'Squats' },
  { id: 'bicep_curls', label: 'Curls' },
];

const TIMEFRAMES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All Time' },
];

const RANK_LABELS = ['1ST', '2ND', '3RD'];
const PODIUM_COLORS = [theme.colors.yellow, theme.colors.lavender, theme.colors.accentOrange];
const ROW_COLORS = [theme.colors.success, theme.colors.lavender, theme.colors.yellow, theme.colors.accentOrange];

export function CoachReportsScreen() {
  const [selectedExercise, setSelectedExercise] = useState('pushups');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'quality' | 'reps'>('quality');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(refreshing ? false : true);
    try {
      const data = await coachService.getTeamLeaderboard(selectedExercise, selectedTimeframe, sortBy);
      setLeaderboard(data);
    } catch (error) {
      console.error('[CoachReports] Leaderboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedExercise, selectedTimeframe, sortBy]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <AppShell hasTabBar={true}>
      <CoachHeader title="Team Analytics" />

      {/* Exercise tab bar — pill style matching AnalysisScreen exactly */}
      <View style={styles.tabBar}>
        {EXERCISES.map((ex) => {
          const active = selectedExercise === ex.id;
          return (
            <Pressable
              key={ex.id}
              onPress={() => setSelectedExercise(ex.id)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <AppText
                variant="body"
                weight="semibold"
                color={active ? theme.colors.textDark : theme.colors.nearBlack}
              >
                {ex.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe row */}
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => {
            const active = selectedTimeframe === tf.id;
            return (
              <Pressable
                key={tf.id}
                onPress={() => setSelectedTimeframe(tf.id as any)}
                style={[styles.tfPill, active && styles.tfPillActive]}
              >
                <AppText
                  variant="tiny"
                  weight="bold"
                  color={active ? theme.colors.textDark : theme.colors.placeholder}
                >
                  {tf.label.toUpperCase()}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Sort toggle */}
        <View style={styles.sortRow}>
          <AppText variant="tiny" weight="bold" color={theme.colors.placeholder} style={{ letterSpacing: 1.5 }}>
            SORT BY
          </AppText>
          <View style={styles.sortToggle}>
            <Pressable
              style={[styles.sortBtn, sortBy === 'quality' && styles.sortBtnActive]}
              onPress={() => setSortBy('quality')}
            >
              <AppText variant="tiny" weight="bold" color={sortBy === 'quality' ? theme.colors.textDark : theme.colors.placeholder}>
                QUALITY
              </AppText>
            </Pressable>
            <Pressable
              style={[styles.sortBtn, sortBy === 'reps' && styles.sortBtnActive]}
              onPress={() => setSortBy('reps')}
            >
              <AppText variant="tiny" weight="bold" color={sortBy === 'reps' ? theme.colors.textDark : theme.colors.placeholder}>
                REPS
              </AppText>
            </Pressable>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="bodyLarge" weight="bold" color={theme.colors.placeholder}>No Data Yet</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center', marginTop: 4 }}>
              Rankings will appear once your athletes start submitting sessions.
            </AppText>
          </View>
        ) : (
          <>
            {/* PODIUM — Top 3 as hero colored cards side by side */}
            {topThree.length > 0 && (
              <View style={styles.podiumSection}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.sectionLabel}>
                  TOP PERFORMERS
                </AppText>

                {/* 1st place — full-width hero */}
                {topThree[0] && (
                  <View style={[styles.firstCard, { backgroundColor: theme.colors.yellow }]}>
                    <View style={styles.firstLeft}>
                      <AppText style={styles.medal}>{RANK_LABELS[0]}</AppText>
                      <View style={styles.podiumAvatar}>
                        <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                          {topThree[0].fullName?.charAt(0)}
                        </AppText>
                      </View>
                      <View>
                        <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                          {topThree[0].fullName}
                        </AppText>
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>
                          @{topThree[0].username}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.firstScore}>
                      <AppText variant="hero" weight="bold" color={theme.colors.textDark}>
                        {sortBy === 'quality' ? `${topThree[0].quality}%` : topThree[0].reps}
                      </AppText>
                      <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>
                        {sortBy === 'quality' ? 'AVG SCORE' : 'TOTAL REPS'}
                      </AppText>
                    </View>
                  </View>
                )}

                {/* 2nd & 3rd — side by side */}
                {topThree.length > 1 && (
                  <View style={styles.podiumRow}>
                    {topThree.slice(1, 3).map((item, i) => (
                      <View
                        key={item.athleteId}
                        style={[styles.podiumCard, { backgroundColor: PODIUM_COLORS[i + 1] }]}
                      >
                        <AppText style={styles.medalSmall}>{RANK_LABELS[i + 1]}</AppText>
                        <View style={styles.podiumAvatarSm}>
                          <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark}>
                            {item.fullName?.charAt(0)}
                          </AppText>
                        </View>
                        <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark} numberOfLines={1}>
                          {item.fullName?.split(' ')[0]}
                        </AppText>
                        <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                          {sortBy === 'quality' ? `${item.quality}%` : item.reps}
                        </AppText>
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>
                          {sortBy === 'quality' ? 'SCORE' : 'REPS'}
                        </AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* REST — rank 4+ as colored row cards */}
            {rest.length > 0 && (
              <View style={styles.restSection}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.sectionLabel}>
                  FULL STANDINGS
                </AppText>
                {rest.map((item, index) => {
                  const cardBg = ROW_COLORS[index % ROW_COLORS.length];
                  return (
                    <View key={item.athleteId} style={[styles.rowCard, { backgroundColor: cardBg }]}>
                      <View style={styles.rowLeft}>
                        <View style={styles.rankNumBox}>
                          <AppText variant="heading" weight="bold" color={theme.colors.textDark}>{index + 4}</AppText>
                        </View>
                        <View style={styles.rowAvatar}>
                          <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>
                            {item.fullName?.charAt(0)}
                          </AppText>
                        </View>
                        <View>
                          <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark}>{item.fullName}</AppText>
                          <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>@{item.username}</AppText>
                        </View>
                      </View>
                      <View style={styles.rowScore}>
                        <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                          {sortBy === 'quality' ? `${item.quality}%` : item.reps}
                        </AppText>
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>
                          {sortBy === 'quality' ? 'SCORE' : 'REPS'}
                        </AppText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  // Tab bar — matches AnalysisScreen pill style exactly
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    padding: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tabPill: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
  },
  tabPillActive: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.pill,
    padding: 4,
  },
  tfPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.pill,
  },
  tfPillActive: {
    backgroundColor: theme.colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.pill,
    padding: 4,
  },
  sortBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
  },
  sortBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  sectionLabel: {
    letterSpacing: 2,
    opacity: 0.6,
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    marginTop: 40,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.radii.largeCard,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // Podium
  podiumSection: {
    gap: theme.spacing.md,
  },
  firstCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  firstLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  medal: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: 1,
    opacity: 0.5,
  },
  medalSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: 1,
    opacity: 0.5,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstScore: {
    alignItems: 'flex-end',
    gap: 2,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  podiumCard: {
    flex: 1,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  podiumAvatarSm: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rest
  restSection: {
    gap: theme.spacing.sm,
  },
  rowCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  rankNumBox: {
    width: 32,
    alignItems: 'center',
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowScore: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
