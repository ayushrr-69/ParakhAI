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
}

export function FormInput({ label, placeholder, rightAccessory, error, errorMessage, ...rest }: FormInputProps) {
  return (
    <View style={styles.container}>
      <AppText variant='bodyLarge' weight='medium' color={error ? theme.colors.error : theme.colors.textPrimary}>
        {label}
      </AppText>
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
  errorText: {
    marginTop: 2,
    marginLeft: 4,
  },
});
