import React, { PropsWithChildren, ReactNode, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';

type AppShellProps = PropsWithChildren<{
  scrollable?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  footerMode?: 'flow' | 'sticky';
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>;
  noPaddingTop?: boolean;
  refreshControl?: ReactNode;
  hasTabBar?: boolean;
}>;

import { useToast } from '@/contexts/ToastContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppText } from '../common/AppText';

export function AppShell({
  children,
  scrollable = false,
  header,
  footer,
  footerMode = 'flow',
  contentStyle,
  edges = ['top', 'bottom'],
  noPaddingTop = false,
  refreshControl,
  hasTabBar = false,
}: AppShellProps) {
  const { isOffline } = useToast();
  const bannerY = useSharedValue(-40);
  const stickyFooter = Boolean(footer) && footerMode === 'sticky';

  useEffect(() => {
    bannerY.value = withSpring(isOffline ? 0 : -40, { damping: 15, stiffness: 100 });
  }, [isOffline]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
  }));

  const body = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollBody, 
        stickyFooter ? styles.scrollBodyWithStickyFooter : undefined,
        hasTabBar ? styles.scrollBodyWithTabBar : undefined
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl as any}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[
      styles.body, 
      stickyFooter ? styles.bodyWithStickyFooter : undefined,
      hasTabBar ? styles.bodyWithTabBar : undefined
    ]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <StatusBar style="light" translucent={false} backgroundColor={theme.colors.background} />
      <View style={styles.centered}>
        <View style={[styles.phoneShell, !noPaddingTop && styles.topPadding, contentStyle]}>
          <Animated.View style={[styles.offlineBanner, bannerStyle]} pointerEvents="none">
             <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>WORKING OFFLINE</AppText>
          </Animated.View>
          {header}
          {body}
          {stickyFooter && (
            <View style={styles.stickyFooterWrap} pointerEvents='box-none'>
              {footer}
            </View>
          )}
          {!stickyFooter && footer}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  phoneShell: {
    flex: 1,
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    height: '100%',
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  topPadding: {
    paddingTop: theme.spacing.lg,
  },
  body: {
    flex: 1,
    zIndex: 1,
  },
  bodyWithStickyFooter: {
    paddingBottom: 120,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollBodyWithStickyFooter: {
    paddingBottom: 120,
  },
  bodyWithTabBar: {
    paddingBottom: 120,
  },
  scrollBodyWithTabBar: {
    paddingBottom: 120,
  },
  stickyFooterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 10,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: theme.colors.primary,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
});
