import React from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { placeholderRouteContent, routes } from '@/constants/routes';
import Svg, { Path } from 'react-native-svg';

interface CoachHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
  variant?: 'heading' | 'title';
}

export function CoachHeader({ 
  title, 
  subtitle, 
  showAvatar = false,
  showNotifications = false,
  variant = 'heading' 
}: CoachHeaderProps) {
  const { user, profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const initial = profile?.full_name?.charAt(0).toUpperCase() || 'C';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {subtitle && (
          <AppText variant="bodyLarge" color={theme.colors.placeholder}>{subtitle}</AppText>
        )}
        <AppText variant={variant} weight="semibold" numberOfLines={1}>{title}</AppText>
      </View>
      
      <View style={styles.actions}>
        {showNotifications && (
          <Pressable 
            onPress={() => navigation.navigate(routes.notifications, { content: placeholderRouteContent[routes.notifications] })}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={theme.colors.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}

        {showAvatar && (
          <Pressable 
            onPress={() => navigation.navigate(routes.coachProfile)}
            style={({ pressed }) => [
              styles.avatarBtn,
              pressed && { opacity: 0.7 }
            ]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarMini} />
            ) : (
              <View style={[styles.avatarMini, styles.avatarInitial]}>
                 <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>{initial}</AppText>
              </View>
            )}
            <View style={styles.onlineStatus} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 20,
    marginBottom: theme.spacing.lg,
    minHeight: 80,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarBtn: {
    position: 'relative',
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full, // Circle to match athlete
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarInitial: {
    backgroundColor: theme.colors.lavender,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
