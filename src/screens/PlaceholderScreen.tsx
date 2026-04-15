import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { BottomNav } from '@/components/navigation/BottomNav';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type PlaceholderRoute = 'Tests' | 'Notifications' | 'Profile' | 'Settings' | 'More';
type Props = NativeStackScreenProps<RootStackParamList, PlaceholderRoute>;

import Svg, { Path, Rect } from 'react-native-svg';

export function PlaceholderScreen({ navigation, route }: Props) {
  const content = route.params.content;
  const canGoBack = navigation.canGoBack();

  return (
    <AppShell scrollable hasTabBar={true} footerMode='sticky'>
      <View style={styles.container}>
        <View style={styles.header}>
          {canGoBack && (
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={theme.colors.nearBlack} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          )}
        </View>

        <View style={styles.brandMark}>
          <View style={[styles.brandChip, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.brandChip, { backgroundColor: theme.colors.success }]} />
          <View style={[styles.brandChip, { backgroundColor: theme.colors.lavender }]} />
        </View>
        <AppText variant='hero' weight='semibold' style={{ textAlign: 'center' }}>{content.title}</AppText>
        <AppText variant='bodyLarge' color={theme.colors.placeholder} style={styles.message}>{content.message}</AppText>
        {route.name === 'Profile' ? (
          <Pressable onPress={() => navigation.navigate('More', { content: { title: 'More', message: 'More athlete tools will appear here.' } })} style={styles.inlineButton}>
            <AppText variant='bodyLarge' weight='semibold' color={theme.colors.primary}>Open More</AppText>
          </Pressable>
        ) : null}
      </View>
    </AppShell>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    height: 60,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandMark: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  brandChip: {
    width: 18,
    height: 54,
    borderRadius: theme.radii.card,
  },
  message: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  inlineButton: {
    marginTop: theme.spacing.lg,
  },
});

