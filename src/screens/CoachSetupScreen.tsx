import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { validation } from '@/utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachSetup'>;

const { width } = Dimensions.get('window');

const CATEGORIES = [
  // Sports Focus
  'Football', 'Cricket', 'Basketball', 'Martial Arts', 
  'Tennis', 'Athletics', 'Swimming', 'Combat Sports',
  // Technical Focus
  'Strength & Conditioning', 'Explosive Power', 'Agility', 'Endurance', 
  'Recovery Focus', 'Mobility', 'Core Stability', 'Biomechanics',
  'Nutrition', 'Psychology'
];

const EXPERTISE_LEVELS = ['Intern', 'Certified', 'Pro', 'Elite', 'Legend'];

export function CoachSetupScreen({ navigation }: Props) {
  const { profile, updateFullProfile, refreshProfile } = useAuth();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(profile?.specialties || []);
  const [expertiseLevel, setExpertiseLevel] = useState(profile?.expertise_level || 'Certified');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const totalSteps = 3;

  const validateStep = async (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 0) {
      if (!validation.fullName(fullName)) {
        newErrors.fullName = 'Please enter a valid name (2-50 letters)';
      }
      
      if (!validation.username(username)) {
        newErrors.username = '3-15 characters, alphanumeric and underscores only';
      } else {
        setIsCheckingUsername(true);
        const available = await validation.isUsernameAvailable(username, profile?.id);
        setIsCheckingUsername(false);
        if (!available) {
          newErrors.username = 'Username is already taken';
        }
      }
    } else if (currentStep === 1) {
      if (selectedSpecialties.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one specialty');
        return false;
      }
    } else if (currentStep === 2) {
      if (bio.trim().length < 20) {
        newErrors.bio = 'Bio must be at least 20 characters for a professional profile';
      } else if (bio.trim().length > 500) {
        newErrors.bio = 'Bio is too long (max 500 characters)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    Keyboard.dismiss();
    const isValid = await validateStep(step);
    if (!isValid) return;

    if (step < totalSteps - 1) {
      Animated.timing(slideAnim, {
        toValue: -(width * (step + 1)),
        duration: 400,
        useNativeDriver: true,
      }).start(() => setStep(step + 1));
    } else {
      handleFinalSave();
    }
  };

  const prevStep = () => {
    Keyboard.dismiss();
    if (step > 0) {
      Animated.timing(slideAnim, {
        toValue: -(width * (step - 1)),
        duration: 400,
        useNativeDriver: true,
      }).start(() => setStep(step - 1));
    }
  };

  const handleFinalSave = async () => {
    Keyboard.dismiss();
    const isValid = await validateStep(step);
    if (!isValid) return;

    setLoading(true);
    try {
      const { error } = await updateFullProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        specialties: selectedSpecialties,
        expertise_level: expertiseLevel,
        bio: bio.trim(),
        location: location.trim(),
      });
      
      if (error) throw error;
      
      await refreshProfile();
      navigation.replace(routes.coachDashboard);
    } catch (e: any) {
      console.error('[CoachSetup] Save error:', e);
      setLoading(false);
      Alert.alert("Setup Error", e.message || "Could not complete setup.");
    }
  };

  const toggleSpecialty = (item: string) => {
    if (selectedSpecialties.includes(item)) {
      setSelectedSpecialties(selectedSpecialties.filter(i => i !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const isStepValid = () => {
    if (step === 0) return fullName.trim().length > 2 && username.trim().length > 3;
    if (step === 1) return selectedSpecialties.length > 0;
    if (step === 2) return bio.trim().length > 10;
    return true;
  };

  const renderProgress = () => (
    <View style={styles.progressWrapper}>
      <View style={styles.progressBackground}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { width: `${((step + 1) / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <AppText variant="tiny" weight="bold" color={theme.colors.placeholder} style={styles.stepCounter}>
        COACH ONBOARDING: {step + 1} / {totalSteps}
      </AppText>
    </View>
  );

  return (
    <AppShell 
      footerMode="sticky" 
      noPaddingTop={true}
      footer={(
        <View style={styles.footer}>
          <Pressable 
            onPress={nextStep}
            disabled={!isStepValid() || loading || isCheckingUsername}
            style={[
              styles.nextBtn,
              (!isStepValid() || loading || isCheckingUsername) && styles.nextBtnDisabled
            ]}
          >
            {(loading || isCheckingUsername) ? (
              <ActivityIndicator color={theme.colors.textDark} />
            ) : (
              <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                {step === totalSteps - 1 ? "LAUNCH DASHBOARD" : "CONTINUE"}
              </AppText>
            )}
          </Pressable>
        </View>
      )}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={prevStep} style={[styles.backBtn, step === 0 && { opacity: 0 }]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={theme.colors.surface} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          {renderProgress()}
          <View style={{ width: 44 }} />
        </View>

        <Animated.View style={[styles.slider, { width: width * totalSteps, transform: [{ translateX: slideAnim }] }]}>
          {/* STEP 0: IDENTITY */}
          <View style={[styles.slide, { width }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideContent} keyboardShouldPersistTaps="handled">
              <View style={styles.stepHeader}>
                <AppText variant="hero" weight="bold" style={styles.title}>Professional ID</AppText>
                <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>Tell the world who will be coaching them.</AppText>
              </View>
              
              <View style={styles.inputGroup}>
                <AppText variant="bodySmall" weight="bold" color={errors.fullName ? theme.colors.error : theme.colors.placeholder} style={styles.label}>FULL NAME</AppText>
                <View style={[
                  styles.inputContainer, 
                  focusedField === 'name' && styles.inputContainerFocused,
                  errors.fullName && styles.inputContainerError
                ]}>
                  <TextInput 
                    style={styles.input}
                    placeholder="Coach name"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    maxLength={50}
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      if (errors.fullName) setErrors(prev => {
                        const { fullName, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.fullName && <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{errors.fullName}</AppText>}
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="bodySmall" weight="bold" color={errors.username ? theme.colors.error : theme.colors.placeholder} style={styles.label}>HANDLE / USERNAME</AppText>
                <View style={[
                  styles.inputContainer, 
                  focusedField === 'user' && styles.inputContainerFocused,
                  errors.username && styles.inputContainerError
                ]}>
                  <TextInput 
                    style={styles.input}
                    placeholder="@coach_handle"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={username}
                    onChangeText={(t) => {
                      setUsername(t);
                      if (errors.username) setErrors(prev => {
                        const { username, ...rest } = prev;
                        return rest;
                      });
                    }}
                    autoCapitalize="none"
                    maxLength={15}
                    onFocus={() => setFocusedField('user')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.username && <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{errors.username}</AppText>}
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.label}>PHYSICAL LOCATION</AppText>
                <View style={[
                  styles.inputContainer, 
                  focusedField === 'loc' && styles.inputContainerFocused
                ]}>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. Mumbai, India"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    maxLength={100}
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => setFocusedField('loc')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </ScrollView>
          </View>

          {/* STEP 1: EXPERTISE */}
          <View style={[styles.slide, { width }]}>
            <View style={styles.stepHeader}>
              <AppText variant="hero" weight="bold" style={styles.title}>Your Domain</AppText>
              <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>Select the sports and technical skills you master.</AppText>
            </View>
            <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => toggleSpecialty(cat)} style={[styles.chip, selectedSpecialties.includes(cat) && styles.chipActive]}>
                  <AppText variant="body" weight="semibold" color={selectedSpecialties.includes(cat) ? theme.colors.textDark : theme.colors.surface}>{cat}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* STEP 2: BIO & LEVEL */}
          <View style={[styles.slide, { width }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideContent} keyboardShouldPersistTaps="handled">
              <View style={styles.stepHeader}>
                <AppText variant="hero" weight="bold" style={styles.title}>The Pitch</AppText>
                <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>A short bio to convince athletes to join you.</AppText>
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.label}>EXPERTISE LEVEL</AppText>
                <View style={styles.levelRow}>
                  {EXPERTISE_LEVELS.map(level => (
                    <Pressable 
                      key={level} 
                      onPress={() => setExpertiseLevel(level)} 
                      style={[styles.levelBtn, expertiseLevel === level && styles.levelBtnActive]}
                    >
                      <AppText variant="tiny" weight="bold" color={expertiseLevel === level ? theme.colors.textDark : theme.colors.placeholder}>{level.toUpperCase()}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="bodySmall" weight="bold" color={errors.bio ? theme.colors.error : theme.colors.placeholder} style={styles.label}>BIO</AppText>
                <View style={[
                  styles.inputContainer, 
                  styles.bioContainer, 
                  focusedField === 'bio' && styles.inputContainerFocused,
                  errors.bio && styles.inputContainerError
                ]}>
                  <TextInput 
                    style={[styles.input, styles.bioInput]}
                    placeholder="I help athletes reach their peak performance by..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={bio}
                    onChangeText={(t) => {
                      setBio(t);
                      if (errors.bio) setErrors(prev => {
                        const { bio, ...rest } = prev;
                        return rest;
                      });
                    }}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.bio && <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{errors.bio}</AppText>}
              </View>
            </ScrollView>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: { flex: 1, alignItems: 'center', gap: 8 },
  progressBackground: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary },
  stepCounter: { letterSpacing: 1.5 },
  slider: { flexDirection: 'row', flex: 1 },
  slide: { },
  slideContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: 120,
  },
  stepHeader: {
    marginBottom: 40,
    gap: 8,
    paddingHorizontal: theme.spacing.xl,
  },
  title: { fontSize: 40, lineHeight: 48, color: theme.colors.surface },
  subtitle: { lineHeight: 24, fontSize: 16 },
  inputGroup: { marginBottom: 32, gap: 10 },
  label: { letterSpacing: 1.5, marginLeft: 4 },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    fontSize: 20,
    color: theme.colors.surface,
    height: 56,
  },
  bioContainer: { height: 160, paddingTop: 12 },
  bioInput: { height: 130, textAlignVertical: 'top' },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 6,
  },
  levelBtn: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  levelBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 140,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  footer: { width: '100%', paddingHorizontal: theme.spacing.lg, paddingBottom: 20 },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  nextBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', shadowOpacity: 0, elevation: 0 },
});
