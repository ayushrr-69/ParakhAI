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

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // Navigation happens automatically via AuthContext update
      } else {
        Alert.alert('Verify Email', 'Check your inbox to verify your account!');
        navigation.navigate(routes.login);
      }
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
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
            Create your ParakhAI account
          </AppText>
          <AppText variant='bodyLarge'>Set up your profile and start tracking your performance journey.</AppText>
        </View>
        <View style={styles.form}>
          <FormInput 
            label='Full Name' 
            placeholder='Enter your full name' 
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors(prev => {
                const { fullName, ...rest } = prev;
                return rest;
              });
            }}
            error={!!errors.fullName}
            errorMessage={errors.fullName}
          />
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
            placeholder='Create a password' 
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
          <AppButton 
            label={loading ? 'Creating account...' : 'Sign Up'} 
            onPress={handleSignUp} 
            disabled={loading}
          />
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
