import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/providers/AppProviders';
import { initializeTensorFlow } from '@/ml';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  // Initialize TensorFlow.js on app start
  useEffect(() => {
    initializeTensorFlow()
      .then(() => console.log('✓ TensorFlow.js ready'))
      .catch((error) => console.warn('TensorFlow.js initialization failed:', error));
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}
