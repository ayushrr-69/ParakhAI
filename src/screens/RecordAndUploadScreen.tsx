import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, VideoFile } from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { AppShell } from '@/components/layout/AppShell';
import { useAnalysis } from '@/hooks/useAnalysis';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordAndUpload'>;

export function RecordAndUploadScreen({ route, navigation }: Props) {
  const { exerciseType = 'pushups' } = route.params || {};
  const { height: screenHeight } = useWindowDimensions();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<VideoFile | null>(null);
  const [progress, setProgress] = useState(0);
  const { isAnalyzing, startAnalysis } = useAnalysis();

  // Relaxed format selection for better Android compatibility
  const format = useCameraFormat(device, [
    { videoResolution: 'max' },
    { fps: 'max' }
  ]);

  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');

  useEffect(() => {
    async function request() {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    }
    request();
  }, []);

  const handleStopRecording = useCallback(async () => {
    if (!camera.current) return;
    await camera.current.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const handleTogglePause = useCallback(async () => {
    if (!camera.current || !isRecording) return;
    
    if (isPaused) {
      await camera.current.resumeRecording();
      setIsPaused(false);
    } else {
      await camera.current.pauseRecording();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const handleStartRecording = useCallback(async () => {
    if (!camera.current || !device) return;

    try {
      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          setPendingVideo(video);
        },
        onRecordingError: (error) => {
          Alert.alert('Recording Error', error.message);
          setIsRecording(false);
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [device, exerciseType, startAnalysis]); // Removed navigation from deps as we only set state now

  const handleConfirmAnalysis = async () => {
    if (!pendingVideo) return;
    
    try {
      const filename = pendingVideo.path.split('/').pop() || 'capture.mp4';
      const results = await startAnalysis(pendingVideo.path, filename, exerciseType, 10, (p) => {
        setProgress(Math.round(p * 100));
      });
      navigation.navigate(routes.analysisResults, { results, exerciseType, videoPath: pendingVideo.path });
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'Processing error');
      setPendingVideo(null);
    }
  };

  if (!hasPermission) return <AppShell><View style={styles.center}><AppText color="#fff">No Camera Permission</AppText></View></AppShell>;
  if (!device) return <AppShell><View style={styles.center}><AppText color="#fff">No Camera Device</AppText></View></AppShell>;

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={styles.analysisOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="title" weight="bold" style={{ marginTop: theme.spacing.lg }}>Analyzing {exerciseLabel}...</AppText>
          <AppText variant="heading" color={theme.colors.primary}>{progress}%</AppText>
          <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ marginTop: theme.spacing.md }}>
            Sending high-fidelity session data to neural engine
          </AppText>
        </View>
      ) : (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused && !isAnalyzing}
            format={format}
            video={true}
            audio={false}
            enableZoomGesture
          />

          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} />
            <AppText variant="heading" weight="semibold" color="#fff">Test Live: {exerciseLabel}</AppText>
          </View>

          <View style={styles.controls}>
            <View style={styles.controlsRow}>
              {isRecording && (
                <Pressable onPress={handleTogglePause} style={styles.sideButton}>
                  <View style={styles.pauseIconContainer}>
                    {isPaused ? (
                        <View style={styles.playIcon} />
                    ) : (
                        <View style={styles.pauseBars}>
                          <View style={styles.pauseBar} />
                          <View style={styles.pauseBar} />
                        </View>
                    )}
                  </View>
                  <AppText variant="tiny" weight="bold" color="#fff" style={{ marginTop: 4 }}>
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </AppText>
                </Pressable>
              )}

              <View style={styles.mainActionWrapper}>
                <Pressable 
                  onPress={isRecording ? handleStopRecording : handleStartRecording} 
                  style={[styles.recordButton, isRecording && styles.recordingActive]}
                >
                  {isRecording ? (
                    <View style={styles.stopIcon} />
                  ) : (
                    <View style={styles.recordIcon} />
                  )}
                </Pressable>
                <AppText variant="bodySmall" weight="bold" color="#fff" style={{ marginTop: 12 }}>
                  {isRecording ? 'STOP SESSION' : 'TAP TO RECORD'}
                </AppText>
              </View>

              {isRecording && <View style={styles.sideButtonSpacer} />}
            </View>
          </View>

          {pendingVideo && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={[styles.modalHeader, { backgroundColor: theme.colors.success }]}>
                  <AppText variant="title" weight="bold" color={theme.colors.textDark}>SESSION CAPTURED</AppText>
                </View>
                <View style={styles.modalBody}>
                  <AppText variant="bodyLarge" weight="semibold">Ready for analysis?</AppText>
                  <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center' }}>
                    Finalize your {exerciseLabel} video and send it to our AI engine for movement grading.
                  </AppText>
                  
                  <View style={styles.modalActions}>
                    <Pressable 
                      style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} 
                      onPress={handleConfirmAnalysis}
                    >
                      <AppText variant="body" weight="bold" color={theme.colors.textDark}>PROCEED TO TEST</AppText>
                    </Pressable>
                    <Pressable 
                      style={[styles.modalButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]} 
                      onPress={() => setPendingVideo(null)}
                    >
                      <AppText variant="body" weight="semibold" color="#fff">DISCARD & RETRY</AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.guide}>
            <AppText variant="bodySmall" color="#fff" style={{ opacity: 0.7 }}>
              {isRecording ? (isPaused ? 'Recording paused' : 'Recording in progress...') : 'Position camera sideways for peak accuracy'}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  analysisOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxxl,
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  mainActionWrapper: {
    alignItems: 'center',
    flex: 2,
  },
  sideButton: {
    flex: 1,
    alignItems: 'center',
  },
  sideButtonSpacer: {
    flex: 1,
  },
  pauseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 14,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordingActive: {
    borderColor: theme.colors.error,
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
  },
  recordIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.error,
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: theme.colors.error,
    borderRadius: 4,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    zIndex: 2000,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radii.largeCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalBody: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  modalActions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    height: 56,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
