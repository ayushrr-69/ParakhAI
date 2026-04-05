import { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

type FormInputProps = {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  rightAccessory?: ReactNode;
};

export function FormInput({ label, placeholder, secureTextEntry, rightAccessory }: FormInputProps) {
  return (
    <View style={styles.container}>
      <AppText variant='bodyLarge' weight='medium'>
        {label}
      </AppText>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry={secureTextEntry}
          style={styles.input}
        />
        {rightAccessory}
      </View>
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
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.typography.bodyLarge.fontSize,
  },
});
