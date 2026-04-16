import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/common/BackButton';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { coachService } from '@/services/coach';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachReview'>;

import { useToast } from '@/contexts/ToastContext';

export function CoachReviewScreen({ route, navigation }: Props) {
  const { submissionId, athleteName, sessionData } = route.params;
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError(true);
      showToast({
        title: "Required",
        message: "Please provide technical feedback for the athlete.",
        type: "info"
      });
      return;
    }

    setSubmitting(true);
    const success = await coachService.submitFeedback(
      submissionId,
      sessionData.user_id,
      feedback.trim(),
      rating
    );

    if (success) {
      showToast({
        title: "Success",
        message: "Feedback shared with " + athleteName,
        type: "success"
      });
      navigation.goBack();
    } else {
      showToast({
        title: "Error",
        message: "Failed to submit feedback.",
        type: "error"
      });
    }
    setSubmitting(false);
  };

  const MetricCard = ({ title, value, unit, color }: { title: string, value: number | string, unit: string, color: string }) => (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
        <AppText variant="bodySmall" weight="semibold" color={theme.colors.textDark}>{title}</AppText>
        <View style={styles.metricValueContainer}>
           <AppText variant="title" weight="bold" color={theme.colors.nearBlack}>{value}</AppText>
           <AppText variant="bodySmall" weight="semibold" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>{unit}</AppText>
        </View>
    </View>
  );

  const player = useVideoPlayer(sessionData?.video_url || '', (player) => {
    if (sessionData?.video_url) {
      player.loop = true;
      player.play();
    }
  });

  if (!sessionData) {
    return (
      <AppShell header={<BackButton onPress={() => navigation.goBack()} />}>
        <View style={styles.content}>
          <AppText variant="bodyLarge" color={theme.colors.placeholder}>Error: Session data missing</AppText>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell 
      header={
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText variant="heading" weight="semibold">Reviewing {athleteName}</AppText>
        </View>
      }
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* VIDEO PLAYER SECTION */}
          {sessionData.video_url ? (
            <View style={styles.videoContainer}>
              <VideoView
                player={player}
                style={styles.video}
                allowsFullscreen
                allowsPictureInPicture
              />
              <View style={styles.videoOverlay}>
                <View style={styles.videoBadge}>
                   <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>ATHLETE RECORDING</AppText>
                </View>
              </View>
            </View>
          ) : (
             <View style={[styles.videoContainer, styles.noVideo]}>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>No video recording provided</AppText>
             </View>
          )}

          {/* AI METRICS (Styled like AnalysisResultsScreen) */}
          <View style={styles.section}>
            <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.sectionLabel}>
              AI PERFORMANCE SNAP
            </AppText>
            <View style={styles.metricsGrid}>
              <MetricCard 
                title="Quality Score" 
                value={sessionData.quality_score || 0} 
                unit="/ 100" 
                color={theme.colors.lavender} 
              />
              <MetricCard 
                title="Consistency" 
                value={sessionData.consistency_score || 0} 
                unit="%" 
                color={theme.colors.yellow} 
              />
              <MetricCard 
                title="Total Reps" 
                value={sessionData.total_reps || 0} 
                unit="reps" 
                color={theme.colors.success} 
              />
              <MetricCard 
                title="Avg Power" 
                value={sessionData.avg_power || 0} 
                unit="W" 
                color={theme.colors.primary} 
              />
            </View>
          </View>

          {/* COACH FEEDBACK FORM */}
          <View style={styles.formBox}>
            <AppText variant="heading" weight="bold" style={{ marginBottom: 16 }}>Coach Feedback</AppText>
            
            <AppText variant="bodySmall" weight="bold" color={error ? theme.colors.error : theme.colors.placeholder} style={styles.fieldLabel}>
              TECHNICAL NOTES
            </AppText>
            <TextInput
              style={[
                styles.textInput,
                error && { borderColor: theme.colors.error, backgroundColor: 'rgba(255, 68, 68, 0.05)' }
              ]}
              placeholder="Provide specific corrections or form advice..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              value={feedback}
              maxLength={1000}
              onChangeText={(t) => {
                setFeedback(t);
                if (error) setError(false);
              }}
            />

            <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={[styles.fieldLabel, { marginTop: 24 }]}>
              RATING (1-5)
            </AppText>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable 
                  key={star} 
                  onPress={() => setRating(star)}
                  style={[styles.starBtn, rating >= star && styles.starBtnActive]}
                >
                  <AppText variant="bodyLarge" weight="bold" color={rating >= star ? '#000' : theme.colors.placeholder}>
                    {star}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <Pressable 
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.textDark} />
              ) : (
                <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark}>
                  SHARE FEEDBACK
                </AppText>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
    gap: 24,
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
  noVideo: {
    alignItems: 'center',
    justifyContent: 'center',
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
  section: {
    gap: theme.spacing.md,
  },
  sectionLabel: {
    letterSpacing: 2,
    opacity: 0.6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    width: '47.4%',
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
  formBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldLabel: {
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.card,
    padding: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.fontFamily.medium,
    textAlignVertical: 'top',
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    flex: 1,
    height: 52,
    borderRadius: theme.radii.card,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  starBtnActive: {
    backgroundColor: theme.colors.yellow,
    borderColor: theme.colors.yellow,
  },
  submitBtn: {
    marginTop: 32,
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
  }
});
