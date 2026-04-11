import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { historyService } from '@/services/history';
import { routes } from '@/constants/routes';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = React.useState({ lifetimeReps: 0, peakQuality: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      const history = await historyService.getHistory();
      const lifetimeReps = history.reduce((sum, s) => sum + (s.totalReps || 0), 0);
      const peakQuality = Math.max(...history.map(s => s.qualityScore || 0), 0);
      setStats({ lifetimeReps, peakQuality });
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of ParakhAI?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const displayName = profile?.full_name || 'Athlete';
  const weight = profile?.weight ? `${profile.weight} ${profile.pref_units === 'metric' ? 'kg' : 'lbs'}` : '--';
  const height = profile?.height ? `${profile.height} ${profile.pref_units === 'metric' ? 'cm' : 'in'}` : '--';
  const primaryGoal = profile?.goals && profile.goals.length > 0 ? profile.goals[0] : 'General';
  
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = (profile?.username || displayName).charAt(0).toUpperCase();

  return (
    <AppShell footerMode='sticky'>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={theme.colors.nearBlack} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <AppText variant="title" weight="semibold">Athlete Profile</AppText>
          <Pressable onPress={() => navigation.navigate(routes.profileSetup)} style={styles.editBtn}>
            <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>EDIT</AppText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarInitial]}>
                <AppText variant="hero" weight="bold" color={theme.colors.textPrimary}>{initial}</AppText>
              </View>
            )}
            <AppText variant="hero" weight="bold" style={{ marginTop: theme.spacing.md }}>{displayName}</AppText>
            <AppText variant="bodyLarge" color={theme.colors.placeholder} style={{ marginTop: 2 }}>{profile?.username || ''}</AppText>
            <View style={styles.badge}>
              <AppText variant="bodySmall" weight="bold" color={theme.colors.surface}>PRO ACCOUNT</AppText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>WEIGHT</AppText>
              <AppText variant="title" weight="bold">{weight}</AppText>
            </View>
            <View style={styles.statItem}>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>HEIGHT</AppText>
              <AppText variant="title" weight="bold">{height}</AppText>
            </View>
            <View style={styles.statItem}>
              <AppText variant="bodySmall" color={theme.colors.placeholder}>FOCUS</AppText>
              <AppText variant="title" weight="bold" numberOfLines={1}>{primaryGoal}</AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="title" weight="semibold">Hall of Fame</AppText>
            <View style={styles.achievementCard}>
              <View style={styles.achievementRow}>
                <AppText variant="bodyLarge">Lifetime Reps</AppText>
                <AppText variant="bodyLarge" weight="bold">{stats.lifetimeReps}</AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.achievementRow}>
                <AppText variant="bodyLarge">Peak Quality Score</AppText>
                <AppText variant="bodyLarge" weight="bold" color={theme.colors.success}>{stats.peakQuality}%</AppText>
              </View>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <AppText variant="bodyLarge" weight="semibold" color={theme.colors.error}>Sign Out</AppText>
          </Pressable>
        </ScrollView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.layout.navHeight + theme.spacing.xxxl,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.lavender,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.cardDark,
    padding: theme.spacing.md,
    borderRadius: theme.radii.card,
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  achievementCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoutButton: {
    marginTop: theme.spacing.xxxl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
    borderRadius: theme.radii.card,
  },
});
