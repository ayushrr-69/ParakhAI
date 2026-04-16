import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toast } from '@/components/common/Toast';

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
      <NetworkProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
              <Toast />
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
