import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@/theme';

type BackButtonProps = {
  onPress: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View>
        <Svg width={20} height={20} viewBox='0 0 20 20' fill='none'>
          <Path
            d='M11.667 4.167L5.833 10l5.834 5.833'
            stroke={theme.colors.surface}
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.nearBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
