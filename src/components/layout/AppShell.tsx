import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
}>;

export function AppShell({
  children,
  scrollable = false,
  header,
  footer,
  footerMode = 'flow',
  contentStyle,
  edges = ['top', 'bottom'],
  noPaddingTop = false,
}: AppShellProps) {
  const stickyFooter = Boolean(footer) && footerMode === 'sticky';

  const body = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollBody, stickyFooter ? styles.scrollBodyWithStickyFooter : undefined]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, stickyFooter ? styles.bodyWithStickyFooter : undefined]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={styles.centered}>
        <View style={[styles.phoneShell, !noPaddingTop && styles.topPadding, contentStyle]}>
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


});



