import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { validation } from '@/utils/validation';

const CATEGORIES = [
  'Football', 'Cricket', 'Basketball', 'Martial Arts', 
  'Tennis', 'Athletics', 'Swimming', 'Combat Sports',
  'Strength & Conditioning', 'Explosive Power', 'Agility', 'Endurance', 
  'Recovery Focus', 'Mobility', 'Core Stability', 'Biomechanics',
  'Nutrition', 'Psychology'
];

const EXPERTISE_LEVELS = ['Intern', 'Certified', 'Pro', 'Elite', 'Legend'];

export function CoachEditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, updateFullProfile, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(profile?.specialties || []);
  const [expertiseLevel, setExpertiseLevel] = useState(profile?.expertise_level || 'Certified');
  const [location, setLocation] = useState(profile?.location || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!validation.fullName(fullName)) {
      newErrors.fullName = 'Please enter a valid name (2-50 letters)';
    }

    if (bio.trim().length > 0 && bio.trim().length < 20) {
      newErrors.bio = 'Bio should be at least 20 characters';
    } else if (bio.trim().length > 500) {
      newErrors.bio = 'Bio must be under 500 characters';
    }

    if (selectedSpecialties.length === 0) {
      Alert.alert("Specialties Required", "Please select at least one specialty.");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await updateFullProfile({
        full_name: fullName.trim(),
        specialties: selectedSpecialties,
        expertise_level: expertiseLevel,
        bio: bio.trim(),
        location: location.trim(),
      });
      
      if (error) throw error;
      
      await refreshProfile();
      navigation.goBack();
    } catch (e: any) {
      console.error('[CoachEdit] Save error:', e);
      Alert.alert("Save Failed", e.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (item: string) => {
    if (selectedSpecialties.includes(item)) {
      setSelectedSpecialties(selectedSpecialties.filter(i => i !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  return (
    <AppShell footerMode="sticky" footer={(
      <View style={styles.footer}>
        <Pressable 
          onPress={handleSave} 
          disabled={loading}
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textDark} />
          ) : (
            <AppText variant="bodyLarge" weight="semibold" color={theme.colors.textDark}>Save Changes</AppText>
          )}
        </Pressable>
      </View>
    )}>
      <CoachHeader title="Edit Profile" variant="title" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.inputGroup}>
            <AppText variant="bodySmall" weight="bold" color={errors.fullName ? theme.colors.error : theme.colors.placeholder} style={styles.label}>FULL NAME</AppText>
            <View style={[
              styles.inputContainer,
              focusedField === 'name' && styles.inputContainerFocused,
              errors.fullName && styles.inputContainerError
            ]}>
              <TextInput 
                style={styles.input}
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
                placeholder="Coach Name"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={50}
              />
            </View>
            {errors.fullName && <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{errors.fullName}</AppText>}
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.label}>PHYSICAL LOCATION</AppText>
            <View style={[
              styles.inputContainer,
              focusedField === 'location' && styles.inputContainerFocused
            ]}>
              <TextInput 
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Mumbai, India"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={100}
              />
            </View>
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
                  <AppText variant="tiny" weight="bold" color={expertiseLevel === level ? theme.colors.nearBlack : theme.colors.placeholder}>{level.toUpperCase()}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="bodySmall" weight="bold" color={theme.colors.placeholder} style={styles.label}>SPECIALTIES</AppText>
            <View style={styles.chipContainer}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => toggleSpecialty(cat)} style={[styles.chip, selectedSpecialties.includes(cat) && styles.chipActive]}>
                  <AppText variant="tiny" weight="bold" color={selectedSpecialties.includes(cat) ? theme.colors.nearBlack : theme.colors.textPrimary}>{cat}</AppText>
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
                value={bio}
                onChangeText={(t) => {
                  setBio(t);
                  if (errors.bio) setErrors(prev => {
                    const { bio, ...rest } = prev;
                    return rest;
                  });
                }}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                placeholder="Tell athletes about your philosophy..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
            {errors.bio && <AppText variant="tiny" color={theme.colors.error} style={styles.errorText}>{errors.bio}</AppText>}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
    gap: 8,
  },
  label: {
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    height: 56,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  bioContainer: {
    height: 120,
    paddingTop: 12,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
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
  },
  levelBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  footer: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
  },
  saveBtn: {
    width: '100%',
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
});
