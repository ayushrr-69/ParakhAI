import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { BottomNav } from '@/components/navigation/BottomNav';
import { DeviceStatusBar } from '@/components/system/DeviceStatusBar';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type PlaceholderRoute = 'Tests' | 'Notifications' | 'Profile' | 'Settings' | 'More';
type Props = NativeStackScreenProps<RootStackParamList, PlaceholderRoute>;

export function PlaceholderScreen({ navigation, route }: Props) {
  const content = route.params.content;

  return (
    <AppShell scrollable header={<DeviceStatusBar />} footer={<BottomNav />}>
      <View style={styles.container}>
        <View style={styles.brandMark}>
          <View style={[styles.brandChip, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.brandChip, { backgroundColor: theme.colors.success }]} />
          <View style={[styles.brandChip, { backgroundColor: theme.colors.lavender }]} />
        </View>
        <AppText variant='hero' weight='semibold'>{content.title}</AppText>
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
  container: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
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
