import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'AthletePerformanceReport'>;

export function AthletePerformanceReportScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .select('*')
      .eq('user_id', athleteId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [athleteId]);

  const avgQuality = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.quality_score || 0), 0) / sessions.length)
    : 0;
  
  const totalReps = sessions.reduce((acc, s) => acc + (s.total_reps || 0), 0);

  return (
    <AppShell noPaddingTop>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>CLOSE</AppText>
        </Pressable>
        <AppText variant="title" weight="bold">{athleteName}</AppText>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="heading" weight="bold" style={styles.sectionTitle}>High-Level Performance Audit</AppText>
          
          {/* Summary Grid */}
          <View style={styles.grid}>
            <View style={[styles.gridItem, { backgroundColor: theme.colors.success }]}>
              <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{avgQuality}%</AppText>
              <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>AVG QUALITY</AppText>
            </View>
            <View style={[styles.gridItem, { backgroundColor: theme.colors.yellow }]}>
              <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{sessions.length}</AppText>
              <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>SESSIONS</AppText>
            </View>
            <View style={[styles.gridItem, { backgroundColor: theme.colors.lavender }]}>
              <AppText variant="hero" weight="bold" color={theme.colors.textDark}>{totalReps}</AppText>
              <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>TOTAL REPS</AppText>
            </View>
            <Pressable 
              style={[styles.gridItem, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Chat', { coachName: 'Coach', athleteId })}
            >
              <AppText variant="hero" weight="bold" color={theme.colors.textDark}>💬</AppText>
              <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>MESSAGE</AppText>
            </Pressable>
          </View>

          <AppText variant="heading" weight="bold" style={[styles.sectionTitle, { marginTop: 32 }]}>Session Breakdown</AppText>
          
          {sessions.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={styles.sessionMain}>
                <AppText variant="bodyLarge" weight="bold" color={theme.colors.textPrimary}>
                  {s.exercise_type.toUpperCase()}
                </AppText>
                <AppText variant="tiny" color={theme.colors.placeholder}>
                  {new Date(s.created_at).toLocaleDateString()}
                </AppText>
              </View>
              <View style={styles.sessionMetrics}>
                <View style={styles.miniMetric}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>{s.total_reps}</AppText>
                  <AppText variant="tiny" color={theme.colors.placeholder}>REPS</AppText>
                </View>
                <View style={[styles.miniMetric, { marginLeft: 16 }]}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.success}>{s.quality_score}%</AppText>
                  <AppText variant="tiny" color={theme.colors.placeholder}>FORM</AppText>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 60,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 20,
    color: theme.colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sessionMain: {
    gap: 2,
  },
  sessionMetrics: {
    flexDirection: 'row',
  },
  miniMetric: {
    alignItems: 'flex-end',
  }
});
