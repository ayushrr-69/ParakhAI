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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <AppShell scrollable header={<DeviceStatusBar />}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.heading}>
          <AppText variant='hero' weight='semibold'>
            Welcome Back to NutriAI
          </AppText>
          <AppText variant='bodyLarge'>Eat better. Get back on track.</AppText>
        </View>
        <View style={styles.form}>
          <FormInput label='Email' placeholder='Enter your email' />
          <FormInput label='Password' placeholder='Enter your password' secureTextEntry />
          <Pressable style={styles.inlineLink}>
            <AppText variant='body' color={theme.colors.primary} weight='medium'>
              Forgot Password?
            </AppText>
          </Pressable>
          <AppButton label='Log In' onPress={() => navigation.replace(routes.home)} />
        </View>
        <View style={styles.socialStack}>
          <AppButton label='Continue with Google' onPress={() => undefined} variant='secondary' />
          <AppButton label='Continue with Apple' onPress={() => undefined} variant='secondary' />
        </View>
        <Pressable onPress={() => navigation.navigate(routes.signUp)} style={styles.authLink}>
          <AppText variant='bodyLarge'>
            Don't have an account? <AppText variant='bodyLarge' color={theme.colors.primary} weight='semibold'>Sign Up</AppText>
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
  inlineLink: {
    alignSelf: 'flex-end',
  },
  socialStack: {
    gap: theme.spacing.md,
  },
  authLink: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
