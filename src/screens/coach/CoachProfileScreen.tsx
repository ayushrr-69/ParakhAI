import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { coachService } from '@/services/coach';
import { routes } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

export function CoachProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({ athletesCount: 0, reviewsCount: 0, teamQuality: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [athletes, inbox, leaderboard] = await Promise.all([
          coachService.getMyAthletes(),
          coachService.getInbox(),
          coachService.getTeamLeaderboard('pushups', 'all', 'quality')
        ]);
        
        const avgQuality = leaderboard.length > 0 
          ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.quality, 0) / leaderboard.length)
          : 0;

        setStats({
          athletesCount: (athletes || []).length,
          reviewsCount: (inbox || []).filter(i => i.status === 'reviewed').length,
          teamQuality: avgQuality
        });
      } catch (error) {
        console.error('[CoachProfile] Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to exit Coach HQ?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
          } 
        }
      ]
    );
  };

  const initial = (profile?.username || profile?.full_name || 'C').charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

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
        {/* HEADER MOVED TO MANUAL MATCH ATHLETE PROFILE */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={theme.colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <AppText variant="title" weight="semibold">Coach Profile</AppText>
          <Pressable onPress={() => navigation.navigate(routes.coachEditProfile)} style={styles.editBtn}>
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
                  <AppText variant="tiny" weight="bold" color={theme.colors.textPrimary}>PRO MENTOR</AppText>
              </View>
            </View>
            <AppText variant="hero" weight="bold" style={{ marginTop: theme.spacing.md }}>{profile?.full_name}</AppText>
            <AppText variant="bodyLarge" color={theme.colors.placeholder} style={{ marginTop: 2 }}>@{profile?.username || 'coach'}</AppText>
          </View>

          <View style={styles.section}>
            <View style={styles.metricsGrid}>
              <MetricCard 
                title="Athletes" 
                value={stats.athletesCount} 
                unit="" 
                color={theme.colors.lavender} 
              />
              <MetricCard 
                title="Reviews" 
                value={stats.reviewsCount} 
                unit="" 
                color={theme.colors.yellow} 
              />
              <MetricCard 
                title="Team Score" 
                value={stats.teamQuality} 
                unit="%" 
                color={theme.colors.success} 
              />
            </View>
          </View>

          {/* Specialties — Enhanced Tag Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <AppText variant="title" weight="bold">Expertise Focus</AppText>
            </View>
            <View style={styles.tagContainer}>
              {profile?.specialties?.map((s: string) => (
                <View key={s} style={styles.tag}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.textPrimary}>{s}</AppText>
                </View>
              )) || <AppText variant="bodySmall" color={theme.colors.placeholder}>No specialties added.</AppText>}
            </View>
          </View>

          {/* Bio block using athlete's FeedbackBlock pattern */}
          <View style={styles.section}>
             <FeedbackBlock 
                label="PHILOSOPHY"
                content={profile?.bio || "No biography provided yet."}
                color={theme.colors.success}
             />
             <FeedbackBlock 
                label="LOCATION"
                content={profile?.location || "Global HQ"}
                color={theme.colors.lavender}
             />
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
    backgroundColor: theme.colors.primary, // Using primary for coach initial to distinguish
  },
  heroBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: theme.colors.primary,
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
