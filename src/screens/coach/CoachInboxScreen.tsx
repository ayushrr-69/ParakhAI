import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Pressable, ScrollView,
  ActivityIndicator, RefreshControl, Modal, Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { coachService, Submission, Enrollment } from '@/services/coach';
import { routes } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { supabase } from '@/lib/supabase';

// Submission cards cycle through these colors
const SUBMISSION_COLORS = [theme.colors.lavender, theme.colors.success, theme.colors.yellow];

import { useToast } from '@/contexts/ToastContext';

export function CoachInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [inbox, setInbox] = useState<Submission[]>([]);
  const [requests, setRequests] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspectedAthlete, setInspectedAthlete] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(refreshing ? false : true);
    try {
      const [submissions, enrollmentRequests] = await Promise.all([
        coachService.getInbox(),
        coachService.getEnrollmentRequests(),
      ]);
      setInbox(submissions);
      setRequests(enrollmentRequests);
    } catch (error) {
      console.error('[CoachInbox] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEnrollment = async (enrollmentId: string, status: 'accepted' | 'rejected') => {
    const success = await coachService.updateEnrollmentStatus(enrollmentId, status);
    if (success) {
      showToast({
        title: status === 'accepted' ? 'Athlete Accepted' : 'Request Declined',
        message: status === 'accepted'
          ? 'The athlete now appears in your team list.'
          : 'The request has been removed.',
        type: status === 'accepted' ? 'success' : 'info'
      });
      loadData();
    } else {
      showToast({
        title: 'Error',
        message: 'Failed to update enrollment status.',
        type: 'error'
      });
    }
  };

  useEffect(() => { 
    loadData(); 

    // Real-time synchronization
    // 1. Listen for new submissions or status changes
    const submissionChannel = supabase.channel('coach-inbox-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_submissions',
          filter: `coach_id=eq.${profile?.id}`
        },
        () => {
          console.log('[CoachInbox] Real-time submission update detected');
          loadData();
        }
      )
      .subscribe();

    // 2. Listen for new enrollment requests
    const enrollmentChannel = supabase.channel('coach-inbox-enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_enrollments',
          filter: `coach_id=eq.${profile?.id}`
        },
        () => {
          console.log('[CoachInbox] Real-time enrollment update detected');
          loadData();
        }
      )
      .subscribe();

    return () => {
      submissionChannel.unsubscribe();
      enrollmentChannel.unsubscribe();
    };
  }, [profile?.id]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const totalItems = requests.length + inbox.length;

  return (
    <AppShell footerMode="hidden">
      <CoachHeader title="Inbox Hub" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : totalItems === 0 ? (
          /* ── Universal empty state ── */
          <View style={styles.emptyState}>
            <AppText variant="bodyLarge" weight="bold" color={theme.colors.placeholder}>All Caught Up</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center', marginTop: 4 }}>
              No pending requests or submissions right now.
            </AppText>
          </View>
        ) : (
          <>
            {/* ── ENROLLMENT REQUESTS ── */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.sectionLabel}>
                  NEW ATHLETE REQUESTS · {requests.length}
                </AppText>

                {requests.map((request) => (
                  <View key={request.id} style={[styles.requestCard, { backgroundColor: theme.colors.accentOrange }]}>
                    {/* Athlete row — tappable to view full profile */}
                    <Pressable style={styles.requestTop} onPress={() => setInspectedAthlete(request.athlete)}>
                      <View style={styles.reqAvatar}>
                        <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                          {request.athlete?.full_name?.charAt(0) ?? '?'}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                          {request.athlete?.full_name ?? 'Athlete'}
                        </AppText>
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.6 }}>
                          @{request.athlete?.username} · Tap to view profile
                        </AppText>
                      </View>
                      <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.5 }}>
                        {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </AppText>
                    </Pressable>

                    {/* Intro message */}
                    <View style={styles.messageBox}>
                      <AppText variant="bodySmall" color={theme.colors.textDark} style={{ fontStyle: 'italic' }}>
                        "{request.message}"
                      </AppText>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={() => handleEnrollment(request.id, 'rejected')}
                      >
                        <AppText variant="bodySmall" weight="bold" color={theme.colors.textPrimary}>DECLINE</AppText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleEnrollment(request.id, 'accepted')}
                      >
                        <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>ACCEPT</AppText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── SUBMISSION INBOX ── */}
            {inbox.length > 0 && (
              <View style={styles.section}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.sectionLabel}>
                  SUBMISSION INBOX · {inbox.length}
                </AppText>

                {inbox.map((item, index) => {
                  const cardBg = SUBMISSION_COLORS[index % SUBMISSION_COLORS.length];
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.submissionCard, { backgroundColor: cardBg }]}
                      onPress={() => navigation.navigate(routes.coachReview, {
                        submissionId: item.id,
                        athleteName: item.athlete?.full_name || 'Athlete',
                        sessionData: item.session,
                      })}
                    >
                      <View style={styles.submissionTop}>
                        <View style={[styles.statusPill, { backgroundColor: item.status === 'pending' ? theme.colors.primary : 'rgba(0,0,0,0.15)' }]}>
                          <AppText variant="tiny" weight="bold" color={item.status === 'pending' ? theme.colors.textDark : theme.colors.nearBlack}>
                            {item.status.toUpperCase()}
                          </AppText>
                        </View>
                        {item.session?.video_url && (
                          <View style={[styles.statusPill, { backgroundColor: 'rgba(0,0,0,0.1)', marginLeft: 8 }]}>
                            <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>VIDEO</AppText>
                          </View>
                        )}
                        <View style={{ flex: 1 }} />
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ opacity: 0.55 }}>
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </AppText>
                      </View>

                      <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                        {item.athlete?.full_name}
                      </AppText>

                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionPill}>
                          <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>
                            {item.session?.exercise_type?.replace('_', ' ').toUpperCase() ?? 'EXERCISE'}
                          </AppText>
                        </View>
                        <AppText variant="bodySmall" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>
                          {item.session?.total_reps ?? '—'} reps · {item.session?.quality_score ?? '--'}% Quality
                        </AppText>
                      </View>

                      <View style={styles.reviewCta}>
                        <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>
                          {item.status === 'pending' ? 'TAP TO REVIEW →' : 'VIEW FEEDBACK →'}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── ATHLETE PROFILE INSPECT MODAL ── */}
      <Modal
        visible={!!inspectedAthlete}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspectedAthlete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Colored hero */}
            <View style={[styles.modalHero, { backgroundColor: theme.colors.accentOrange }]}>
              <Pressable onPress={() => setInspectedAthlete(null)} style={styles.closeBtn}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={theme.colors.nearBlack} strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </Pressable>
              <View style={styles.heroAvatar}>
                <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                  {inspectedAthlete?.full_name?.charAt(0)}
                </AppText>
              </View>
              <AppText variant="hero" weight="bold" color={theme.colors.textDark} style={{ marginTop: 12 }}>
                {inspectedAthlete?.full_name}
              </AppText>
              <AppText variant="body" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>
                @{inspectedAthlete?.username}
              </AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Vital stats */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.yellow }]}>
                <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>VITAL STATS</AppText>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                      {inspectedAthlete?.weight ?? '—'}
                    </AppText>
                    <AppText variant="tiny" color={theme.colors.nearBlack}>
                      {inspectedAthlete?.pref_units === 'metric' ? 'KG' : 'LBS'}
                    </AppText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                      {inspectedAthlete?.height ?? '—'}
                    </AppText>
                    <AppText variant="tiny" color={theme.colors.nearBlack}>
                      {inspectedAthlete?.pref_units === 'metric' ? 'CM' : 'IN'}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Goals */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.lavender }]}>
                <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>SPORTS & GOALS</AppText>
                <View style={styles.chipRow}>
                  {(inspectedAthlete?.goals?.length > 0 ? inspectedAthlete.goals : ['None listed']).map((s: string) => (
                    <View key={s} style={styles.chip}>
                      <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>{s.toUpperCase()}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bio */}
              {inspectedAthlete?.bio && (
                <View style={[styles.infoCard, { backgroundColor: theme.colors.success }]}>
                  <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>BIO</AppText>
                  <AppText variant="body" color={theme.colors.textDark}>{inspectedAthlete.bio}</AppText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  sectionLabel: {
    letterSpacing: 2,
    opacity: 0.6,
    marginBottom: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  emptyState: {
    marginTop: 60,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.radii.largeCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  // Enrollment request card
  requestCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  reqAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBox: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    padding: theme.spacing.md,
    borderRadius: theme.radii.card,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
  },
  declineBtn: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  // Submission card
  submissionCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  submissionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  sessionPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  reviewCta: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '88%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  modalHero: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
    gap: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: 60,
  },
  infoCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoLabel: {
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
