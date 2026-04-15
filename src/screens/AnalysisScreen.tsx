import { useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '@/components/common/AppText';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { AppShell } from '@/components/layout/AppShell';
import { analysisCopy, analysisTabs, subroutineBreakdown } from '@/constants/content';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { historyService, Session } from '@/services/history';

type Props = NativeStackScreenProps<RootStackParamList, 'Analysis'>;

export function AnalysisScreen(_: Props) {
  const [activeExercise, setActiveExercise] = useState<'pushups' | 'squats' | 'bicep_curls'>('pushups');
  const [sessions, setSessions] = useState<Session[]>([]);

  const exerciseTabs: Array<'pushups' | 'squats' | 'bicep_curls'> = ['pushups', 'squats', 'bicep_curls'];

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        const history = await historyService.getHistory();
        setSessions(history);
      };
      loadHistory();
    }, [])
  );

  const { chartUserSeries, chartLabels } = useMemo(() => {
    // Filter and sort sessions for the selected exercise by date (oldest to newest)
    const filtered = sessions
      .filter(s => s.exerciseType === activeExercise)
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB; 
        return a.id.localeCompare(b.id);
      });

    if (filtered.length === 0) {
      return { chartUserSeries: undefined, chartLabels: undefined };
    }

    const scores = filtered.map(s => (s as any).qualityScore || 0);
    const labels = filtered.map(s => {
      const d = new Date(s.date);
      return `${d.getDate()}/${d.getMonth() + 1}`; 
    });

    return { chartUserSeries: scores, chartLabels: labels };
  }, [sessions, activeExercise]);

  return (
    <AppShell scrollable hasTabBar={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant='heading' weight='semibold'>Performance Quality</AppText>
          <AppText variant='bodySmall' color={theme.colors.placeholder}>Comparing your movement quality against elite standards</AppText>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.colors.success }]}>
          <AppText variant='title' weight='semibold'>Quality vs. Elite Standards</AppText>
          <AppText variant='bodyLarge'>Scores are calculated based on form stability and repetition accuracy.</AppText>
        </View>

        <View style={styles.tabBar}>
          {exerciseTabs.map((tab) => {
            const active = tab === activeExercise;
            return (
              <Pressable key={tab} onPress={() => setActiveExercise(tab)} style={[styles.tabPill, active && styles.activeTab]}>
                <AppText variant='body' weight='semibold' color={active ? theme.colors.textDark : theme.colors.nearBlack}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.lavender }]}>
          <View style={styles.chartHeader}>
             <AppText variant='title' weight='semibold' color={theme.colors.nearBlack}>Session Quality (0-100)</AppText>
             <AppText variant='bodySmall' color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>Standardized Grade</AppText>
          </View>
          <PerformanceChart 
            type={activeExercise as any} 
            userSeries={chartUserSeries} 
            labels={chartLabels} 
          />
        </View>

        <View style={[styles.analysisCard, { backgroundColor: theme.colors.success }]}>
          <AppText variant='title' weight='semibold'>AI Analysis</AppText>
          <AppText variant='bodyLarge'>{activeExercise === 'pushups' ? analysisCopy.weekly : analysisCopy.monthly}</AppText>
        </View>

        <View style={[styles.subroutineCard, { backgroundColor: theme.colors.yellow }]}>
          <AppText variant='title' weight='semibold' color={theme.colors.textDark}>Subroutine Details</AppText>
          <AppText variant='bodyLarge' color={theme.colors.textDark}>Where you lack behind (% people are ahead)</AppText>
          <View style={styles.subroutineRow}>
            {subroutineBreakdown.map((item) => (
              <View key={item.key} style={[styles.subroutineItem, { backgroundColor: item.backgroundColor }]}>
                <AppText variant='bodySmall' weight='medium' color={theme.colors.textDark}>{item.title}</AppText>
                <AppText variant='title' weight='semibold' color={theme.colors.textDark}>{item.percentage}</AppText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    gap: 2,
    marginTop: theme.spacing.sm,
  },
  heroCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    padding: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabPill: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  chartCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  analysisCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  subroutineCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  subroutineRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  subroutineItem: {
    flex: 1,
    borderRadius: theme.radii.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
});
