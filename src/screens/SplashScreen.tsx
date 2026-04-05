import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppShell } from '@/components/layout/AppShell';
import { AppText } from '@/components/common/AppText';
import { routes } from '@/constants/routes';
import { splashContent } from '@/constants/content';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timeoutId = setTimeout(() => navigation.replace(routes.onboarding), 1500);
    return () => clearTimeout(timeoutId);
  }, [navigation]);

  return (
    <AppShell>
      <View style={styles.container}>
        <View style={styles.logoMark}>
          <View style={[styles.logoChip, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.logoChip, { backgroundColor: theme.colors.success }]} />
          <View style={[styles.logoChip, { backgroundColor: theme.colors.lavender }]} />
        </View>
        <AppText variant='hero' weight='semibold'>
          {splashContent.brand}
        </AppText>
        <AppText variant='bodyLarge' color={theme.colors.placeholder}>
          {splashContent.tagline}
        </AppText>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  logoMark: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  logoChip: {
    width: 18,
    height: 54,
    borderRadius: theme.radii.card,
  },
});
