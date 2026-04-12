import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { mockAnalysisFeedback } from '@/constants/content';
import { useMemo, useEffect, useState } from 'react';
import { historyService, Session } from '@/services/history';
import { AnalysisResult } from '@/types/analysis';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { coachService } from '@/services/coach';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResults'>;

export function AnalysisResultsScreen({ route, navigation }: Props) {
  const { results, exerciseType, session, videoPath, coachFeedback, coachName } = route.params;
  const { user, profile } = useAuth();
  const { refreshAll } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  
  // Standardize data from either history or live analysis
  const data = useMemo(() => {
    if (session) {
      return {
        summary: {
          total_reps: session.totalReps || 0,
          good_reps: session.goodReps || 0,
          bad_reps: (session.totalReps || 0) - (session.goodReps || 0),
          avg_power: session.avgPower || 0,
          avg_speed: session.avgSpeed || 0,
        },
        metadata: { 
          consistency_score: session.consistency || 0,
          quality_score: session.qualityScore || 0
        }
      };
    }
    
    const s = results?.analysis?.summary || { total_reps: 0, good_reps: 0, bad_reps: 0, avg_power: 0, avg_speed: 0 };
    const m = results?.analysis?.metadata || { consistency_score: 0 };
    
    // Quality Score Logic: Standardized 0-100 grade
    const formRatio = s.total_reps > 0 ? s.good_reps / s.total_reps : 0;
    const quality_score = Math.round(((m.consistency_score || 0) * 0.6) + (formRatio * 40));
    
    return {
      summary: s,
      metadata: { ...m, quality_score }
    };
  }, [results, session]);

  const { summary, metadata } = data;
  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');

  const insights = useMemo(() => {
    if (session) return session.insights;
    
    const feedback = mockAnalysisFeedback[exerciseType as keyof typeof mockAnalysisFeedback] || mockAnalysisFeedback.pushups;
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    return {
      review: getRandom(feedback.review),
      correction: getRandom(feedback.correction),
      validation: getRandom(feedback.validation)
    };
  }, [exerciseType, session]);

  const MetricCard = ({ title, value, unit, color }: { title: string, value: number | string, unit: string, color: string }) => (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
        <AppText variant="bodySmall" weight="semibold" color={theme.colors.textDark}>{title}</AppText>
        <View style={styles.metricValueContainer}>
           <AppText variant="title" weight="bold" color={theme.colors.nearBlack}>{value}</AppText>
           <AppText variant="bodySmall" weight="semibold" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>{unit}</AppText>
        </View>
    </View>
  );

  const FeedbackBlock = ({ title, content, color, label }: { title: string, content: string, color: string, label: string }) => (
    <View style={styles.feedbackBlock}>
      <View style={styles.feedbackHeader}>
          <View style={[styles.feedbackDot, { backgroundColor: color }]} />
          <AppText variant="bodySmall" weight="bold" color={color}>{label}</AppText>
      </View>
      <AppText variant="body" weight="semibold">{content}</AppText>
    </View>
  );

  const handleDone = async () => {
    if (isSaving || isSubmitting) return;

    // Only save to local history if we just finished a new assessment and haven't saved it yet
    if (!session && results && !savedSessionId) {
      try {
        setIsSaving(true);
        const sessionId = await historyService.addSession({
          exerciseType,
          totalReps: summary.total_reps,
          goodReps: summary.good_reps,
          consistency: metadata.consistency_score,
          qualityScore: (metadata as any).quality_score,
          avgPower: summary.avg_power || 0,
          avgSpeed: summary.avg_speed || 0,
          insights,
        }, videoPath);
        setSavedSessionId(sessionId);
        refreshAll(); // Update global history cache
      } catch (e) {
        console.error('Failed to save session to local history:', e);
        setIsSaving(false);
        return; // Don't navigate if save failed
      }
    }
    navigation.navigate('Main', { screen: routes.tests } as any);
  };

  const handleUploadAndSubmit = async () => {
    if (hasSubmitted || isSubmitting) return;

    if (!profile?.coach_id) {
      Alert.alert("No Coach Assigned", "Please connect with a coach in the Coach tab before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Save session first (only if not already saved)
      let sessionId = savedSessionId;
      if (!sessionId) {
        sessionId = await historyService.addSession({
          exerciseType,
          totalReps: summary.total_reps,
          goodReps: summary.good_reps,
          consistency: metadata.consistency_score,
          qualityScore: (metadata as any).quality_score,
          avgPower: summary.avg_power || 0,
          avgSpeed: summary.avg_speed || 0,
          insights
        }, videoPath);
        setSavedSessionId(sessionId);
      }

      // 2. Submit to coach
      const success = await coachService.createSubmission(sessionId!, profile.coach_id);
      if (success) {
        setHasSubmitted(true);
        refreshAll(); // Update global sharing status
      } else {
        throw new Error('Coach submission failed');
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View>
            <AppText variant="heading" weight="bold">{exerciseLabel} Results</AppText>
            {coachFeedback && (
              <AppText variant="tiny" weight="bold" color={theme.colors.primary} style={{ letterSpacing: 1 }}>REVIEWED BY {coachName?.toUpperCase() || 'COACH'}</AppText>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={styles.heroBadge}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.success}>SESSION VERIFIED</AppText>
            </View>
            <AppText variant="hero" weight="bold">Analysis Ready</AppText>
            <AppText variant="bodyLarge" color={theme.colors.placeholder}>
              {exerciseLabel} quality assessment
            </AppText>
          </View>

          <View style={styles.section}>
            <View style={styles.metricsGrid}>
               <MetricCard 
                title="Quality Score" 
                value={(metadata as any).quality_score} 
                unit="/ 100" 
                color={theme.colors.lavender} 
              />
               <MetricCard 
                title="Consistency" 
                value={metadata.consistency_score} 
                unit="%" 
                color={theme.colors.yellow} 
              />
               <MetricCard 
                title="Reps" 
                value={summary.total_reps} 
                unit="total" 
                color={theme.colors.success} 
              />
              <MetricCard 
                title="Good Form" 
                value={summary.good_reps} 
                unit="reps" 
                color={theme.colors.primary} 
              />
            </View>
          </View>

          <View style={styles.feedbackSection}>
             {coachFeedback && (
               <FeedbackBlock 
                  label="COACH REVIEW"
                  title="Feedback"
                  content={coachFeedback}
                  color={theme.colors.primary}
               />
             )}
             <FeedbackBlock 
                label="AI REVIEW"
                title="Performance"
                content={insights.review}
                color={theme.colors.lavender}
             />
             <FeedbackBlock 
                label="CORRECTION"
                title="Form Fix"
                content={insights.correction}
                color={theme.colors.yellow}
             />
             <FeedbackBlock 
                label="VALIDATION"
                title="System Check"
                content={insights.validation}
                color={theme.colors.success}
             />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          {!session && (
             <Pressable 
               style={[
                 styles.submitButton, 
                 (isSubmitting || hasSubmitted) && styles.disabledButton,
                 hasSubmitted && styles.successButton
               ]} 
               onPress={handleUploadAndSubmit}
               disabled={isSubmitting || hasSubmitted}
             >
               {isSubmitting ? (
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <ActivityIndicator color={theme.colors.textDark} />
                   <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Compressing & Sending...</AppText>
                 </View>
               ) : hasSubmitted ? (
                 <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Shared with Coach</AppText>
               ) : (
                 <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Submit to Coach</AppText>
               )}
             </Pressable>
          )}

          <Pressable 
            style={[styles.doneButton, (isSaving || isSubmitting) && styles.disabledButton]} 
            onPress={handleDone}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={theme.colors.textDark} />
                <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Saving results...</AppText>
              </View>
            ) : (
              <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>{session ? 'Close' : 'Done'}</AppText>
            )}
          </Pressable>
        </View>
      </View>
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
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  heroSection: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    marginBottom: theme.spacing.xs,
  },
  section: {
    gap: theme.spacing.md,
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
  feedbackSection: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  feedbackBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  submitButton: {
    height: 62,
    backgroundColor: theme.colors.lavender,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButton: {
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success,
  },
  doneButton: {
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
  disabledButton: {
    backgroundColor: theme.colors.cardDark,
    opacity: 0.6,
  },
});
