import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AppShell } from '@/components/layout/AppShell';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { 
  getWorkoutHistory, 
  getWorkoutStats, 
  WorkoutRecord 
} from '@/services/storage';

type ExerciseFilter = 'all' | 'pushup' | 'squat' | 'bicep_curl';

const EXERCISE_LABELS: Record<string, string> = {
  all: 'All',
  pushup: 'Pushups',
  squat: 'Squats',
  bicep_curl: 'Bicep Curls',
};

const EXERCISE_EMOJI: Record<string, string> = {
  pushup: '💪',
  squat: '🦵',
  bicep_curl: '🏋️',
};

const HistoryScreen = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutRecord[]>([]);
  const [filter, setFilter] = useState<ExerciseFilter>('all');
  const [stats, setStats] = useState<{
    totalWorkouts: number;
    totalReps: number;
    averageScore: number;
    thisWeek: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(null);

  const loadData = async () => {
    try {
      const [history, workoutStats] = await Promise.all([
        getWorkoutHistory(),
        getWorkoutStats(),
      ]);
      setWorkouts(history);
      setStats({
        totalWorkouts: workoutStats.totalWorkouts,
        totalReps: workoutStats.totalReps,
        averageScore: workoutStats.averageScore,
        thisWeek: workoutStats.thisWeek,
      });
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (filter === 'all') {
      setFilteredWorkouts(workouts);
    } else {
      setFilteredWorkouts(workouts.filter(w => w.exerciseType === filter));
    }
  }, [filter, workouts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.accentOrange;
    return '#F44336';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path 
            d="M15 18l-6-6 6-6" 
            stroke={theme.colors.surface} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <AppText variant="heading" weight="semibold">Workout History</AppText>
      <View style={styles.placeholder} />
    </View>
  );

  const renderFilterButton = (filterType: ExerciseFilter) => (
    <Pressable
      key={filterType}
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <AppText
        variant="bodySmall"
        weight="medium"
        color={filter === filterType ? theme.colors.textDark : theme.colors.placeholder}
      >
        {EXERCISE_LABELS[filterType]}
      </AppText>
    </Pressable>
  );

  const renderWorkoutItem = ({ item }: { item: WorkoutRecord }) => (
    <Pressable
      style={styles.workoutCard}
      onPress={() => setSelectedWorkout(selectedWorkout?.id === item.id ? null : item)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.exerciseInfo}>
          <View style={styles.emojiContainer}>
            <AppText style={styles.exerciseEmoji}>
              {EXERCISE_EMOJI[item.exerciseType] || '🏃'}
            </AppText>
          </View>
          <View>
            <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>
              {EXERCISE_LABELS[item.exerciseType] || item.exerciseType}
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.muted}>
              {formatDate(item.date)}
            </AppText>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <AppText variant="heading" weight="semibold" color={getScoreColor(item.formScore)}>
            {item.formScore}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.muted}>Form</AppText>
        </View>
      </View>

      <View style={styles.workoutStats}>
        <View style={styles.stat}>
          <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>
            {item.repCount}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.muted}>Reps</AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AppText variant="bodyLarge" weight="semibold" color={theme.colors.success}>
            {item.goodRepCount}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.muted}>Good</AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AppText 
            variant="bodyLarge" 
            weight="semibold" 
            color={item.badRepCount > 0 ? '#F44336' : theme.colors.success}
          >
            {item.badRepCount}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.muted}>Bad</AppText>
        </View>
      </View>

      {selectedWorkout?.id === item.id && (
        <View style={styles.expandedDetails}>
          {item.corrections.length > 0 && (
            <View style={styles.correctionsContainer}>
              <AppText variant="body" weight="semibold" color={theme.colors.textDark}>
                Form Corrections:
              </AppText>
              {item.corrections.map((correction, index) => (
                <View key={index} style={styles.correctionItem}>
                  <AppText color={theme.colors.accentOrange}>•</AppText>
                  <AppText variant="bodySmall" color={theme.colors.muted} style={styles.correctionText}>
                    {correction}
                  </AppText>
                </View>
              ))}
            </View>
          )}
          {item.repScores && item.repScores.length > 0 && (
            <View style={styles.repScoresContainer}>
              <AppText variant="body" weight="semibold" color={theme.colors.textDark}>
                Rep Scores:
              </AppText>
              <View style={styles.repScoresGrid}>
                {item.repScores.map((score, index) => (
                  <View key={index} style={styles.repScoreItem}>
                    <AppText variant="bodySmall" color={theme.colors.muted}>#{index + 1}</AppText>
                    <AppText variant="body" weight="medium" color={getScoreColor(score)}>
                      {score}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <AppText style={styles.emptyEmoji}>📊</AppText>
      <AppText variant="heading" weight="semibold" color={theme.colors.textPrimary}>
        No Workouts Yet
      </AppText>
      <AppText variant="body" color={theme.colors.placeholder} style={styles.emptyMessage}>
        {filter === 'all'
          ? "Complete your first workout to see your history here!"
          : `No ${EXERCISE_LABELS[filter].toLowerCase()} workouts found.`}
      </AppText>
      {filter !== 'all' && (
        <Pressable style={styles.showAllButton} onPress={() => setFilter('all')}>
          <AppText variant="body" weight="semibold" color={theme.colors.textDark}>
            Show All Workouts
          </AppText>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <AppShell>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="body" color={theme.colors.placeholder} style={{ marginTop: 12 }}>
            Loading history...
          </AppText>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.container}>
        {renderHeader()}

        {/* Stats Summary */}
        {stats && stats.totalWorkouts > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <AppText variant="heading" weight="semibold" color={theme.colors.textPrimary}>
                {stats.totalWorkouts}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>Total</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="heading" weight="semibold" color={theme.colors.textPrimary}>
                {stats.thisWeek}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>This Week</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="heading" weight="semibold" color={theme.colors.textPrimary}>
                {stats.totalReps}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>Total Reps</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="heading" weight="semibold" color={getScoreColor(stats.averageScore)}>
                {stats.averageScore}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>Avg Score</AppText>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pushup', 'squat', 'bicep_curl'] as ExerciseFilter[]).map(renderFilterButton)}
        </View>

        {/* Workout List */}
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cardDark,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  workoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  exerciseEmoji: {
    fontSize: 24,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.chartGrid,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.chartGrid,
  },
  expandedDetails: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.chartGrid,
  },
  correctionsContainer: {
    marginBottom: theme.spacing.sm,
  },
  correctionItem: {
    flexDirection: 'row',
    marginTop: theme.spacing.xxs,
    gap: theme.spacing.xs,
  },
  correctionText: {
    flex: 1,
    lineHeight: 18,
  },
  repScoresContainer: {
    marginTop: theme.spacing.xs,
  },
  repScoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  repScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyMessage: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xxxl,
    marginTop: theme.spacing.xs,
  },
  showAllButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
  },
});

export default HistoryScreen;
