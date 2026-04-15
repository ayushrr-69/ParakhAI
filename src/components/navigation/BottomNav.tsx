import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { Pressable, StyleSheet, View, Animated } from 'react-native';
import { 
  AnalysisIcon, 
  ArcheryIcon, 
  CoachIcon, 
  HomeIcon, 
  NotificationsIcon, 
  ProfileIcon, 
  TestsIcon,
  InboxIcon,
  ReportsIcon 
} from '@/components/navigation/NavIcons';
import { theme } from '@/theme';

const navItems = [
  // Athlete Tabs
  { key: 'Home', icon: HomeIcon, label: 'Home' },
  { key: 'Analysis', icon: AnalysisIcon, label: 'Analysis' },
  { key: 'AthleteCoach', icon: CoachIcon, label: 'Coach' },
  { key: 'Tests', icon: TestsIcon, label: 'Tests' },
  { key: 'Training', icon: ArcheryIcon, label: 'Training' },
  // Coach Tabs
  { key: 'CoachHome', icon: HomeIcon, label: 'Home' },
  { key: 'CoachInbox', icon: InboxIcon, label: 'Inbox' },
  { key: 'CoachAthletes', icon: CoachIcon, label: 'Athletes' },
  { key: 'CoachReports', icon: ReportsIcon, label: 'Reports' },
] as const;

export function BottomNav({ state, navigation, descriptors }: MaterialTopTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const active = state.index === index;
        const item = navItems.find((ni) => ni.key === route.name) || navItems[0];
        const Icon = item.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!active && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole='button'
            accessibilityState={active ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [styles.iconButton, active && styles.activeButton, pressed && styles.pressed]}
          >
            <Icon active={active} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 'auto', // Dynamic width based on content
    height: theme.layout.navHeight,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(35, 34, 32, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 1000,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted, // Restore previous aesthetics
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

