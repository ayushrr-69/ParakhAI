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

export function SplashScreen() {

  return (
    <AppShell>
      <View style={styles.container}>
        <View style={styles.logoMark}>
          <View style={[styles.logoChip, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.logoChip, { backgroundColor: theme.colors.success }]} />
          <View style={[styles.logoChip, { backgroundColor: theme.colors.lavender }]} />
        </View>
        <View style={styles.copyBlock}>
          <AppText variant='hero' weight='semibold'>
            {splashContent.brand}
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.placeholder} style={styles.tagline}>
            {splashContent.tagline}
          </AppText>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  logoMark: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  logoChip: {
    width: 18,
    height: 54,
    borderRadius: theme.radii.card,
  },
  copyBlock: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
