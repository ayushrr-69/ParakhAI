import { PropsWithChildren, ReactNode } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '@/theme';

type AppShellProps = PropsWithChildren<{
  scrollable?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  footerMode?: 'flow' | 'sticky';
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function AppShell({
  children,
  scrollable = false,
  header,
  footer,
  footerMode = 'flow',
  contentStyle,
}: AppShellProps) {
  const stickyFooter = Boolean(footer) && footerMode === 'sticky';

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollBody, stickyFooter ? styles.scrollBodyWithStickyFooter : undefined]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, stickyFooter ? styles.bodyWithStickyFooter : undefined]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>
        <View style={[styles.phoneShell, contentStyle]}>
          {header}
          {body}
          {stickyFooter ? <View style={styles.stickyFooter}>{footer}</View> : footer}
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
  },
  phoneShell: {
    flex: 1,
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    minHeight: Platform.select({ web: theme.layout.phoneMinHeight, default: undefined }),
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
  },
  bodyWithStickyFooter: {
    paddingBottom: theme.layout.navHeight + theme.spacing.xxxl,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollBodyWithStickyFooter: {
    paddingBottom: theme.layout.navHeight + theme.spacing.xxxl,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
