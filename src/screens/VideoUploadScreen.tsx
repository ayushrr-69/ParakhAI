import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { GLView } from 'expo-gl';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { AppShell } from '@/components/layout/AppShell';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { useAnalysis } from '@/hooks/useAnalysis';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoUpload'>;

export function VideoUploadScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const { height: screenHeight } = useWindowDimensions();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [glContext, setGlContext] = useState<any>(null);
  const { isAnalyzing, startAnalysis, error } = useAnalysis();

  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');
  const uploadBoxHeight = Math.max(160, Math.min(220, Math.round(screenHeight * 0.22)));

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setVideoName(result.assets[0].fileName || result.assets[0].uri.split('/').pop() || 'Selected video');
      setVideoDuration(result.assets[0].duration ? result.assets[0].duration / 1000 : null);
    }
  };

  const handleAnalysis = async () => {
    if (!videoUri || !videoDuration) {
      Alert.alert('No video selected', 'Please select a video from your gallery first.');
      return;
    }

    try {
      setProgress(0);
      const filename = videoUri.split('/').pop() || 'capture.mp4';
      const results = await startAnalysis(videoUri, filename, exerciseType, videoDuration, (p) => {
          setProgress(Math.round(p * 100));
      }, glContext);
      navigation.navigate(routes.analysisResults, { results, exerciseType });
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <AppShell 
      scrollable 
      header={
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText variant="heading" weight="semibold">Process {exerciseLabel}</AppText>
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Pressable 
            style={[styles.primaryButton, (!videoUri || isAnalyzing) && styles.disabledButton]} 
            onPress={handleAnalysis}
            disabled={!videoUri || isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={theme.colors.textDark} />
                <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Analyzing: {progress}%</AppText>
              </View>
            ) : (
              <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Start Analysis</AppText>
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.container}>
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
            <View style={styles.glassHeader}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
              <AppText variant="bodySmall" weight="bold" color={theme.colors.success} style={{ letterSpacing: 1 }}>
                READY FOR ANALYSIS
              </AppText>
            </View>
            <View style={styles.instructionList}>
              <View style={styles.instructionItem}>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>• Use a stable side-view angle for accuracy</AppText>
              </View>
              <View style={styles.instructionItem}>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>• Ensure lighting is clear and consistent</AppText>
              </View>
              <View style={styles.instructionItem}>
                <AppText variant="bodySmall" color={theme.colors.placeholder}>• Position yourself fully within the frame</AppText>
              </View>
            </View>
          </View>

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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  content: {
    justifyContent: 'flex-start',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  uploadBox: {
    borderRadius: theme.radii.largeCard,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  uploadBoxSelected: {
    borderColor: 'rgba(69, 197, 136, 0.3)',
    backgroundColor: 'rgba(69, 197, 136, 0.04)',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  selectedContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  fileName: {
    textAlign: 'center',
    maxWidth: 240,
    opacity: 0.8,
  },
  instructions: {
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radii.largeCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  instructionList: {
    gap: theme.spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  primaryButton: {
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
    backgroundColor: theme.colors.surface,
    opacity: 0.4,
  },
});
