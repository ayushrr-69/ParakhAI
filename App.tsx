import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/providers/AppProviders';
import { theme } from '@/theme';

import { VisualVideoAnalyzer } from '@/components/analysis/VisualVideoAnalyzer';

export default function App() {
  useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  return (
    <AppProviders>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar style="light" translucent={false} backgroundColor={theme.colors.background} />
        <AppNavigator />
        <VisualVideoAnalyzer />
      </View>
    </AppProviders>
  );
}
