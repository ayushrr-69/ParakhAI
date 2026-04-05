import { useNavigation, useRoute } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AnalysisIcon, HomeIcon, NotificationsIcon, ProfileIcon, TestsIcon } from '@/components/navigation/NavIcons';
import { placeholderRouteContent, routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

const navItems = [
  { key: routes.home, icon: HomeIcon },
  { key: routes.analysis, icon: AnalysisIcon },
  { key: routes.tests, icon: TestsIcon },
  { key: routes.notifications, icon: NotificationsIcon },
  { key: routes.profile, icon: ProfileIcon },
] as const;

export function BottomNav() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  const navigateToPlaceholder = (target: 'Tests' | 'Notifications' | 'Profile') => {
    navigation.navigate(target, { content: placeholderRouteContent[target] });
  };

  return (
    <View style={styles.container}>
      {navItems.map(({ key, icon: Icon }) => {
        const active = route.name === key;

        const onPress = () => {
          if (key === routes.home) {
            navigation.navigate(routes.home);
            return;
          }

          if (key === routes.analysis) {
            navigation.navigate(routes.analysis);
            return;
          }

          if (key === routes.tests) {
            navigateToPlaceholder('Tests');
            return;
          }

          if (key === routes.notifications) {
            navigateToPlaceholder('Notifications');
            return;
          }

          navigateToPlaceholder('Profile');
        };

        return (
          <Pressable key={key} onPress={onPress} style={({ pressed }) => [styles.iconButton, active && styles.activeButton, pressed && styles.pressed]}>
            <Icon active={active} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 57,
    marginBottom: theme.spacing.lg,
    height: theme.layout.navHeight,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cardDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
});
