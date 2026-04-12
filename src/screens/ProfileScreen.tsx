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

  const MetricCard = ({ title, value, unit, color }: { title: string, value: number | string, unit: string, color: string }) => (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
        <AppText variant="bodySmall" weight="semibold" color={theme.colors.textDark}>{title}</AppText>
        <View style={styles.metricValueContainer}>
           <AppText variant="title" weight="bold" color={theme.colors.nearBlack}>{value}</AppText>
           <AppText variant="bodySmall" weight="semibold" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>{unit}</AppText>
        </View>
    </View>
  );

  const FeedbackBlock = ({ label, content, color, icon }: { label: string, content: string, color: string, icon?: React.ReactNode }) => (
    <View style={styles.feedbackBlock}>
      <View style={styles.feedbackHeader}>
          <View style={[styles.feedbackDot, { backgroundColor: color }]} />
          <AppText variant="bodySmall" weight="bold" color={color}>{label}</AppText>
      </View>
      <View style={styles.feedbackContentRow}>
        <AppText variant="body" weight="semibold">{content}</AppText>
        {icon}
      </View>
    </View>
  );

  return (
    <AppShell footerMode='sticky'>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={theme.colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <AppText variant="title" weight="semibold">Athlete Profile</AppText>
          <Pressable onPress={() => navigation.navigate(routes.profileSetup, { mode: 'edit' })} style={styles.editBtn}>
            <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>EDIT</AppText>
          </Pressable>
        </View>
 
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={styles.heroContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarLarge, styles.avatarInitial]}>
                  <AppText variant="hero" weight="bold" color={theme.colors.textPrimary}>{initial}</AppText>
                </View>
              )}
              <View style={styles.heroBadge}>
                  <AppText variant="tiny" weight="bold" color={theme.colors.success}>PRO ACCOUNT</AppText>
              </View>
            </View>
            <AppText variant="hero" weight="bold" style={{ marginTop: theme.spacing.md }}>{displayName}</AppText>
            <AppText variant="bodyLarge" color={theme.colors.placeholder} style={{ marginTop: 2 }}>@{profile?.username || 'athlete'}</AppText>
          </View>
 
          <View style={styles.section}>
            <View style={styles.metricsGrid}>
               <MetricCard 
                title="Weight" 
                value={profile?.weight || '--'} 
                unit={profile?.pref_units === 'metric' ? 'KG' : 'LBS'} 
                color={theme.colors.lavender} 
              />
               <MetricCard 
                title="Height" 
                value={profile?.height || '--'} 
                unit={profile?.pref_units === 'metric' ? 'CM' : 'IN'} 
                color={theme.colors.yellow} 
              />
               <MetricCard 
                title="Focus" 
                value={primaryGoal} 
                unit="" 
                color={theme.colors.success} 
              />
            </View>
          </View>
 
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <AppText variant="title" weight="bold">Hall of Fame</AppText>
            </View>
            <View style={styles.feedbackSection}>
               <FeedbackBlock 
                  label="LIFETIME EFFORT"
                  content={`${stats.lifetimeReps} Total Repetitions`}
                  color={theme.colors.lavender}
               />
               <FeedbackBlock 
                  label="PEAK PERFORMANCE"
                  content={`${stats.peakQuality}% Quality Grade`}
                  color={theme.colors.success}
               />
            </View>
          </View>
 
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark}>Sign Out</AppText>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.layout.navHeight + theme.spacing.xxxl,
  },
  heroSection: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.lavender,
  },
  heroBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
  },
  section: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionTitleRow: {
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    height: 100,
    justifyContent: 'space-between',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  feedbackSection: {
    gap: theme.spacing.md,
  },
  feedbackBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedbackContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutButton: {
    marginTop: theme.spacing.xxxl,
    height: 62,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
