import { colors } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';
import { fontFamily, typography } from './typography';

export const theme = {
  colors,
  spacing,
  radii,
  fontFamily,
  typography,
  layout: {
    maxContentWidth: 428,
    screenPadding: spacing.lg,
    navHeight: 66,
    phoneMinHeight: 844,
  },
} as const;

export type AppTheme = typeof theme;
