import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const { width } = Dimensions.get('window');

const SPORTS = [
  'Football', 'Cricket', 'Basketball', 'Martial Arts', 
  'Tennis', 'Athletics', 'Swimming', 'Cycling', 
  'Boxing', 'Yoga', 'Combat Sports'
];

const GOALS = [
  'Strength', 'Explosive Power', 'Agility', 'Endurance', 
  'Weight Loss', 'Recovery Focus', 'Mobility', 
  'Consistency', 'Sprint Speed', 'Core Stability'
];

export function ProfileSetupScreen({ navigation }: Props) {
  const { profile, updateFullProfile } = useAuth();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Initialize state from existing profile if available (Edit Mode)
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [weight, setWeight] = useState(profile?.weight || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(profile?.pref_units || 'metric');
  
  // Split goals back into sports and targets if editing
  const initialSports = profile?.goals?.filter(g => SPORTS.includes(g)) || [];
  const initialGoals = profile?.goals?.filter(g => GOALS.includes(g)) || [];
  
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const step0ScrollRef = useRef<ScrollView>(null);
  const step1ScrollRef = useRef<ScrollView>(null);
  const totalSteps = 4;

  const nextStep = () => {
    Keyboard.dismiss();
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
    setLoading(true);
    try {
      const { error } = await updateFullProfile({
        full_name: fullName,
        username: username,
        weight: weight,
        height: height,
        pref_units: units,
        goals: [...selectedSports, ...selectedGoals],
      });
      if (error) throw error;
      
      // If editing, go back. If onboarding, AppNavigator handles it via username check.
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const toggleSelection = (item: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (state.includes(item)) {
      setState(state.filter(i => i !== item));
    } else {
      setState([...state, item]);
    }
  };

  const isStepValid = () => {
    if (step === 0) return fullName.length > 2 && username.length > 3;
    if (step === 1) return weight.length > 0 && height.length > 0;
    if (step === 2) return selectedSports.length > 0;
    if (step === 3) return selectedGoals.length > 0;
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
        STEP {step + 1} OF {totalSteps}
      </AppText>
    </View>
  );

  const renderInput = (label: string, value: string, onChange: (t: string) => void, placeholder: string, fieldId: string, props: any = {}) => (
    <View style={styles.inputGroup}>
      <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.label}>{label}</AppText>
      <View style={[
        styles.inputContainer,
        focusedField === fieldId && styles.inputContainerFocused
      ]}>
        <TextInput 
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(fieldId)}
          onBlur={() => setFocusedField(null)}
          {...props}
        />
      </View>
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
            disabled={!isStepValid() || loading}
            style={[
              styles.nextBtn,
              (!isStepValid() || loading) && styles.nextBtnDisabled
            ]}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textDark} />
            ) : (
              <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                {step === totalSteps - 1 ? "FINISH SETUP" : "NEXT STEP"}
              </AppText>
            )}
          </Pressable>
        </View>
      )}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
          {/* STEP 0: BIO */}
          <View style={[styles.slide, { width }]}>
            <ScrollView 
              ref={step0ScrollRef}
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.slideContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.stepHeader}>
                <AppText variant="hero" weight="bold" style={styles.title}>Who are you?</AppText>
                <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>Let's personalize your athlete profile.</AppText>
              </View>
              
              {renderInput("FULL NAME", fullName, setFullName, "John Doe", "name", {
                onFocus: () => {
                  setFocusedField('name');
                  step0ScrollRef.current?.scrollTo({ y: 0, animated: true });
                }
              })}
              {renderInput("USERNAME", username, setUsername, "@username", "user", { 
                autoCapitalize: 'none',
                onFocus: () => {
                  setFocusedField('user');
                  // Push up slightly more for the second field
                  setTimeout(() => {
                    step0ScrollRef.current?.scrollTo({ y: 80, animated: true });
                  }, 100);
                }
              })}
            </ScrollView>
          </View>

          {/* STEP 1: METRICS */}
          <View style={[styles.slide, { width }]}>
            <ScrollView 
              ref={step1ScrollRef}
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.slideContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.stepHeader}>
                <AppText variant="hero" weight="bold" style={styles.title}>The Vital Stats</AppText>
                <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>Used for calorie burn and power scaling.</AppText>
              </View>

              <View style={styles.unitToggle}>
                <Pressable 
                  onPress={() => setUnits('metric')}
                  style={[styles.unitBtn, units === 'metric' && styles.unitBtnActive]}
                >
                  <AppText variant="bodySmall" weight="bold" color={units === 'metric' ? theme.colors.textDark : theme.colors.placeholder}>METRIC</AppText>
                </Pressable>
                <Pressable 
                  onPress={() => setUnits('imperial')}
                  style={[styles.unitBtn, units === 'imperial' && styles.unitBtnActive]}
                >
                  <AppText variant="bodySmall" weight="bold" color={units === 'imperial' ? theme.colors.textDark : theme.colors.placeholder}>IMPERIAL</AppText>
                </Pressable>
              </View>

              <View style={styles.metricsRow}>
                <View style={{ flex: 1 }}>
                  {renderInput(`WEIGHT (${units === 'metric' ? 'KG' : 'LBS'})`, weight, setWeight, "00", "weight", { 
                    keyboardType: 'numeric',
                    onFocus: () => {
                      setFocusedField('weight');
                      setTimeout(() => {
                        step1ScrollRef.current?.scrollTo({ y: 120, animated: true });
                      }, 100);
                    }
                  })}
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  {renderInput(`HEIGHT (${units === 'metric' ? 'CM' : 'IN'})`, height, setHeight, "00", "height", { 
                    keyboardType: 'numeric',
                    onFocus: () => {
                      setFocusedField('height');
                      setTimeout(() => {
                        step1ScrollRef.current?.scrollTo({ y: 120, animated: true });
                      }, 100);
                    }
                  })}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* STEP 2: SPORTS */}
          <View style={[styles.slide, { width }]}>
            <View style={styles.stepHeader}>
              <AppText variant="hero" weight="bold" style={styles.title}>Your Arena</AppText>
              <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>Select the sports you focus on.</AppText>
            </View>
            <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
              {SPORTS.map(sport => (
                <Pressable 
                  key={sport}
                  onPress={() => toggleSelection(sport, selectedSports, setSelectedSports)}
                  style={[
                    styles.chip,
                    selectedSports.includes(sport) && styles.chipActive
                  ]}
                >
                  <AppText 
                    variant="body" 
                    weight="semibold"
                    color={selectedSports.includes(sport) ? theme.colors.textDark : theme.colors.surface}
                  >
                    {sport}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* STEP 3: GOALS */}
          <View style={[styles.slide, { width }]}>
            <View style={styles.stepHeader}>
              <AppText variant="hero" weight="bold" style={styles.title}>What's the Goal?</AppText>
              <AppText variant="bodyLarge" color={theme.colors.placeholder} style={styles.subtitle}>We'll tailor your insights to these.</AppText>
            </View>
            <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
              {GOALS.map(goal => (
                <Pressable 
                  key={goal}
                  onPress={() => toggleSelection(goal, selectedGoals, setSelectedGoals)}
                  style={[
                    styles.chip,
                    selectedGoals.includes(goal) && styles.chipActive
                  ]}
                >
                  <AppText 
                    variant="body" 
                    weight="semibold"
                    color={selectedGoals.includes(goal) ? theme.colors.textDark : theme.colors.surface}
                  >
                    {goal}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  stepCounter: {
    letterSpacing: 2,
  },
  slider: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    // Width is controlled by inline style
  },
  slideContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: 120, // Space for footer
  },
  stepHeader: {
    marginBottom: 40,
    gap: 8,
    paddingHorizontal: theme.spacing.xl, // For chip-based screens without slideContent
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
  },
  subtitle: {
    lineHeight: 24,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 24,
    gap: 10,
  },
  label: {
    letterSpacing: 1.5,
    marginLeft: 4,
  },
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  metricsRow: {
    flexDirection: 'row',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  unitBtnActive: {
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
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: theme.radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  footer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
  },
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
  nextBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
