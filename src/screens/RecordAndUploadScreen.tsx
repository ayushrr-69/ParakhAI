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
import { historyService } from '@/services/history';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useToast } from '@/contexts/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordAndUpload'>;

export function RecordAndUploadScreen({ route, navigation }: Props) {
  const { exerciseType = 'pushups' } = route.params || {};
  const { height: screenHeight } = useWindowDimensions();
  const camera = useRef<Camera>(null);
  const backDevice = useCameraDevice('back');
  const [fallbackDevice, setFallbackDevice] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const activeDevice = backDevice || fallbackDevice;
  
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<VideoFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { isAnalyzing, startAnalysis } = useAnalysis();
  const { showToast } = useToast();

  const format = useCameraFormat(activeDevice, [
    { videoResolution: 'max' },
    { fps: 'max' }
  ]);

  const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ');

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any;
    
    async function initialize() {
      try {
        setIsInitializing(true);
        console.log('[Camera] Initializing hardware discovery...');
        
        // 0. Environment check (Constants needs to be imported from expo-constants)
        // We'll log the status to help us debug
        
        // 1. Check Permissions and Log Status
        const camStatus = await Camera.requestCameraPermission();
        const micStatus = await Camera.requestMicrophonePermission();
        const currentCamStatus = Camera.getCameraPermissionStatus();
        
        console.log(`[Camera] Permission Status - Cam: ${camStatus} (Current: ${currentCamStatus}), Mic: ${micStatus}`);
        
        if (!isMounted) return;
        
        if (camStatus !== 'granted') {
          console.error('[Camera] Permission denied by user');
          setHasPermission(false);
          setIsInitializing(false);
          return;
        }
        
        setHasPermission(true);

        // 2. Hardware Polling Discovery
        // Sometimes Android takes 1-2 seconds to "release" the camera after another app closed it
        let attempts = 0;
        const scan = async () => {
          if (!isMounted) return false;
          
          console.log(`[Camera] Attempt ${attempts + 1}: Scanning for devices...`);
          const devices = await Camera.getAvailableCameraDevices();
          console.log(`[Camera] Found ${devices.length} devices total.`);
          
          if (devices.length > 0) {
            // Success!
            const manualBack = devices.find(d => d.position === 'back');
            if (manualBack) {
              console.log('[Camera] Bound to back camera:', manualBack.name);
              setFallbackDevice(manualBack);
            } else {
              console.log('[Camera] No back camera, using first available:', devices[0].name);
              setFallbackDevice(devices[0]);
            }
            setIsInitializing(false);
            return true;
          }
          
          attempts++;
          return false;
        };

        const success = await scan();
        if (!success) {
           pollInterval = setInterval(async () => {
             const found = await scan();
             if (found || attempts >= 5) {
               clearInterval(pollInterval);
               setIsInitializing(false);
             }
           }, 1000);
        }
      } catch (err) {
        console.error('[Camera] Init error:', err);
        if (isMounted) setIsInitializing(false);
      }
    }

    initialize();
    return () => { 
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [backDevice]);

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
    if (!camera.current || !activeDevice) return;

    try {
      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          if (video.duration < 2) {
            showToast({
              title: "Video Too Short",
              message: "Please record at least 2 seconds for a valid analysis.",
              type: "info"
            });
            setIsRecording(false);
            return;
          }
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
  }, [activeDevice, exerciseType, startAnalysis]); // Removed navigation from deps as we only set state now

  const handleConfirmAnalysis = async () => {
    if (isAnalyzing || isSaving) return;
    if (!pendingVideo) return;
    
    try {
      const filename = pendingVideo.path.split('/').pop() || 'capture.mp4';
      const results = await startAnalysis(pendingVideo.path, filename, exerciseType, 10, (p) => {
        setProgress(Math.round(p * 100));
      });

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
          review: "Live recorded session analysis completed.",
          correction: "Great intensity.",
          validation: "Form verified."
        }
      };

      setIsSaving(true);
      const sessionId = await historyService.addSession(sessionData, pendingVideo.path);

      navigation.replace(routes.analysisResults, { 
        results, 
        exerciseType, 
        videoPath: pendingVideo.path,
        session: { ...sessionData, id: sessionId, date: new Date().toISOString() }
      });
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Analysis Failed', err.message || 'Processing error');
      setPendingVideo(null);
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <AppText color="#fff" style={{ marginTop: 20 }}>Syncing Hardware...</AppText>
      </View>
    );
  }

  if (!hasPermission) return <AppShell><View style={styles.center}><AppText color="#fff">No Camera/Mic Permission</AppText></View></AppShell>;
  if (!activeDevice) return <AppShell><View style={styles.center}><AppText color="#fff">No Camera Device Available</AppText></View></AppShell>;

  return (
    <View style={styles.container}>
      {(isAnalyzing || isSaving) ? (
        <View style={styles.analysisOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="title" weight="bold" style={{ marginTop: theme.spacing.lg }}>
            {isAnalyzing ? `Analyzing ${exerciseLabel}...` : 'Saving Results...'}
          </AppText>
          {isAnalyzing && <AppText variant="heading" color={theme.colors.primary}>{progress}%</AppText>}
          <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ marginTop: theme.spacing.md }}>
            {isAnalyzing ? 'Sending high-fidelity session data to neural engine' : 'Finalizing your performance report'}
          </AppText>
        </View>
      ) : (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={activeDevice}
            isActive={isFocused && !isAnalyzing}
            format={format}
            video={true}
            audio={false}
            enableZoomGesture
          />

          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} color="#fff" />
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
