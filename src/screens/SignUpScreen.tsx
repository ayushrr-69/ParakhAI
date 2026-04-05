import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { FormInput } from '@/components/common/FormInput';
import { AppShell } from '@/components/layout/AppShell';
import { DeviceStatusBar } from '@/components/system/DeviceStatusBar';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  return (
    <AppShell scrollable header={<DeviceStatusBar />}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.heading}>
          <AppText variant='hero' weight='semibold'>
            Create Your NutriAI Account
          </AppText>
          <AppText variant='bodyLarge'>Build your athlete profile and start tracking smarter.</AppText>
        </View>
        <View style={styles.form}>
          <FormInput label='Full Name' placeholder='Enter your full name' />
          <FormInput label='Email' placeholder='Enter your email' />
          <FormInput label='Password' placeholder='Create a password' secureTextEntry />
          <AppButton label='Sign Up' onPress={() => navigation.replace(routes.home)} />
        </View>
        <Pressable onPress={() => navigation.navigate(routes.login)} style={styles.authLink}>
          <AppText variant='bodyLarge'>
            Already have an account? <AppText variant='bodyLarge' color={theme.colors.primary} weight='semibold'>Log In</AppText>
          </AppText>
        </Pressable>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  heading: {
    gap: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.md,
  },
  authLink: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
