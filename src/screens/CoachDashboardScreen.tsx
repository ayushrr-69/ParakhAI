import React from 'react';
import { StyleSheet, View, ImageBackground, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachDashboard'>;

export function CoachDashboardScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  return (
    <AppShell footerMode='hidden' contentStyle={{ backgroundColor: '#000' }}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.badge}>
            <AppText variant='bodySmall' weight='bold' color={theme.colors.primary}>
              COACH ACCESS GRANTED
            </AppText>
          </View>
          
          <AppText variant='hero' weight='bold' style={styles.title}>
            Coach HQ is in Training.
          </AppText>
          
          <AppText variant='bodyLarge' color={theme.colors.placeholder} style={styles.subtitle}>
            Professional scouting tools, team management, and detailed quality evaluations are currently under active development.
          </AppText>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.dot} />
              <AppText variant='bodyLarge'>Athlete Data Sync</AppText>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.dot} />
              <AppText variant='bodyLarge'>Team Performance Analytics</AppText>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.dot} />
              <AppText variant='bodyLarge'>Scouting & Form Rating</AppText>
            </View>
          </View>

          <Pressable onPress={() => signOut()} style={styles.signOutButton}>
            <AppText variant='bodyLarge' weight='semibold' color={theme.colors.placeholder}>
              Sign Out for now
            </AppText>
          </Pressable>
        </View>

        <View style={styles.glow} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  content: {
    zIndex: 2,
    gap: theme.spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: '90%',
  },
  features: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    opacity: 0.6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  signOutButton: {
    marginTop: theme.spacing.xxxl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radii.card,
  },
  glow: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.colors.primary,
    opacity: 0.08,
    zIndex: 1,
  },
});
