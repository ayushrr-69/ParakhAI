import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, Pressable, ScrollView, Modal, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { coachService } from '@/services/coach';
import Svg, { Circle, Path } from 'react-native-svg';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResults'>;

import { useToast } from '@/contexts/ToastContext';

export function AnalysisResultsScreen({ route, navigation }: Props) {
  const { results, session, exerciseType, coachFeedback, coachName } = route.params;
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [isSharing, setIsSharing] = React.useState(false);
  const [hasShared, setHasShared] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(!!results && !coachFeedback); // Show if fresh result and not viewing history with feedback

  const videoUrl = session?.video_url;
  const player = useVideoPlayer(videoUrl || '', (player) => {
    if (videoUrl) {
      player.loop = true;
      player.play();
    }
  });

  const sessionId = session?.id;
  const coachId = profile?.coach_id;
  const canShare = !!sessionId && !!coachId && !hasShared;
  
  // Normalize Data: Prefer fresh results, fallback to historical session
  const displayData = {
    totalReps: results?.analysis?.summary?.total_reps ?? session?.totalReps ?? 0,
    goodReps: results?.analysis?.summary?.good_reps ?? session?.goodReps ?? 0,
    badReps: results?.analysis?.summary?.bad_reps ?? (session ? (session.totalReps - session.goodReps) : 0),
    consistency: results?.analysis?.metadata?.consistency_score ?? session?.consistency ?? 0,
    qualityScore: results?.analysis?.metadata?.quality_score ?? session?.qualityScore ?? 75,
    duration: results?.analysis?.metadata?.duration_processed ?? 0,
    date: session?.date ?? new Date().toISOString()
  };

  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');

  const handleShareWithCoach = async () => {
    if (!sessionId || !coachId) return;

    try {
      setIsSharing(true);
      const success = await coachService.createSubmission(sessionId, coachId);
      
      if (success) {
        setHasShared(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast({
          title: 'Shared!',
          message: 'Your session has been sent to your coach for review.',
          type: 'success'
        });
      } else {
        throw new Error('Failed to share session');
      }
    } catch (err: any) {
      showToast({
        title: 'Sharing Failed',
        message: err.message || 'Could not send to coach',
        type: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const MetricCard = ({ title, value, unit, color }: { title: string, value: number | string, unit: string, color: string }) => (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
      <AppText variant="bodySmall" weight="medium" color={theme.colors.nearBlack}>{title}</AppText>
      <View style={styles.metricValueRow}>
        <AppText variant="heading" weight="semibold" color={theme.colors.nearBlack}>{value}</AppText>
        <AppText variant="body" weight="medium" color={theme.colors.nearBlack}>{unit}</AppText>
      </View>
    </View>
  );

  const renderMainContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading" weight="semibold">{exerciseLabel} Results</AppText>
      </View>

      <View style={styles.scrollContent}>
        <View style={[styles.successCard, { backgroundColor: theme.colors.success }]}>
          <AppText variant="title" weight="semibold" color={theme.colors.nearBlack}>
            {session ? 'Historical Session' : 'Session Complete!'}
          </AppText>
          <AppText variant="bodyLarge" color={theme.colors.nearBlack}>
            {session 
              ? `Completed on ${new Date(displayData.date).toLocaleDateString()}`
              : `Analyzed ${displayData.duration.toFixed(1)}s of video.`}
          </AppText>
        </View>

        {coachFeedback && (
          <View style={[styles.insightsCard, { backgroundColor: theme.colors.primary, borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1 }]}>
             <View style={styles.feedbackHeader}>
               <AppText variant="bodyLarge" weight="bold" color={theme.colors.nearBlack}>COACH FEEDBACK</AppText>
               <AppText variant="tiny" weight="bold" color="rgba(0,0,0,0.5)">FROM {coachName?.toUpperCase()}</AppText>
             </View>
             <AppText variant="body" color={theme.colors.nearBlack} style={{ marginTop: 4 }}>
               "{coachFeedback}"
             </AppText>
          </View>
        )}

        {videoUrl && (
          <View style={styles.section}>
            <AppText variant="title" weight="semibold">Session Recording</AppText>
            <View style={styles.videoContainer}>
              <VideoView
                player={player}
                style={styles.video}
                allowsFullscreen
                allowsPictureInPicture
              />
              <View style={styles.videoOverlay}>
                <View style={styles.videoBadge}>
                   <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>ORIGINAL RECORDING</AppText>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="title" weight="semibold">Rep Statistics</AppText>
          <View style={styles.metricsGrid}>
            <MetricCard 
              title="Total Reps" 
              value={displayData.totalReps} 
              unit="reps" 
              color={theme.colors.lavender} 
            />
            <MetricCard 
              title="Good Reps" 
              value={displayData.goodReps} 
              unit="reps" 
              color={theme.colors.success} 
            />
            <MetricCard 
              title="Bad Reps" 
              value={displayData.badReps} 
              unit="reps" 
              color={theme.colors.error} 
            />
            <MetricCard 
              title="Consistency" 
              value={displayData.consistency} 
              unit="%" 
              color={theme.colors.yellow} 
            />
            <MetricCard 
              title="Quality Score" 
              value={displayData.qualityScore} 
              unit="%" 
              color={theme.colors.primary} 
            />
          </View>
        </View>

        <View style={[styles.insightsCard, { 
          backgroundColor: theme.colors.cardDark,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.05)'
        }]}>
          <AppText variant="bodyLarge" weight="bold">Form Insight</AppText>
          <AppText variant="body" color={theme.colors.placeholder}>
            {displayData.totalReps === 0 
              ? "No repetitions detected. Please ensure your full body is visible from the side and you are performing the exercise clearly."
              : displayData.badReps > (displayData.totalReps / 2)
              ? "Improvement needed. We detected significant range-of-motion issues. Try to go deeper and maintain a steady pace."
              : displayData.badReps > 0
              ? "Good work! Keep focusing on achieving full depth for every single repetition to maximize your results."
              : "Exceptional form! Your consistency and range of motion are perfect. Keep up this professional level of execution."}
          </AppText>
          {displayData.consistency < 70 && displayData.totalReps > 2 && (
             <AppText variant="bodySmall" color={theme.colors.error} style={{ marginTop: 8 }}>
               Tip: Your movement speed varied significantly. Try using a metronome or steady count.
             </AppText>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable 
            style={[styles.doneButton]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: routes.main }],
                })
              );
            }}
          >
            <AppText variant="bodyLarge" weight="bold" color={theme.colors.nearBlack}>DONE</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <AppShell scrollable={!showPrompt} hasTabBar={false}>
      {renderMainContent()}
      
      <Modal
        visible={showPrompt}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
               <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
                 <Circle cx="40" cy="40" r="36" stroke={theme.colors.success} strokeWidth="3" fill={theme.colors.success + '15'} />
                 <Path 
                   d="M24 42L36 54L56 30" 
                   stroke={theme.colors.success} 
                   strokeWidth="6" 
                   strokeLinecap="round" 
                   strokeLinejoin="round" 
                 />
               </Svg>
            </View>
            
            <AppText variant="heading" weight="bold" style={styles.modalTitle}>Analysis Complete!</AppText>
            <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.modalSubtitle}>
              Your performance metrics have been securely saved. Would you like to share this session with your coach?
            </AppText>

            <View style={styles.modalActions}>
              {canShare && (
                <Pressable 
                  style={[styles.modalButton, styles.shareBtn]} 
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await handleShareWithCoach();
                    setShowPrompt(false);
                  }}
                >
                  <AppText variant="bodyLarge" weight="bold" color={theme.colors.nearBlack}>Share with Coach</AppText>
                </Pressable>
              )}
              
              <Pressable 
                style={[styles.modalButton, styles.doneBtn]} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPrompt(false);
                }}
              >
                <AppText variant="bodyLarge" weight="bold" color={theme.colors.textPrimary}>View Results</AppText>
              </Pressable>

              <Pressable 
                style={styles.skipLink} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPrompt(false);
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: routes.main }],
                    })
                  );
                }}
              >
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder}>RETURN TO DASHBOARD</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  scrollContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  successCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radii.largeCard,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  videoBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    width: '47%',
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  insightsCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.card,
    gap: theme.spacing.xs,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    width: '100%',
  },
  doneButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  successIconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalTitle: {
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    color: theme.colors.placeholder,
    paddingHorizontal: theme.spacing.md,
  },
  modalActions: {
    width: '100%',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    height: 60,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    backgroundColor: theme.colors.primary,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
