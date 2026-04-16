import { ReactNode } from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  placeholder: string;
  rightAccessory?: ReactNode;
  error?: boolean;
  errorMessage?: string;
  strength?: number; // 0 to 4
}

export function FormInput({ label, placeholder, rightAccessory, error, errorMessage, strength, ...rest }: FormInputProps) {
  const getStrengthColor = () => {
    if (!strength) return 'transparent';
    if (strength <= 1) return theme.colors.error;
    if (strength === 2) return theme.colors.yellow;
    if (strength === 3) return theme.colors.primary;
    return theme.colors.success;
  };

  const getStrengthLabel = () => {
    if (!strength) return '';
    if (strength <= 1) return 'WEAK';
    if (strength === 2) return 'FAIR';
    if (strength === 3) return 'GOOD';
    return 'STRONG';
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant='bodyLarge' weight='medium' color={error ? theme.colors.error : theme.colors.textPrimary}>
          {label}
        </AppText>
        {strength !== undefined && strength > 0 && (
          <AppText variant='tiny' weight='bold' color={getStrengthColor()}>
            {getStrengthLabel()}
          </AppText>
        )}
      </View>
      <View style={[
        styles.inputWrapper,
        error && styles.inputWrapperError
      ]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          {...rest}
        />
        {rightAccessory}
      </View>
      
      {strength !== undefined && (
        <View style={styles.strengthBarContainer}>
          {[1, 2, 3, 4].map((step) => (
            <View 
              key={step} 
              style={[
                styles.strengthStep, 
                step <= strength && { backgroundColor: getStrengthColor() }
              ]} 
            />
          ))}
        </View>
      )}

      {error && errorMessage && (
        <AppText variant='bodySmall' color={theme.colors.error} style={styles.errorText}>
          {errorMessage}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  inputWrapper: {
    minHeight: 56,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.typography.bodyLarge.fontSize,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strengthStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
