import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Image, Platform, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Svg, { Path, Circle } from 'react-native-svg';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { routes } from '@/constants/routes';
import { historyService } from '@/services/history';
import { coachService, Feedback } from '@/services/coach';
import { supabase } from '@/lib/supabase';

export function AthleteCoachScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const {
    history,
    reviewHistory,
    notifications,
    enrollmentHistory,
    coachProfile,
    enrollment,
    isLatestSessionShared: shared,
    loading,
    refreshing,
    refreshAll,
    ensureDataLoaded
  } = useData();

  const coachName = coachProfile?.full_name || 'Assigned Coach';

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState<any>(null);

  // Sync selected coach when coachProfile loads
  useEffect(() => {
    if (coachProfile && !selectedCoachForModal) {
      setSelectedCoachForModal(coachProfile);
    }
  }, [coachProfile]);

  useFocusEffect(
    useCallback(() => {
      ensureDataLoaded();
    }, [ensureDataLoaded])
  );

  useEffect(() => {
    if (!profile?.id) return;

    const activityChannel = supabase.channel(`athlete-activity-${profile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_feedback',
          filter: `athlete_id=eq.${profile.id}`
        },
        () => {
          refreshAll();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_enrollments',
          filter: `athlete_id=eq.${profile.id}`
        },
        () => {
          refreshAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, [profile?.id, refreshAll]);

  const handleShare = async () => {
    if (!profile?.coach_id) {
      Alert.alert("No Coach", "You haven't been assigned a coach yet.");
      return;
    }
    try {
      if (history.length === 0) {
        Alert.alert("No Data", "Perform a training session first to share results!");
        return;
      }
      const latestSession = history[0];
      const success = await coachService.createSubmission(latestSession.id, profile.coach_id);
      if (success) {
        refreshAll(); // Update sharing status globally
        Alert.alert("Success!", "Your latest session has been sent to " + coachName);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to share progress.");
    }
  };

  const handleReviewPress = (item: any) => {
    const sessionData = item.session;
    if (!sessionData) return;
    const fb = item.coach_feedback?.[0];
    const session = {
      id: sessionData.id,
      date: sessionData.created_at,
      exerciseType: sessionData.exercise_type,
      totalReps: sessionData.total_reps,
      goodReps: sessionData.good_reps,
      consistency: sessionData.consistency_score,
      qualityScore: sessionData.quality_score,
      avgPower: sessionData.avg_power,
      avgSpeed: sessionData.avg_speed,
      insights: sessionData.insights
    };
    navigation.navigate(routes.analysisResults, {
      session,
      exerciseType: sessionData.exercise_type,
      coachFeedback: fb?.content,
      coachName: coachProfile?.full_name || 'Coach'
    });
  };

  const MetricCard = ({ title, value, unit, color }: { title: string, value: number | string, unit: string, color: string }) => (
    <View style={styles.metricCard}>
        <View style={styles.metricLabel}>
          <View style={[styles.metricDot, { backgroundColor: color }]} />
          <AppText variant="tiny" weight="bold" color={theme.colors.placeholder}>{title}</AppText>
        </View>
        <View style={styles.metricValueContainer}>
           <AppText variant="title" weight="bold" color={theme.colors.textPrimary}>{value}</AppText>
           <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={{ opacity: 0.7 }}>{unit}</AppText>
        </View>
    </View>
  );

  const FeedbackBlock = ({ label, content, color, date, rating, onPress }: { label: string, content: string, color: string, date: string, rating: number, onPress: () => void }) => (
    <Pressable style={[styles.feedbackBlock, { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.feedbackHeader}>
          <View style={styles.feedbackLabelRow}>
            <View style={[styles.feedbackDot, { backgroundColor: theme.colors.textDark, opacity: 0.2 }]} />
            <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>{label}</AppText>
          </View>
          <AppText variant="tiny" weight="bold" color={theme.colors.textDark} style={{ opacity: 0.6 }}>{new Date(date).toLocaleDateString()}</AppText>
      </View>
      <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark} style={{ marginVertical: 12 }}>"{content}"</AppText>
      <View style={styles.feedbackFooter}>
        <View style={styles.feedbackRatingCol}>
          <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>RATING</AppText>
          <AppText variant="tiny" color={theme.colors.textDark} weight="bold">
            {"★".repeat(rating)}{"☆".repeat(5-rating)}
          </AppText>
        </View>
        <View style={[styles.viewAnalysisBtn, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
           <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>VIEW ANALYSIS →</AppText>
        </View>
      </View>
    </Pressable>
  );

  if (loading && !refreshing) {
    return (
      <AppShell>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell 
        scrollable 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={refreshAll} 
            tintColor={theme.colors.primary} 
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <AppText variant="heading" weight="semibold">Coach Connect</AppText>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>Your performance mentor</AppText>
              </View>
              <View style={styles.headerActions}>
                <Pressable style={styles.historyBtn} onPress={() => setShowHistoryModal(true)}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke={theme.colors.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </View>

          {enrollment && (!profile?.coach_id || enrollment.status === 'pending' || enrollment.status === 'rejected') && (
            <View style={[styles.statusBanner, enrollment.status === 'pending' ? styles.pendingBanner : styles.rejectedBanner]}>
              <View style={styles.bannerHeader}>
                <View style={[styles.bannerDot, { backgroundColor: theme.colors.textDark }]} />
                <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>
                  {enrollment.status === 'pending' ? "PENDING APPROVAL" : "REQUEST DECLINED"}
                </AppText>
              </View>
              <AppText variant="body" weight="bold" color={theme.colors.textDark} style={{ marginTop: 4 }}>
                {enrollment.status === 'pending' 
                  ? `Waiting for ${coachProfile?.full_name || 'Coach'}` 
                  : "Choose a new mentor in settings"
                }
              </AppText>
            </View>
          )}

          {coachProfile && (
            <View style={styles.heroSection}>
              <Pressable style={styles.heroAvatarContainer} onPress={() => setShowProfileModal(true)}>
                {coachProfile.avatar_url ? (
                  <Image source={{ uri: coachProfile.avatar_url }} style={styles.heroAvatar} />
                ) : (
                  <View style={styles.heroAvatarPlaceholder}>
                    <AppText variant="hero" weight="bold" color={theme.colors.primary}>{coachProfile.full_name?.charAt(0)}</AppText>
                  </View>
                )}
                {profile?.coach_id && <View style={styles.heroStatusDot} />}
              </Pressable>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <AppText variant="tiny" weight="bold" color={theme.colors.lavender}>ELITE MENTOR</AppText>
                </View>
                <AppText variant="hero" weight="bold" color={theme.colors.textPrimary}>{coachProfile.full_name}</AppText>
                <View style={styles.heroRatingRow}>
                   <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>★ 4.9</AppText>
                   <View style={styles.dotSeparator} />
                   <AppText variant="bodySmall" color={theme.colors.placeholder}>124 REVIEWS</AppText>
                </View>
              </View>
              <View style={styles.heroActions}>
                <Pressable 
                  style={[styles.heroMainBtn, !profile?.coach_id && styles.actionBtnDisabled]}
                  onPress={() => profile?.coach_id && navigation.navigate(routes.chat, { targetName: coachProfile.full_name, targetId: profile.coach_id })}
                  disabled={!profile?.coach_id}
                >
                  <AppText variant="body" weight="bold" color={theme.colors.textDark}>MESSAGE COACH</AppText>
                </Pressable>
                <Pressable style={styles.heroSecondaryBtn} onPress={() => setShowProfileModal(true)}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>VIEW COACH PROFILE</AppText>
                </Pressable>
              </View>
            </View>
          )}

          {!profile?.coach_id && !enrollment && (
            <View style={styles.lockedState}>
              <AppText variant="title" weight="bold" color={theme.colors.textPrimary}>No Active Coach</AppText>
              <AppText variant="body" color={theme.colors.placeholder} style={{ textAlign: 'center', marginTop: 8 }}>Find a mentor to get personalized feedback.</AppText>
              <Pressable style={styles.reapplyBtn} onPress={() => navigation.navigate(routes.coachList)}>
                <AppText variant="body" weight="bold" color={theme.colors.primary}>FIND A MENTOR</AppText>
              </Pressable>
            </View>
          )}

          {profile?.coach_id && (
            <>
              <View style={styles.section}>
                <AppText variant="title" weight="bold" style={styles.sectionTitle}>Performance Metrics</AppText>
                <View style={styles.metricsGrid}>
                  <MetricCard title="AVG QUALITY" value={reviewHistory.length > 0 ? Math.round(reviewHistory.reduce((acc, r) => acc + (r.session?.quality_score || 0), 0) / reviewHistory.length) : 0} unit="%" color={theme.colors.primary} />
                  <MetricCard title="TOTAL REVIEWS" value={reviewHistory.length} unit="Sessions" color={theme.colors.lavender} />
                </View>
              </View>

              <View style={styles.section}>
                <AppText variant="title" weight="bold" style={styles.sectionTitle}>Recent Reviews</AppText>
                <View style={styles.reviewsList}>
                  {reviewHistory.map((item, index) => {
                    const bgColors = [theme.colors.lavender, theme.colors.yellow, theme.colors.success, theme.colors.primary];
                    const cardBg = bgColors[index % bgColors.length];
                    const fb = item.coach_feedback?.[0];
                    return (
                      <FeedbackBlock
                        key={item.id}
                        label={item.session?.exercise_type?.toUpperCase().replace('_', ' ') || 'WORKOUT'}
                        content={fb?.content || "No message provided."}
                        color={cardBg}
                        date={item.created_at}
                        rating={fb?.rating || 5}
                        onPress={() => handleReviewPress(item)}
                      />
                    );
                  })}
                  {reviewHistory.length === 0 && (
                    <View style={styles.emptyReviews}>
                      <AppText color={theme.colors.placeholder}>Share a session to get your first review!</AppText>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.shareCard, { backgroundColor: theme.colors.success }]}>
                <View style={styles.shareInfo}>
                  <AppText variant="title" weight="bold" color={theme.colors.textDark}>Share Progress</AppText>
                  <AppText variant="body" weight="medium" color={theme.colors.textDark} style={{ opacity: 0.7 }}>Ready to get analyzed? Send your latest training data to your coach for professional feedback.</AppText>
                </View>
                <Pressable 
                  onPress={handleShare}
                  style={[styles.shareBtn, shared && styles.shareBtnDisabled, { backgroundColor: shared ? 'rgba(0,0,0,0.1)' : theme.colors.textDark }]}
                  disabled={shared}
                >
                  <AppText variant="body" weight="bold" color={shared ? theme.colors.textDark : theme.colors.textPrimary}>
                    {shared ? "LATEST SESSION SHARED" : "SHARE PROGRESS"}
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </AppShell>

      {/* COACH PROFILE MODAL */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="title" weight="bold">Coach Profile</AppText>
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowProfileModal(false)}>
                <AppText weight="bold" color={theme.colors.placeholder}>✕</AppText>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalHero}>
                {selectedCoachForModal?.avatar_url ? (
                  <Image source={{ uri: selectedCoachForModal.avatar_url }} style={styles.modalPfp} />
                ) : (
                  <View style={styles.modalPfpPlaceholder}>
                    <AppText variant="hero" weight="bold" color={theme.colors.primary}>
                      {selectedCoachForModal?.full_name?.charAt(0)}
                    </AppText>
                  </View>
                )}
                <AppText variant="hero" weight="bold" style={{ marginTop: 16 }}>{selectedCoachForModal?.full_name}</AppText>
                <AppText variant="body" color={theme.colors.placeholder}>{selectedCoachForModal?.expertise_level || 'Elite Mentor'}</AppText>
              </View>

              <View style={styles.modalBody}>
                <View style={[styles.section, { width: '100%' }]}>
                  <AppText variant="title" weight="bold" style={styles.sectionTitle}>About</AppText>
                  <AppText variant="body" color={theme.colors.placeholder}>{selectedCoachForModal?.bio || "No biography available."}</AppText>
                </View>

                {selectedCoachForModal?.specialties && selectedCoachForModal.specialties.length > 0 && (
                  <View style={[styles.section, { width: '100%' }]}>
                    <AppText variant="title" weight="bold" style={styles.sectionTitle}>Specialties</AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {selectedCoachForModal.specialties.map((s: string) => (
                        <View key={s} style={{ backgroundColor: 'rgba(255,111,67,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                          <AppText variant="tiny" color={theme.colors.primary} weight="bold">{s.toUpperCase()}</AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true} onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowHistoryModal(false)} style={styles.modalCloseBtn}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={theme.colors.surface} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Pressable>
              <AppText variant="title" weight="bold" color={theme.colors.surface}>Message History</AppText>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.historyContainer}>
              <ScrollView>
                {enrollmentHistory.map((item) => {
                  const coach = item.coach;
                  return (
                    <Pressable 
                      key={item.id} 
                      style={styles.historyItem}
                      onPress={() => {
                        setSelectedCoachForModal(coach);
                        setShowProfileModal(true);
                        setShowHistoryModal(false);
                      }}
                    >
                      <View style={styles.historyAvatarSmall}>
                        {coach?.avatar_url ? (
                          <Image source={{ uri: coach.avatar_url }} style={styles.historyAvatarSmall} />
                        ) : (
                          <AppText color={theme.colors.primary} weight="bold">{coach?.full_name?.charAt(0)}</AppText>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" weight="bold">{coach?.full_name}</AppText>
                        <AppText variant="tiny" color={theme.colors.placeholder}>
                          Joined {new Date(item.created_at).toLocaleDateString()}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}

                {enrollmentHistory.length === 0 && (
                  <View style={styles.emptyHistory}>
                    <AppText color={theme.colors.placeholder}>No history found.</AppText>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: theme.spacing.sm,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusBanner: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  pendingBanner: {
    backgroundColor: theme.colors.yellow,
  },
  rejectedBanner: {
    backgroundColor: theme.colors.error,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 32,
    marginBottom: 32,
  },
  heroAvatarContainer: {
    position: 'relative',
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  heroAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  heroStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  heroContent: {
    alignItems: 'center',
    gap: 4,
  },
  heroBadge: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroName: {
    color: theme.colors.textPrimary,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroActions: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  heroMainBtn: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondaryBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedState: {
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 32,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reapplyBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: theme.colors.surface,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    height: 90,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  reviewsList: {
    gap: 16,
  },
  feedbackBlock: {
    borderRadius: 28,
    padding: 24,
    gap: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedbackLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  feedbackRatingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAnalysisBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 8,
  },
  emptyReviews: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
  },
  shareCard: {
    borderRadius: 32,
    padding: 28,
    gap: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  shareInfo: {
    gap: 8,
  },
  shareBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  shareBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    height: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalHero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalPfp: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  modalPfpPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  modalBody: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  historyContainer: {
    padding: 20,
    gap: 12,
  },
  historyItem: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
