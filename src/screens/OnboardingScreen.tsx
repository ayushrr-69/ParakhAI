import React, { useRef } from 'react';
import { StyleSheet, View, Animated, FlatList, useWindowDimensions, Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { onboardingSlides } from '@/constants/content';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { OnboardingSlide } from '@/types/app';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const illustrationSize = 230;

function SlideIllustration({ accent }: { accent: 'purple' | 'green' | 'orange' }) {
  if (accent === 'green') {
    return (
      <Svg width={illustrationSize} height={illustrationSize} viewBox='0 0 230 230' fill='none'>
        <Circle cx={115} cy={115} r={90} fill='rgba(18,18,18,0.1)' />
        <Path d='M115 48 132 82l38 6-28 28 7 40-34-18-34 18 7-40-28-28 38-6 17-34Z' fill={theme.colors.nearBlack} />
      </Svg>
    );
  }

  if (accent === 'orange') {
    return (
      <Svg width={illustrationSize} height={illustrationSize} viewBox='0 0 230 230' fill='none'>
        <Rect x={40} y={44} width={150} height={150} rx={34} fill='rgba(18,18,18,0.12)' />
        <Path d='M64 155c16-42 40-63 72-63 12 0 23 3 30 8v55H64Z' fill={theme.colors.nearBlack} />
        <Path d='M82 120a26 26 0 1 1 52 0v35H82v-35Z' fill={theme.colors.surface} fillOpacity={0.45} />
        <Path d='M162 78a24 24 0 1 1 0 48V78Z' fill={theme.colors.surface} fillOpacity={0.45} />
      </Svg>
    );
  }

  return (
    <Svg width={illustrationSize} height={illustrationSize} viewBox='0 0 230 230' fill='none'>
      <Circle cx={115} cy={115} r={86} fill='rgba(18,18,18,0.1)' />
      <Path d='M88 145c14-56 38-85 73-85 7 0 14 1 20 3-10 13-17 30-21 52-4 22-17 43-39 63l-33-33Z' fill={theme.colors.nearBlack} />
      <Rect x={70} y={140} width={44} height={14} rx={7} transform='rotate(-42 70 140)' fill={theme.colors.surface} fillOpacity={0.5} />
    </Svg>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  // Background Interpolation across the 3 slides
  const backgroundColor = scrollX.interpolate({
    inputRange: onboardingSlides.map((_, i) => i * width),
    outputRange: onboardingSlides.map((slide) => slide.backgroundColor),
    extrapolate: 'clamp',
  });

  // Button Visibility Interpolation (Only show on last slide)
  const ctaOpacity = scrollX.interpolate({
    inputRange: [(onboardingSlides.length - 2) * width, (onboardingSlides.length - 1) * width],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        <View style={styles.topSpacer} />
        <View style={styles.illustrationContainer}>
          <SlideIllustration accent={item.accent} />
        </View>
        <View style={styles.bottomPanel}>
          <AppText variant='hero' weight='semibold' color={theme.colors.textDark}>
            {item.title}
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.nearBlack} style={styles.subtitle}>
            {item.subtitle}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <AppShell 
      footerMode='hidden' 
      contentStyle={{ backgroundColor: 'transparent' }}
      edges={['bottom']}
      noPaddingTop={true}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      
      <Animated.FlatList
        ref={slidesRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.key}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingSlides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 26, 10],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.24, 1, 0.24],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View 
                key={i.toString()} 
                style={[styles.dot, { width: dotWidth, opacity }]} 
              />
            );
          })}
        </View>

        <Animated.View style={{ opacity: ctaOpacity }}>
          <Pressable 
            onPress={() => navigation.navigate(routes.login)}
            style={({ pressed }) => [styles.minimalistCta, pressed && styles.pressed]}
          >
            <AppText variant='title' weight='bold' color={theme.colors.nearBlack}>
              CONTINUE
            </AppText>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={theme.colors.nearBlack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </Pressable>
        </Animated.View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 160,
  },
  topSpacer: {
    height: '27%', // Image starts near 32%
  },
  illustrationContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanel: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 80, // Increased to keep text at the same visual position
    gap: theme.spacing.md,
  },
  subtitle: {
    maxWidth: 320,
    lineHeight: 26,
    opacity: 0.8,
  },
  minimalistCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ translateX: 5 }],
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  pagination: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.nearBlack,
  },
});
