import { useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { historyService, Session } from '@/services/history';

type Props = NativeStackScreenProps<RootStackParamList, 'Tests'>;

export function TestsScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [sortHigh, setSortHigh] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        const history = await historyService.getHistory();
        setSessions(history);
      };
      loadHistory();
    }, [])
  );

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(s => s.exerciseType === filterType);
    }

    // Filter by date
    const now = new Date();
    if (filterDate === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(s => new Date(s.date) >= sevenDaysAgo);
    } else if (filterDate === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(s => new Date(s.date) >= thirtyDaysAgo);
    }

    // Sort
    if (sortHigh) {
      result.sort((a, b) => ((b as any).qualityScore || 0) - ((a as any).qualityScore || 0));
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [sessions, filterType, filterDate, sortHigh]);

  const handleSessionPress = (session: Session) => {
    navigation.navigate(routes.analysisResults as any, {
      session: session,
      exerciseType: session.exerciseType as any,
    });
  };

  return (
    <AppShell scrollable hasTabBar={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant='heading' weight='semibold'>Tests</AppText>
          <AppText variant='bodySmall' color={theme.colors.placeholder}>Review and analyze your training history</AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant='title' weight='semibold'>Filters</AppText>
            <Pressable onPress={() => setSortHigh(!sortHigh)} style={[styles.sortBtn, sortHigh && styles.sortBtnActive]}>
              <AppText variant="tiny" weight="bold" color={sortHigh ? theme.colors.surface : theme.colors.placeholder}>
                {sortHigh ? 'HIGHEST SCORE' : 'LATEST FIRST'}
              </AppText>
            </Pressable>
          </View>
          
          <View style={styles.filterGroup}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {['all', 'pushups', 'squats', 'bicep_curls'].map(type => (
                <Pressable 
                  key={type} 
                  onPress={() => setFilterType(type)}
                  style={[styles.filterChip, filterType === type && styles.filterChipActive]}
                >
                  <AppText variant="tiny" weight="bold" color={filterType === type ? theme.colors.surface : theme.colors.placeholder}>
                    {type.replace('_', ' ').toUpperCase()}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
            
            <View style={styles.filterRow}>
              {[
                { label: 'ALL TIME', val: 'all' },
                { label: 'LAST 7D', val: '7d' },
                { label: 'LAST 30D', val: '30d' }
              ].map(d => (
                <Pressable 
                  key={d.val} 
                  onPress={() => setFilterDate(d.val)}
                  style={[styles.dateChip, filterDate === d.val && styles.dateChipActive]}
                >
                  <AppText variant="tiny" weight="bold" color={filterDate === d.val ? theme.colors.textDark : theme.colors.placeholder}>
                    {d.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant='title' weight='semibold'>Archive</AppText>
            <AppText variant='bodySmall' color={theme.colors.placeholder}>{filteredSessions.length} sessions found</AppText>
          </View>
          
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText variant='bodyLarge' color={theme.colors.placeholder} style={{ textAlign: 'center' }}>
                No sessions match your filters.
              </AppText>
            </View>
          ) : (
            <View style={styles.historyList}>
              {filteredSessions.map((session, idx) => {
                const bgColors = [theme.colors.lavender, theme.colors.success, theme.colors.accentOrange];
                const cardBg = bgColors[idx % bgColors.length];
                return (
                  <Pressable 
                    key={session.id} 
                    style={[styles.historyItem, { backgroundColor: cardBg }]}
                    onPress={() => handleSessionPress(session)}
                  >
                    <View style={styles.historyInfo}>
                      <AppText variant='body' weight='semibold' color={theme.colors.textDark}>
                        {session.exerciseType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </AppText>
                      <AppText variant='bodySmall' color="rgba(0,0,0,0.5)">
                        {new Date(session.date).toLocaleDateString()} • {session.totalReps} Reps
                      </AppText>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                      <AppText variant='bodySmall' weight='bold' color={theme.colors.textDark}>
                        {(session as any).qualityScore || 0}%
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
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
    gap: theme.spacing.xl,
  },
  header: {
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  filterGroup: {
    gap: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.card,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateChipActive: {
    backgroundColor: theme.colors.surface,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortBtnActive: {
    backgroundColor: theme.colors.nearBlack,
    borderColor: theme.colors.primary,
  },
  historyList: {
    gap: theme.spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.card,
    gap: theme.spacing.md,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
});
