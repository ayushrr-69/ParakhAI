import React from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { ActionBlockGrid } from '@/components/home/ActionBlockGrid';
import { homeTestActions } from '@/constants/content';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'Training'>;

export function TrainingScreen({ navigation }: Props) {
  return (
    <AppShell scrollable hasTabBar={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant='heading' weight='semibold'>Training Hub</AppText>
          <AppText variant='bodySmall' color={theme.colors.placeholder}>Master your movements with AI-powered insights</AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant='title' weight='semibold'>Test Live</AppText>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <AppText variant="bodySmall" weight="bold" color={theme.colors.error}>REC & PROCESS</AppText>
            </View>
          </View>
          <View style={styles.gridContainer}>
            <ActionBlockGrid
              items={homeTestActions}
              onPress={(exerciseKey) => navigation.navigate(routes.recordAndUpload, { exerciseType: exerciseKey as any })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant='title' weight='semibold'>Video Library</AppText>
            <AppText variant='bodySmall' color={theme.colors.primary}>UPLOAD</AppText>
          </View>
          <View style={styles.gridContainer}>
            <ActionBlockGrid
              items={homeTestActions}
              onPress={(exerciseKey) => navigation.navigate(routes.videoUpload, { exerciseType: exerciseKey as any })}
            />
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
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  gridContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.md,
  },
});
