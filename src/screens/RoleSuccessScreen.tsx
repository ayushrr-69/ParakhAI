import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSuccess'>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function RoleSuccessScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { refreshProfile, updateProfileState } = useAuth();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  
  const [btnLoading, setBtnLoading] = useState(false);
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    // 1. Success Icon popping in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Pulse effect for the ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        })
      ])
    ).start();

    // 3. Text appearing
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // 4. Show button after animation
    const btnTimer = setTimeout(() => {
      setShowBtn(true);
    }, 1500);

    return () => clearTimeout(btnTimer);
  }, []);

  const handleContinue = async () => {
    setBtnLoading(true);
    try {
      // 1. Instantly update local state
      updateProfileState({ role });
      
      // 2. Refresh full profile in background
      await refreshProfile();

      // 3. Explicitly force navigation to ensure we don't get stuck
      // AppNavigator switch is usually automatic, but reset is a foolproof fallback
      setTimeout(() => {
        if (role === 'athlete') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: routes.coachDashboard as any }],
          });
        }
      }, 100);
    } catch (e) {
      console.error(e);
      setBtnLoading(false);
    }
  };

  const roleTitle = role === 'athlete' ? 'Athlete Profile Activated' : 'Coach HQ Registered';
  const roleSubtitle = role === 'athlete' 
    ? 'Your AI training journey begins now.' 
    : 'Professional tools are being prepared.';

  return (
    <AppShell footerMode='hidden' contentStyle={{ backgroundColor: '#000' }}>
      <View style={styles.container}>
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }] }]} />
          <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
              <Circle cx="60" cy="60" r="54" stroke={theme.colors.primary} strokeWidth="4" />
              <Path 
                d="M36 60L52 76L84 44" 
                stroke={theme.colors.primary} 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
          </Animated.View>
        </View>

        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <AppText variant='title' weight='bold' style={styles.title}>
            {roleTitle}
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.placeholder} style={styles.subtitle}>
            {roleSubtitle}
          </AppText>
        </Animated.View>

        {showBtn && (
          <View style={styles.footer}>
            <Pressable 
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.continueBtn,
                pressed && { opacity: 0.7 }
              ]}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <AppText variant='bodyLarge' weight='bold' color={theme.colors.primary}>
                  GO TO DASHBOARD →
                </AppText>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255, 82, 82, 0.2)', // ParakhAI Primary with low opacity
  },
  successCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    right: 40,
  },
  continueBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
});
