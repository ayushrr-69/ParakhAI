import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { CalendarStrip } from '@/components/home/CalendarStrip';
import { TestActionCard } from '@/components/home/TestActionCard';
import { BottomNav } from '@/components/navigation/BottomNav';
import { DeviceStatusBar } from '@/components/system/DeviceStatusBar';
import { homeTestActions } from '@/constants/content';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  
  const handleTestActionPress = (actionKey: string) => {
    switch (actionKey) {
      case 'video-analysis':
        navigation.navigate('RecordingInstructions' as never);
        break;
      case 'repeat':
        // Handle repeat last test
        break;
      case 'history':
        // Navigate to test history
        break;
      default:
        console.log('Unknown action:', actionKey);
    }
  };
  return (
    <AppShell scrollable header={<DeviceStatusBar />} footer={<BottomNav />}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant='bodyLarge' color={theme.colors.placeholder}>Welcome back</AppText>
            <AppText variant='heading' weight='semibold'>Digvijay</AppText>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.avatar} />
            <Pressable style={styles.bellButton}>
              <Svg width={20} height={20} viewBox='0 0 22 22' fill='none'>
                <Path d='M11 4.5a4 4 0 0 0-4 4v2.2c0 .7-.2 1.4-.6 2l-1.2 1.8h11.6l-1.2-1.8a3.6 3.6 0 0 1-.6-2V8.5a4 4 0 0 0-4-4Z' stroke={theme.colors.surface} strokeWidth={1.7} />
                <Path d='M9 17a2.4 2.4 0 0 0 4 0' stroke={theme.colors.surface} strokeWidth={1.7} strokeLinecap='round' />
                <Circle cx={16.5} cy={5.5} r={2.5} fill={theme.colors.primary} />
              </Svg>
            </Pressable>
          </View>
        </View>

        <CalendarStrip />

        <View style={styles.sectionHeader}>
          <AppText variant='heading' weight='semibold'>Tests</AppText>
        </View>

        <View style={styles.testsContainer}>
          <View style={styles.testGrid}>
            {homeTestActions.map((item, index) => (
              <Pressable 
                key={item.key} 
                style={index === homeTestActions.length - 1 ? styles.fullWidthCard : styles.halfWidthCard}
                onPress={() => handleTestActionPress(item.key)}
              >
                <TestActionCard title={item.title} backgroundColor={item.backgroundColor} />
              </Pressable>
            ))}
          </View>
        </View>
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
  sectionHeader: {
    marginTop: theme.spacing.xs,
  },
  testsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.md,
  },
  testGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  halfWidthCard: {
    width: '47.5%',
  },
  fullWidthCard: {
    width: '100%',
  },
});
