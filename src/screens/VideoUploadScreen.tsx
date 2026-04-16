import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { GLView } from 'expo-gl';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { AppShell } from '@/components/layout/AppShell';
import { useAnalysis } from '@/hooks/useAnalysis';
import { historyService } from '@/services/history';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoUpload'>;

import { useToast } from '@/contexts/ToastContext';

export function VideoUploadScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const { height: screenHeight } = useWindowDimensions();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [glContext, setGlContext] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isAnalyzing, startAnalysis, error } = useAnalysis();
  const { showToast } = useToast();

  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');
  const uploadBoxHeight = Math.max(160, Math.min(220, Math.round(screenHeight * 0.22)));

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const duration = result.assets[0].duration ? result.assets[0].duration / 1000 : 0;
      
      if (duration < 2) {
        showToast({
          title: "Video Too Short",
          message: "Please select a video that is at least 2 seconds long.",
          type: "info"
        });
        return;
      }

      setVideoUri(result.assets[0].uri);
      setVideoName(result.assets[0].fileName || result.assets[0].uri.split('/').pop() || 'Selected video');
      setVideoDuration(duration);
    }
  };

  const handleAnalysis = async () => {
    if (isAnalyzing || isSaving) return;
    if (!videoUri || !videoDuration) {
      showToast({
        title: 'No video selected',
        message: 'Please select a video from your gallery first.',
        type: 'info'
      });
      return;
    }

    try {
      setProgress(0);
      const filename = videoUri.split('/').pop() || 'capture.mp4';
      const results = await startAnalysis(videoUri, filename, exerciseType, videoDuration, (p) => {
          setProgress(Math.round(p * 100));
      }, glContext);

      // Save to history before navigating
      const sessionData = {
        exerciseType: exerciseType as any,
        totalReps: results.analysis.summary.total_reps,
        goodReps: results.analysis.summary.good_reps,
        consistency: results.analysis.summary.consistency_score || results.analysis.metadata.consistency_score,
        qualityScore: Math.min(90, Math.max(60, results.analysis.summary.quality_score || Math.round((results.analysis.summary.good_reps / (results.analysis.summary.total_reps || 1)) * 100))),
        avgPower: results.analysis.summary.avg_power || 0,
        avgSpeed: results.analysis.summary.avg_speed || 0,
        insights: {
          review: "Video upload analysis completed.",
          correction: "Check your range of motion.",
          validation: "Session successfully processed."
        }
      };

      setIsSaving(true);
      const sessionId = await historyService.addSession(sessionData, videoUri);
      
      navigation.replace(routes.analysisResults, { 
        results, 
        exerciseType,
        session: { ...sessionData, id: sessionId, date: new Date().toISOString() }
      });
    } catch (err: any) {
      setIsSaving(false);
      showToast({
        title: 'Analysis Failed',
        message: err.message || 'Something went wrong',
        type: 'error'
      });
    }
  };

  return (
    <AppShell scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText variant="heading" weight="semibold">Process {exerciseLabel}</AppText>
        </View>

        <View style={styles.content}>
          <Pressable 
            style={[styles.uploadBox, { height: uploadBoxHeight }, videoUri && styles.uploadBoxSelected]} 
            onPress={pickVideo}
            disabled={isAnalyzing}
          >
            {videoUri ? (
              <View style={styles.selectedContent}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13l4 4L19 7" stroke={theme.colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <AppText variant="bodyLarge" weight="medium">Video Selected</AppText>
                {videoName && (
                  <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.fileName}>
                    {videoName}
                  </AppText>
                )}
                {videoDuration && (
                  <AppText variant="bodySmall" color={theme.colors.success}>
                    Duration: {videoDuration.toFixed(1)}s
                  </AppText>
                )}
                <AppText variant="bodySmall" color={theme.colors.placeholder}>Tap to change</AppText>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={theme.colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <AppText variant="bodyLarge" weight="medium">Choose a video</AppText>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>Tap to pick a workout video from your device</AppText>
              </View>
            )}
          </Pressable>

          <View style={styles.instructions}>
            <View style={styles.warningRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={theme.colors.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <AppText variant="bodySmall" weight="semibold" color={theme.colors.error}>PROCESSING READY</AppText>
            </View>
            <AppText variant="bodySmall" color={theme.colors.placeholder}>• Pick a clear workout clip for the best analysis flow</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder}>• Side view is still the best setup for form checks</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder}>• Full body visibility gives the cleanest results</AppText>
          </View>

        </View>

        <View style={styles.footer}>
          <Pressable 
            style={[styles.primaryButton, (!videoUri || isAnalyzing || isSaving) && styles.disabledButton]} 
            onPress={handleAnalysis}
            disabled={!videoUri || isAnalyzing || isSaving}
          >
            {isAnalyzing || isSaving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={theme.colors.textDark} />
                <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>
                  {isAnalyzing ? `Analyzing: ${progress}%` : 'Saving Results...'}
                </AppText>
              </View>
            ) : (
              <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Start Analysis</AppText>
            )}
          </Pressable>
        </View>

        <GLView
          style={{ opacity: 0, position: 'absolute', width: 1, height: 1 }}
          onContextCreate={setGlContext}
        />

      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  content: {
    justifyContent: 'flex-start',
    gap: theme.spacing.lg,
  },
  uploadBox: {
    borderRadius: theme.radii.largeCard,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardDark,
  },
  uploadBoxSelected: {
    borderColor: theme.colors.success,
    borderStyle: 'solid',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectedContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fileName: {
    textAlign: 'center',
    maxWidth: 240,
  },
  instructions: {
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  footer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  primaryButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
});
