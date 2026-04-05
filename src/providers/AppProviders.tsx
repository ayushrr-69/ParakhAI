import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.background,
    primary: theme.colors.primary,
    text: theme.colors.textPrimary,
    border: 'transparent',
    notification: theme.colors.accentOrange,
  },
};

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
    </SafeAreaProvider>
  );
}
