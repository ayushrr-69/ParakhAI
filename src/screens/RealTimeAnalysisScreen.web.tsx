import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppShell } from '@/components/layout/AppShell';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RealTimeAnalysis'>;

export function RealTimeAnalysisScreen({ route }: Props) {
  const { exerciseType } = route.params;

  return (
    <AppShell>
      <View style={styles.container}>
        <View style={styles.card}>
          <AppText variant='heading' weight='semibold'>
            Real-time analysis preview
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.placeholder} style={styles.text}>
            Live camera analysis is available on native devices. The web build keeps this screen visible so you can inspect the UI.
          </AppText>
          <AppText variant='title' weight='semibold' color={theme.colors.success}>
            {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ')}
          </AppText>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  text: {
    maxWidth: 320,
  },
});
