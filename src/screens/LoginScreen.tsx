import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { FormInput } from '@/components/common/FormInput';
import { AppShell } from '@/components/layout/AppShell';
import { routes } from '@/constants/routes';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Navigation happens automatically via AuthContext update
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Google Login Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell scrollable>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.heading}>
          <AppText variant='hero' weight='semibold'>
            Welcome back to ParakhAI
          </AppText>
          <AppText variant='bodyLarge'>Continue into your training dashboard and analysis tools.</AppText>
        </View>
        <View style={styles.form}>
          <FormInput 
            label='Email' 
            placeholder='Enter your email' 
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <FormInput 
            label='Password' 
            placeholder='Enter your password' 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.inlineLink} onPress={() => Alert.alert('Reset Password', 'Feature coming soon!')}>
            <AppText variant='body' color={theme.colors.primary} weight='medium'>
              Forgot Password?
            </AppText>
          </Pressable>
          <AppButton 
            label={loading ? 'Logging in...' : 'Log In'} 
            onPress={handleLogin} 
            disabled={loading}
          />
        </View>
        <View style={styles.socialStack}>
          <AppButton label='Continue with Google' onPress={handleGoogleLogin} variant='secondary' />
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
