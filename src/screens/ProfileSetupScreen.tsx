import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Image, Alert, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { coachService } from '@/services/coach';

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

export function ProfileSetupScreen({ navigation, route }: Props) {
  const { mode = 'setup', step: initialStep } = route.params || {};

  const { profile, updateFullProfile, refreshProfile } = useAuth();
  
  const [step, setStep] = useState(initialStep || 0);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Discovery State
  const [coaches, setCoaches] = useState<any[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  
  // Location State
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [weight, setWeight] = useState(profile?.weight || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(profile?.pref_units || 'metric');
  const [selectedCoach, setSelectedCoach] = useState<{id: string, name: string} | null>(
    profile?.coach_id ? { id: profile.coach_id, name: profile.coach_name || '' } : null
  );
  
  const initialSports = profile?.goals?.filter(g => SPORTS.includes(g)) || [];
  const initialGoals = profile?.goals?.filter(g => GOALS.includes(g)) || [];
  
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [inspectedCoach, setInspectedCoach] = useState<any | null>(null);
  const [introMessage, setIntroMessage] = useState('');
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (mode === 'setup') {
      if (currentStep === 1) { // Bio step
        if (!fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!username.trim()) {
          newErrors.username = 'Username is required';
        } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
          newErrors.username = '3-20 characters, alphanumeric and underscores only';
        }
      } else if (currentStep === 3) { // Metrics step
        const w = parseFloat(weight);
        const h = parseFloat(height);
        if (!weight || isNaN(w) || w <= 0 || w > 500) newErrors.weight = 'Enter valid weight';
        if (!height || isNaN(h) || h <= 0 || h > 300) newErrors.height = 'Enter valid height';
      }
    } else if (mode === 'changeCoach') {
      // No extra text fields yet in changeCoach mode besides discovery
    } else if (mode === 'edit') {
       // Similar to setup steps if edited
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const slideAnim = useRef(new Animated.Value(0)).current;
  const step0ScrollRef = useRef<ScrollView>(null);
  const step1ScrollRef = useRef<ScrollView>(null);
  const totalSteps = mode === 'edit' ? 4 : (mode === 'changeCoach' ? 1 : 5);

  useEffect(() => {
    // Determine if we are on the coach selection step
    const isCoachStep = (mode === 'setup' && step === 4) || mode === 'changeCoach';
    
    if (isCoachStep) {
      if (!locationName) detectLocation();
      fetchCoaches();
    }
  }, [step, mode]);

  const fetchCoaches = async () => {
    setCoachesLoading(true);
    try {
      const data = await coachService.getPublicCoaches();
      setCoaches(data);
    } catch (e) {
      console.error('Failed to fetch coaches:', e);
    } finally {
      setCoachesLoading(false);
    }
  };

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Global Arena');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (reverseGeocode.length > 0) {
        const item = reverseGeocode[0];
        setLocationName(item.city || item.region || item.name || 'Unknown Area');
      } else {
        setLocationName('Global Arena');
      }
    } catch (e) {
      console.error(e);
      setLocationName('Global Arena');
    } finally {
      setLocationLoading(false);
    }
  };

  const nextStep = () => {
    Keyboard.dismiss();
    if (!validateStep(step)) return;

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
    if (!validateStep(step)) return;

    console.log('[Setup] Starting final save...', { 
      fullName, 
      username, 
      weight, 
      height, 
      units, 
      coachId: selectedCoach?.id 
    });
    
    setLoading(true);
    try {
      const { error } = await updateFullProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        weight: weight.trim(),
        height: height.trim(),
        pref_units: units,
        goals: [...selectedSports, ...selectedGoals],
        // coach_id and coach_name will be updated by the server upon enrollment acceptance
      });
      
      if (error) {
        console.error('[Setup] Save error:', error);
        throw error;
      }

      // If a coach was selected AND we are in a mode that allows coach selection, send the enrollment request
      if (selectedCoach?.id && (mode === 'setup' || mode === 'changeCoach')) {
        console.log('[Setup] Preparing enrollment request...');
        
        // 1. Refresh profile first to ensure all state is synced
        await refreshProfile();
        
        // 2. Add a mandatory delay (500ms) to ensure DB propagation for newly registered users
        // This mitigates intermittent foreign key failures in Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[Setup] Sending enrollment request to:', selectedCoach.id);
        const requestSuccess = await coachService.requestEnrollment(selectedCoach.id, introMessage);
        
        if (!requestSuccess) {
          console.warn('[Setup] Enrollment request failed during registration flow');
          Alert.alert(
            "Enrollment Note", 
            "Profile saved, but we couldn't send the request to your coach. You can try again from the coach connect tab."
          );
        } else {
          console.log('[Setup] Enrollment request sent successfully');
        }
      }
      
      console.log('[Setup] Save successful!');
      if (mode === 'changeCoach') {
        navigation.navigate('Main', { screen: routes.tests } as any); // Redirect to coach connect tab 
      } else {
        await refreshProfile();
        navigation.goBack();
      }
      setLoading(false);
    } catch (e: any) {
      console.error('[Setup] Catch error:', e);
      setLoading(false);
      const errorMsg = e.message || "An unexpected error occurred. Please try again.";
      Alert.alert("Setup Error", errorMsg);
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
    if (mode === 'changeCoach') return !!selectedCoach;
    
    if (step === 0) return true; // Intro step
    if (step === 1) return fullName.trim().length > 2 && username.trim().length > 3;
    if (step === 2) return selectedSports.length > 0;
    if (step === 3) return weight.length > 0 && height.length > 0;
    if (step === 4) return !!selectedCoach;
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

  const renderInput = (label: string, value: string, onChange: (t: string) => void, placeholder: string, fieldId: string, props: any = {}) => {
    const error = errors[fieldId];
    return (
      <View style={styles.inputGroup}>
        <AppText variant="bodySmall" weight="bold" color={error ? theme.colors.error : theme.colors.placeholder} style={styles.label}>{label}</AppText>
        <View style={[
          styles.inputContainer,
          focusedField === fieldId && styles.inputContainerFocused,
          error && styles.inputContainerError
        ]}>
          <TextInput 
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={value}
            onChangeText={(t) => {
              onChange(t);
              if (errors[fieldId]) {
                setErrors(prev => {
                  const newState = { ...prev };
                  delete newState[fieldId];
                  return newState;
                });
              }
            }}
            onFocus={() => {
              setFocusedField(fieldId);
              if (props.onFocus) props.onFocus();
            }}
            onBlur={() => {
              setFocusedField(null);
              if (props.onBlur) props.onBlur();
            }}
            {...props}
          />
        </View>
        {error && (
          <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{error}</AppText>
        )}
      </View>
    );
  };

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
              <ActivityIndicator color={theme.colors.nearBlack} />
            ) : (
              <AppText variant="title" weight="bold" color={theme.colors.nearBlack}>
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
          {mode !== 'changeCoach' && (
            <>
              <View style={[styles.slide, { width }]}>
                <ScrollView ref={step0ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideContent} keyboardShouldPersistTaps="handled">
                  <View style={styles.stepHeader}>
                    <AppText variant="heading" weight="semibold" style={styles.title}>Who are you?</AppText>
                    <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.subtitle}>Let's personalize your athlete profile.</AppText>
                  </View>
                  {renderInput("FULL NAME", fullName, setFullName, "John Doe", "name", {
                    onFocus: () => { setFocusedField('name'); step0ScrollRef.current?.scrollTo({ y: 0, animated: true }); }
                  })}
                  {renderInput("USERNAME", username, setUsername, "@username", "user", { autoCapitalize: 'none', onFocus: () => { setFocusedField('user'); setTimeout(() => { step0ScrollRef.current?.scrollTo({ y: 80, animated: true }); }, 100); }})}
                </ScrollView>
              </View>

              <View style={[styles.slide, { width }]}>
                <ScrollView ref={step1ScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideContent} keyboardShouldPersistTaps="handled">
                  <View style={styles.stepHeader}>
                    <AppText variant="heading" weight="semibold" style={styles.title}>The Vital Stats</AppText>
                    <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.subtitle}>Used for calorie burn and power scaling.</AppText>
                  </View>
                  <View style={styles.unitToggle}>
                    <Pressable onPress={() => setUnits('metric')} style={[styles.unitBtn, units === 'metric' && styles.unitBtnActive]}>
                      <AppText variant="bodySmall" weight="bold" color={units === 'metric' ? theme.colors.textDark : theme.colors.placeholder}>METRIC</AppText>
                    </Pressable>
                    <Pressable onPress={() => setUnits('imperial')} style={[styles.unitBtn, units === 'imperial' && styles.unitBtnActive]}>
                      <AppText variant="bodySmall" weight="bold" color={units === 'imperial' ? theme.colors.textDark : theme.colors.placeholder}>IMPERIAL</AppText>
                    </Pressable>
                  </View>
                  <View style={styles.metricsRow}>
                    <View style={{ flex: 1 }}>{renderInput(`WEIGHT (${units === 'metric' ? 'KG' : 'LBS'})`, weight, setWeight, "00", "weight", { keyboardType: 'numeric', onFocus: () => { setFocusedField('weight'); setTimeout(() => { step1ScrollRef.current?.scrollTo({ y: 120, animated: true }); }, 100); } })}</View>
                    <View style={{ width: 16 }} /><View style={{ flex: 1 }}>{renderInput(`HEIGHT (${units === 'metric' ? 'CM' : 'IN'})`, height, setHeight, "00", "height", { keyboardType: 'numeric', onFocus: () => { setFocusedField('height'); setTimeout(() => { step1ScrollRef.current?.scrollTo({ y: 120, animated: true }); }, 100); } })}</View>
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.slide, { width }]}>
                <View style={styles.stepHeader}>
                  <AppText variant="heading" weight="semibold" style={styles.title}>Your Arena</AppText>
                  <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.subtitle}>Select the sports you focus on.</AppText>
                </View>
                <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
                  {SPORTS.map(sport => (
                    <Pressable key={sport} onPress={() => toggleSelection(sport, selectedSports, setSelectedSports)} style={[styles.chip, selectedSports.includes(sport) && styles.chipActive]}>
                      <AppText variant="body" weight="semibold" color={selectedSports.includes(sport) ? theme.colors.textDark : theme.colors.surface}>{sport}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.slide, { width }]}>
                <View style={styles.stepHeader}>
                  <AppText variant="heading" weight="semibold" style={styles.title}>What's the Goal?</AppText>
                  <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.subtitle}>We'll tailor your insights to these.</AppText>
                </View>
                <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
                  {GOALS.map(goal => (
                    <Pressable key={goal} onPress={() => toggleSelection(goal, selectedGoals, setSelectedGoals)} style={[styles.chip, selectedGoals.includes(goal) && styles.chipActive]}>
                      <AppText variant="body" weight="semibold" color={selectedGoals.includes(goal) ? theme.colors.textDark : theme.colors.surface}>{goal}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* COACH SELECTION SLIDE */}
          {mode !== 'edit' && (
            <View style={[styles.slide, { width }]}>

            <View style={styles.stepHeader}>
              <AppText variant="heading" weight="semibold" style={styles.title}>Pick a Coach</AppText>
              <View style={styles.locationTag}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <AppText variant="tiny" weight="bold" color={theme.colors.primary}>
                    NEAR {locationName?.toUpperCase() || 'YOUR LOCATION'}
                  </AppText>
                )}
              </View>
              <AppText variant="bodySmall" color={theme.colors.placeholder} style={styles.subtitle}>
                Based on your area, these coaches are your best options.
              </AppText>
            </View>
            
            <ScrollView contentContainerStyle={styles.coachContainer} showsVerticalScrollIndicator={false}>
              {coachesLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : coaches.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <AppText color={theme.colors.placeholder}>No registered coaches found yet.</AppText>
                </View>
              ) : (
                coaches.map((coach, index) => {
                  const cardBg = [theme.colors.lavender, theme.colors.success, theme.colors.accentOrange][index % 3];
                  const isActive = selectedCoach?.id === coach.id;

                  return (
                    <Pressable 
                      key={coach.id} 
                      onPress={() => setSelectedCoach({ id: coach.id, name: coach.full_name })} 
                      style={[
                        styles.coachCard,
                        { backgroundColor: cardBg },
                        isActive && { borderColor: theme.colors.nearBlack, borderWidth: 3 }
                      ]}
                    >
                      <View style={styles.coachCardMain}>
                        <View style={styles.avatarWrapper}>
                          {coach.avatar_url ? (
                            <Image source={{ uri: coach.avatar_url }} style={styles.coachPfp} />
                          ) : (
                            <View style={[styles.coachAvatarPlaceholder, { backgroundColor: theme.colors.nearBlack }]}>
                              <AppText variant="body" weight="bold" color={theme.colors.surface}>{coach.full_name?.charAt(0)}</AppText>
                            </View>
                          )}
                          <View style={[styles.ratingBadge, { backgroundColor: theme.colors.nearBlack }]}>
                            <AppText variant="tiny" weight="bold" color={theme.colors.surface}>{coach.rating || '4.8'}</AppText>
                          </View>
                        </View>

                        <View style={styles.coachInfo}>
                          <View style={styles.coachHeaderRow}>
                            <AppText variant="bodyLarge" weight="bold" color={theme.colors.textDark}>{coach.full_name || 'Coach'}</AppText>
                            <View style={styles.starsRow}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Svg key={s} width={10} height={10} viewBox="0 0 24 24" fill={s <= Math.round(coach.rating || 5) ? theme.colors.nearBlack : 'rgba(0,0,0,0.1)'}>
                                  <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </Svg>
                              ))}
                            </View>
                          </View>
                          
                          <AppText variant="tiny" color="rgba(18, 18, 18, 0.6)" numberOfLines={1} style={styles.specialtiesText}>
                            {((coach.specialties && coach.specialties.length > 0) 
                              ? coach.specialties.slice(0, 2).join(' • ') 
                              : 'Elite Performance Coach').toUpperCase()}
                          </AppText>

                          <AppText variant="tiny" color={theme.colors.textDark} numberOfLines={2} style={[styles.bioSnippet, { opacity: 0.7 }]}>
                            {coach.bio || "Optimizing technical precision and athletic power."}
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.coachCardFooter}>
                        <Pressable 
                          style={[styles.inspectBtn, { borderBottomColor: theme.colors.nearBlack }]}
                          onPress={() => setInspectedCoach(coach)}
                        >
                          <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>INSPECT PROFILE</AppText>
                        </Pressable>

                        {isActive && (
                          <View style={styles.selectedIndicator}>
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill={theme.colors.nearBlack}>
                              <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </Svg>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
          )}
        </Animated.View>

        {/* COACH INSPECT MODAL */}
        <Modal
          visible={!!inspectedCoach && !showIntroModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setInspectedCoach(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setInspectedCoach(null)} style={styles.modalCloseBtn}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke={theme.colors.surface} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </Pressable>
                <AppText variant="title" weight="bold">Coach Profile</AppText>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalHero}>
                  {inspectedCoach?.avatar_url ? (
                    <Image source={{ uri: inspectedCoach.avatar_url }} style={styles.modalPfp} />
                  ) : (
                    <View style={styles.modalPfpPlaceholder}>
                      <AppText variant="hero" weight="bold" color={theme.colors.surface}>{inspectedCoach?.full_name?.charAt(0)}</AppText>
                    </View>
                  )}
                  <View style={styles.modalExpertise}>
                    <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>{inspectedCoach?.expertise_level || 'PRO'}</AppText>
                  </View>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalNameRow}>
                    <AppText variant="hero" weight="bold">{inspectedCoach?.full_name}</AppText>
                    <View style={styles.modalRating}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill={theme.colors.primary}>
                        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </Svg>
                      <AppText variant="body" weight="bold" style={{ marginLeft: 4 }}>{inspectedCoach?.rating || '4.8'}</AppText>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.modalLabel}>PROFESSIONAL BIO</AppText>
                    <AppText variant="body" style={styles.modalBio}>
                      {inspectedCoach?.bio || "A dedicated performance specialist focused on technical refinement and mental fortitude. My coaching philosophy centers on data-driven progress and sustainable high-performance habits."}
                    </AppText>
                  </View>

                  <View style={styles.modalSection}>
                    <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.modalLabel}>SPECIALTIES</AppText>
                    <View style={styles.modalChipRow}>
                      {(inspectedCoach?.specialties && inspectedCoach.specialties.length > 0 ? inspectedCoach.specialties : ['Strength', 'Power', 'Agility']).map((s: string) => (
                        <View key={s} style={styles.modalChip}>
                          <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>{s.toUpperCase()}</AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable 
                  style={styles.modalSelectBtn}
                  onPress={() => {
                    // Don't clear inspectedCoach yet so we can read its id in the next modal
                    setShowIntroModal(true);
                  }}
                >
                  <AppText variant="title" weight="bold" color={theme.colors.textDark}>SELECT COACH</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* INTRO MESSAGE MODAL */}
        <Modal
          visible={showIntroModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            setShowIntroModal(false);
            setInspectedCoach(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
              <View style={styles.modalHeader}>
                <AppText variant="title" weight="bold" color={theme.colors.surface}>Message your Coach</AppText>
                <Pressable onPress={() => {
                  setShowIntroModal(false);
                  setInspectedCoach(null);
                }} style={styles.modalCloseBtn}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke={theme.colors.surface} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              <View style={{ padding: 24 }}>
                <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ marginBottom: 16 }}>
                  Tell {inspectedCoach?.full_name || 'your coach'} why you'd like to join their program.
                </AppText>
                
                <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
                  <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Enter message..."
                    placeholderTextColor={theme.colors.placeholder}
                    multiline
                    value={introMessage}
                    onChangeText={setIntroMessage}
                  />
                </View>

                <Pressable 
                  style={[styles.modalSelectBtn, { marginTop: 24, opacity: introMessage.length > 10 ? 1 : 0.5 }]}
                  disabled={introMessage.length <= 10}
                  onPress={() => {
                    if (inspectedCoach) {
                      setSelectedCoach({ id: inspectedCoach.id, name: inspectedCoach.full_name });
                    }
                    setShowIntroModal(false);
                    setInspectedCoach(null);
                  }}
                >
                  <AppText variant="title" weight="bold" color={theme.colors.textDark}>CONFIRM REQUEST</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  stepCounter: { letterSpacing: 2 },
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
  title: { },
  subtitle: { lineHeight: 18 },
  locationTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  inputGroup: { marginBottom: 24, gap: 10 },
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
    borderColor: theme.colors.surface,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    color: theme.colors.surface,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.typography.bodyLarge.fontSize,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  metricsRow: { flexDirection: 'row' },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
  },
  unitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  unitBtnActive: { backgroundColor: theme.colors.primary },
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
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
  },
  nextBtn: {
    height: 62,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.placeholder,
  },
  coachContainer: {
    paddingHorizontal: theme.spacing.xl,
    gap: 16,
    paddingBottom: 140,
  },
  coachCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coachCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  coachCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  coachPfp: {
    width: 64,
    height: 64,
    borderRadius: 32, // Circular
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  coachAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32, // Circular
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coachInfo: {
    flex: 1,
    gap: 4,
  },
  coachHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  specialtiesText: {
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  bioSnippet: {
    lineHeight: 16,
  },
  inspectBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1.5,
  },
  focusBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalHero: {
    alignItems: 'center',
    marginTop: 32,
    gap: 16,
  },
  modalPfp: {
    width: 140,
    height: 140,
    borderRadius: 70, // Full Circle
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  modalPfpPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70, // Full Circle
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  modalExpertise: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalBody: {
    padding: 32,
    gap: 32,
  },
  modalNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalSection: {
    gap: 12,
  },
  modalLabel: {
    letterSpacing: 2,
  },
  modalBio: {
    lineHeight: 24,
    opacity: 0.8,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalChip: {
    backgroundColor: theme.colors.lavender,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalFooter: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  modalSelectBtn: {
    backgroundColor: theme.colors.primary,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

