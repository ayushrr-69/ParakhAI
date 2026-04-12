import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'circular';
  leftIcon?: ReactNode;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = 'primary', leftIcon, disabled }: AppButtonProps) {
  const isCircular = variant === 'circular';

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={({ pressed }) => [
        styles.base, 
        styles[variant], 
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <View style={styles.row}>
        {leftIcon}
        {!isCircular ? (
          <AppText variant='bodyLarge' weight='semibold' color={variant === 'secondary' ? theme.colors.surface : theme.colors.textDark}>
            {label}
          </AppText>
        ) : (
          <AppText variant='title' weight='semibold' color={theme.colors.surface}>
            {label}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  primary: {
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cardDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  circular: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.nearBlack,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.5,
  },
});
