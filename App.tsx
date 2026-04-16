import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { Camera } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/providers/AppProviders';

import { VisualVideoAnalyzer } from '@/components/analysis/VisualVideoAnalyzer';

export default function App() {
  useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  useEffect(() => {
    async function requestPermissions() {
      try {
        // Request Camera Permission
        await Camera.requestCameraPermission();
        // Request Microphone Permission
        await Camera.requestMicrophonePermission();
        // Request Location Permission
        await Location.requestForegroundPermissionsAsync();
      } catch (error) {
        console.warn('[App] Permission request error:', error);
      }
    }
    requestPermissions();
  }, []);

  return (
    <AppProviders>
      <AppNavigator />
      <VisualVideoAnalyzer />
    </AppProviders>
  );
}
