import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { theme } from '@/theme';

type AppTextProps = PropsWithChildren<{
  variant?: keyof typeof theme.typography;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold';
  style?: StyleProp<TextStyle>;
}>;

export function AppText({
  children,
  variant = 'body',
  color = theme.colors.textPrimary,
  weight = 'regular',
  style,
}: AppTextProps) {
  return <Text style={[styles.base, theme.typography[variant], styles[weight], { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.fontFamily.regular,
  },
  regular: {
    fontFamily: theme.fontFamily.regular,
  },
  medium: {
    fontFamily: theme.fontFamily.medium,
  },
  semibold: {
    fontFamily: theme.fontFamily.semibold,
  },
});
