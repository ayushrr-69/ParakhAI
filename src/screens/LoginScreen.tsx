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
import { validation } from '@/utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signInWithGoogle } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!validation.email(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
    if (loading) return;
    
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Don't show alert for cancelled sign-ins
      if (error.code === '7' || error.message?.includes('cancelled')) return;

      // Ensure activity transition is complete before alerting
      setTimeout(() => {
        Alert.alert(
          'Google Login Error',
          'Could not authenticate with Google. This can sometimes happen if common Google services are still warming up. Please try again in a moment.'
        );
      }, 800);
    } finally {
      // Keep loading on for a bit longer to allow for navigation or cleanup
      setTimeout(() => setLoading(false), 2000);
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
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors(prev => {
                const { email, ...rest } = prev;
                return rest;
              });
            }}
            error={!!errors.email}
            errorMessage={errors.email}
          />
          <FormInput 
            label='Password' 
            placeholder='Enter your password' 
            secureTextEntry 
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors(prev => {
                const { password, ...rest } = prev;
                return rest;
              });
            }}
            error={!!errors.password}
            errorMessage={errors.password}
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
