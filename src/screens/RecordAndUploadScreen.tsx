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
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!camera.current || !device) return;

    try {
      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          // Auto-trigger analysis
          try {
            const filename = video.path.split('/').pop() || 'capture.mp4';
            const results = await startAnalysis(video.path, filename, exerciseType, 10, (p) => {
              setProgress(Math.round(p * 100));
            });
            navigation.navigate(routes.analysisResults, { results, exerciseType });
          } catch (err: any) {
            Alert.alert('Analysis Failed', err.message || 'Processing error');
            setIsRecording(false);
          }
        },
        onRecordingError: (error) => {
          Alert.alert('Recording Error', error.message);
          setIsRecording(false);
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setIsRecording(false);
    }
  }, [device, exerciseType, navigation, startAnalysis]);

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
            <BackButton onPress={() => navigation.goBack()} color="#fff" />
            <AppText variant="heading" weight="semibold" color="#fff">Test Live: {exerciseLabel}</AppText>
          </View>

          <View style={styles.controls}>
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
              {isRecording ? 'TAP TO STOP & ANALYZE' : 'TAP TO RECORD SESSION'}
            </AppText>
          </View>

          <View style={styles.guide}>
            <AppText variant="bodySmall" color="#fff" style={{ opacity: 0.7 }}>
              {isRecording ? 'Recording in progress...' : 'Position camera sideways for peak accuracy'}
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
    alignItems: 'center',
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
  guide: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
