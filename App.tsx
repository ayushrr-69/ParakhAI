import 'react-native-gesture-handler';
import { View } from 'react-native';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/providers/AppProviders';

import { VisualVideoAnalyzer } from '@/components/analysis/VisualVideoAnalyzer';

export default function App() {
  useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  return (
    <AppProviders>
      <AppNavigator />
      <VisualVideoAnalyzer />
    </AppProviders>
  );
}
