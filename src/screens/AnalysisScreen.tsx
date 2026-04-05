import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { AppShell } from '@/components/layout/AppShell';
import { BottomNav } from '@/components/navigation/BottomNav';
import { DeviceStatusBar } from '@/components/system/DeviceStatusBar';
import { analysisCopy, analysisTabs, subroutineBreakdown } from '@/constants/content';
import { theme } from '@/theme';
import { AnalysisRange } from '@/types/app';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Analysis'>;

export function AnalysisScreen(_: Props) {
  const [activeTab, setActiveTab] = useState<AnalysisRange>('weekly');

  return (
    <AppShell scrollable header={<DeviceStatusBar />} footer={<BottomNav />} footerMode='sticky'>
      <View style={styles.container}>
        <AppText variant='heading' weight='semibold'>Performance Analysis</AppText>

        <View style={[styles.heroCard, { backgroundColor: theme.colors.success }]}>
          <AppText variant='title' weight='semibold'>Your Performance Analysis</AppText>
          <AppText variant='bodyLarge'>Track trends. Spot patterns. Crush your goals. Be better.</AppText>
        </View>

        <View style={styles.tabBar}>
          {analysisTabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabPill, active && styles.activeTab]}>
                <AppText variant='body' weight='semibold' color={active ? theme.colors.textDark : theme.colors.nearBlack}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.lavender }]}>
          <AppText variant='title' weight='semibold' color={theme.colors.nearBlack}>Performance Trends</AppText>
          <PerformanceChart type={activeTab} />
        </View>

        <View style={[styles.analysisCard, { backgroundColor: theme.colors.success }]}>
          <AppText variant='title' weight='semibold'>AI Analysis</AppText>
          <AppText variant='bodyLarge'>{analysisCopy[activeTab]}</AppText>
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

        <Pressable style={styles.scrollTopButton} onPress={() => setActiveTab('weekly')}>
          <Svg width={18} height={18} viewBox='0 0 18 18' fill='none'>
            <Path d='M9 3 3.5 8.5M9 3l5.5 5.5M9 3v12' stroke={theme.colors.nearBlack} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
          </Svg>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
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
  scrollTopButton: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
