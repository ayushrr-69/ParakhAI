import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { onboardingSlides } from '@/constants/content';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

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
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];
  const isLastSlide = index === onboardingSlides.length - 1;
  const dots = useMemo(() => onboardingSlides.map((item) => item.key), []);

  const onNext = () => {
    if (isLastSlide) {
      navigation.navigate(routes.signInAs);
      return;
    }

    setIndex((current) => current + 1);
  };

  return (
    <AppShell contentStyle={{ backgroundColor: slide.backgroundColor }}>
      <View style={styles.container}>
        <View style={styles.illustrationContainer}>
          <SlideIllustration accent={slide.accent} />
        </View>
        <View style={styles.bottomPanel}>
          <AppText variant='hero' weight='semibold' color={theme.colors.textDark}>
            {slide.title}
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.nearBlack} style={styles.subtitle}>
            {slide.subtitle}
          </AppText>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {dots.map((dot, dotIndex) => (
                <Pressable key={dot} onPress={() => setIndex(dotIndex)} style={[styles.dot, dotIndex === index && styles.activeDot]} />
              ))}
            </View>
            <AppButton label='>' onPress={onNext} variant='circular' />
          </View>
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
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanel: {
    gap: theme.spacing.md,
  },
  subtitle: {
    maxWidth: 300,
  },
  footer: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(18,18,18,0.24)',
  },
  activeDot: {
    width: 26,
    backgroundColor: theme.colors.nearBlack,
  },
});
