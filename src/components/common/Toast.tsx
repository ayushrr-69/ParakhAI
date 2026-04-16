import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useToast, ToastType } from '@/contexts/ToastContext';
import { AppText } from './AppText';
import { theme } from '@/theme';
import Svg, { Path, Circle } from 'react-native-svg';

const TOAST_MARGIN = 20;

export function Toast() {
  const { activeToast, hideToast } = useToast();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (activeToast) {
      // Trigger Haptics
      if (activeToast.type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (activeToast.type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(100, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [activeToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!activeToast && opacity.value === 0) return null;

  const getIcon = () => {
    switch (activeToast?.type) {
      case 'success':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={theme.colors.success} strokeWidth="2" />
            <Path d="M8 12l3 3 5-5" stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case 'error':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={theme.colors.error} strokeWidth="2" />
            <Path d="M12 8v4M12 16h.01" stroke={theme.colors.error} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      default:
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={theme.colors.primary} strokeWidth="2" />
            <Path d="M12 16v-4M12 8h.01" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
    }
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable 
          style={styles.content} 
          onPress={hideToast}
        >
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View style={styles.textContainer}>
            <AppText variant="bodySmall" weight="semibold" color={theme.colors.textPrimary}>
              {activeToast?.title}
            </AppText>
            {activeToast?.message && (
              <AppText variant="tiny" color={theme.colors.placeholder} style={styles.message}>
                {activeToast.message}
              </AppText>
            )}
          </View>
          {activeToast?.action && (
            <Pressable 
              style={styles.actionBtn} 
              onPress={() => {
                activeToast.action?.onPress();
                hideToast();
              }}
            >
              <AppText variant="tiny" weight="bold" color={theme.colors.primary}>
                {activeToast.action.label.toUpperCase()}
              </AppText>
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80, // Above tab bar if present
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 24,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#232220', // Near black with slight warmth
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    marginTop: 2,
    lineHeight: 14,
  },
  actionBtn: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 90, 22, 0.1)',
    borderRadius: 8,
  }
});
