import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio, Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, AnalysisDataFormat } from '@/types/navigation';
import { isOnDeviceAvailable, analyzeVideoOnDevice, AnalysisResult } from '@/ml';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VideoUploadScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const cameraRef = useRef<CameraView>(null);

  // Permission and camera state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMessage, setUploadingMessage] = useState('Analyzing your workout...');
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<'pushup' | 'bicep_curl' | 'squat'>('pushup');

  // Exercise options
  const exerciseOptions = [
    { id: 'pushup', label: 'Push-ups' },
    { id: 'bicep_curl', label: 'Bicep Curls' },
    { id: 'squat', label: 'Squats' },
  ] as const;

  // Timer for recording
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  if (!cameraPermission || !microphonePermission) {
    return <View />;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            We need camera and microphone access to record your workout videos
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={async () => {
              await requestCameraPermission();
              await requestMicrophonePermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max
      });

      if (video) {
        stopRecordingTimer();
        await uploadVideo(video.uri);
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      stopRecordingTimer();
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      stopRecordingTimer();
    }
  };

  const stopRecordingTimer = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  const pickVideoFromGallery = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        await uploadVideo(videoUri);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to pick video from gallery.');
    }
  };

  const uploadVideo = async (videoUri: string) => {
    try {
      setUploading(true);

      // Get video duration first
      let videoDurationMs = 10000; // Default 10 seconds
      try {
        setUploadingMessage('Reading video info...');
        const { sound, status } = await Audio.Sound.createAsync({ uri: videoUri });
        if (status.isLoaded && status.durationMillis) {
          videoDurationMs = status.durationMillis;
          console.log(`Video duration: ${videoDurationMs}ms (${(videoDurationMs / 1000).toFixed(1)} seconds)`);
        }
        await sound.unloadAsync();
      } catch (durationError) {
        console.warn('Could not get video duration, using default:', durationError);
      }

      // Try on-device processing first if available
      const onDeviceAvailable = isOnDeviceAvailable();
      console.log(`On-device ML available: ${onDeviceAvailable}`);

      if (onDeviceAvailable) {
        try {
          console.log('Attempting on-device analysis...');
          setUploadingMessage('Processing on device...');
          
          // Pass video duration for proper frame extraction
          const result = await analyzeVideoOnDevice(
            videoUri, 
            selectedExercise, 
            (progress) => {
              setUploadingMessage(`${progress.message}`);
              console.log(`[On-Device] ${progress.stage}: ${progress.message} (${progress.progress}%)`);
            },
            videoDurationMs
          );

          console.log('✓ On-device analysis complete:', result);

          // Transform on-device result to API format
          const analysisData: AnalysisDataFormat = {
            status: 'success',
            analysis_id: `local_${Date.now()}`,
            user_id: 'local_user',
            exercise_type: selectedExercise,
            metrics: {
              form_score: result.formScore,
              rep_count: result.repCount,
              failed_reps: result.badRepCount,
              good_rep_count: result.goodRepCount,
              bad_rep_count: result.badRepCount,
              bad_rep_numbers: result.badRepNumbers,
              rep_scores: result.repScores,
            },
            corrections: result.corrections,
            processing_mode: 'on-device',
          };

          // Navigate to results screen
          navigation.navigate('AnalysisResults', { analysisData });

          return; // Success - no need to try server
        } catch (error) {
          console.log('On-device processing failed, falling back to server:', error);
          setUploadingMessage('Uploading to server...');
          // Continue to server fallback below
        }
      } else {
        setUploadingMessage('Uploading to server...');
      }

      // Server processing (fallback or default)
      console.log('Using server-based analysis...');

      const formData = new FormData();
      
      // Add video file
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'exercise_video.mp4',
      } as any);
      
      // Add selected exercise type
      formData.append('exercise_type', selectedExercise);
      formData.append('user_id', 'test_user');

      console.log(`Uploading ${selectedExercise} video to backend...`);

      const response = await fetch('http://192.168.109.190:9000/api/v1/analyze/video', {
        method: 'POST',
        // Don't set Content-Type manually - let fetch set it with proper boundary for multipart/form-data
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✓ Server analysis result:', result);

      // Navigate to results screen with the analysis data
      navigation.navigate('AnalysisResults', { 
        analysisData: result 
      });

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error instanceof Error 
          ? `Failed to analyze video: ${error.message}`
          : 'Failed to analyze video. Please check your connection and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    );
  };

  const toggleFlash = () => {
    setFlashMode(current => 
      current === 'off' ? 'on' : 'off'
    );
  };

  if (uploading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.uploadingText}>{uploadingMessage}</Text>
          <Text style={styles.uploadingSubtext}>
            {uploadingMessage.includes('device') 
              ? 'Processing locally with AI on your device' 
              : 'Using AI to analyze your form and count reps'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Your Workout</Text>
        <Text style={styles.subtitle}>Select exercise type below</Text>
      </View>

      {/* Exercise Type Selector */}
      <View style={styles.exerciseSelector}>
        {exerciseOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.exerciseOption,
              selectedExercise === option.id && styles.exerciseOptionSelected
            ]}
            onPress={() => setSelectedExercise(option.id as typeof selectedExercise)}
          >
            <Text style={[
              styles.exerciseOptionText,
              selectedExercise === option.id && styles.exerciseOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        />
        
        {/* Camera overlay controls - positioned absolutely */}
        <View style={styles.cameraOverlay}>
            {/* Top controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                <Text style={styles.controlButtonText}>
                  {flashMode === 'off' ? '⚡️' : '💡'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
                <Text style={styles.controlButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>

            {/* Recording timer */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>REC {formatTime(recordingTime)}</Text>
              </View>
            )}

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              {/* Gallery button */}
              <TouchableOpacity style={styles.galleryButton} onPress={pickVideoFromGallery}>
                <Text style={styles.galleryButtonText}>📁</Text>
              </TouchableOpacity>

              {/* Record button */}
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonInnerActive
                ]} />
              </TouchableOpacity>

              {/* Placeholder for symmetry */}
              <View style={styles.galleryButton} />
            </View>
          </View>
        </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>• Position camera to show full body</Text>
        <Text style={styles.instructionText}>• Record 5-15 reps of your exercise</Text>
        <Text style={styles.instructionText}>• Keep movements slow and controlled</Text>
        <Text style={styles.instructionText}>• Ensure good lighting</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  exerciseSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 8,
  },
  exerciseOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
  },
  exerciseOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  exerciseOptionText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseOptionTextSelected: {
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingTime: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonActive: {
    backgroundColor: '#FF3333',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3333',
  },
  recordButtonInnerActive: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  instructions: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  uploadingSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VideoUploadScreen;