import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { roleOptions } from '@/constants/content';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SignInAs'>;

export function SignInAsScreen({ navigation }: Props) {
  return (
    <AppShell contentStyle={{ backgroundColor: theme.colors.lavender }}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <AppText variant='hero' weight='semibold' color={theme.colors.textDark}>
            Choose your entry point
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.nearBlack} style={styles.subtitle}>
            Start as an athlete or as a coach. The current app flow keeps both paths aligned.
          </AppText>
        </View>
        <View style={styles.cards}>
          {roleOptions.map((option) => (
            <Pressable key={option.key} onPress={() => navigation.navigate(routes.login)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={[styles.imageArea, { backgroundColor: option.imageAccent }]}>
                <View style={styles.imageOverlay} />
              </View>
              <View style={styles.labelBar}>
                <AppText variant='title' weight='semibold' color={theme.colors.textPrimary}>
                  {option.title}
                </AppText>
                <AppText variant='bodySmall' color={theme.colors.textPrimary}>
                  {option.key === 'athlete' ? 'Track your sessions and results.' : 'Review athlete performance and progress.'}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  headerBlock: {
    gap: theme.spacing.xs,
  },
  subtitle: {
    maxWidth: 310,
  },
  cards: {
    gap: theme.spacing.lg,
  },
  card: {
    overflow: 'hidden',
    borderRadius: theme.radii.largeCard,
  },
  imageArea: {
    height: 250,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  labelBar: {
    backgroundColor: theme.colors.labelOverlay,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 4,
  },
  pressed: {
    opacity: 0.88,
  },
});
