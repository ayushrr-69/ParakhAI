import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RecordingInstructionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleContinue = () => {
    navigation.navigate('VideoUpload');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="heading" style={styles.title}>
            Recording Instructions
          </AppText>
          <AppText variant="body" style={styles.subtitle}>
            Follow these guidelines for accurate rep counting
          </AppText>
        </View>

        {/* Camera Position Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="subtitle" style={styles.cardTitle}>
              Camera Position
            </AppText>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.checkCircle}>
              <AppText style={styles.checkMark}>✓</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Side View Only (90 Degree Angle)
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Position your phone to the side, perpendicular to your body
              </AppText>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.checkCircle}>
              <AppText style={styles.checkMark}>✓</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Full Body in Frame
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Ensure your entire body is visible from head to toe
              </AppText>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.checkCircle}>
              <AppText style={styles.checkMark}>✓</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Good Lighting
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Record in a well-lit area for better pose detection
              </AppText>
            </View>
          </View>
        </View>

        {/* What to Avoid Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="subtitle" style={styles.cardTitle}>
              Avoid These Angles
            </AppText>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.crossCircle}>
              <AppText style={styles.crossMark}>X</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Front View
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Facing the camera directly reduces accuracy
              </AppText>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.crossCircle}>
              <AppText style={styles.crossMark}>X</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Diagonal/Angled View
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Angles between front and side may miss reps
              </AppText>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.crossCircle}>
              <AppText style={styles.crossMark}>X</AppText>
            </View>
            <View style={styles.instructionText}>
              <AppText variant="bodyLarge" style={styles.instructionTitle}>
                Partial Body Visible
              </AppText>
              <AppText variant="body" style={styles.instructionDesc}>
                Keep your full body in frame at all times
              </AppText>
            </View>
          </View>
        </View>

        {/* Exercise-Specific Tips Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="subtitle" style={styles.cardTitle}>
              Exercise Tips
            </AppText>
          </View>

          <View style={styles.exerciseTip}>
            <AppText variant="bodyLarge" style={styles.exerciseName}>
              Pushups
            </AppText>
            <AppText variant="body" style={styles.exerciseDesc}>
              Side view shows clear elbow extension (90 to 180 degrees)
            </AppText>
          </View>

          <View style={styles.exerciseTip}>
            <AppText variant="bodyLarge" style={styles.exerciseName}>
              Squats
            </AppText>
            <AppText variant="body" style={styles.exerciseDesc}>
              Side view captures knee and hip angles accurately
            </AppText>
          </View>

          <View style={styles.exerciseTip}>
            <AppText variant="bodyLarge" style={styles.exerciseName}>
              Bicep Curls
            </AppText>
            <AppText variant="body" style={styles.exerciseDesc}>
              Side view tracks elbow bend clearly (40 to 140 degrees)
            </AppText>
          </View>
        </View>

        {/* Pro Tips */}
        <View style={styles.proTipsContainer}>
          <AppText variant="body" style={styles.proTips}>
            <AppText variant="bodyLarge" style={styles.proTipsTitle}>Pro Tip: </AppText>
            Use a phone stand or ask someone to hold the camera. Keep the phone stable and at waist height.
          </AppText>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
        >
          <AppText variant="subtitle" style={styles.continueButtonText}>
            Got It, Start Recording
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl + theme.spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.surface,
  },
  subtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.surface,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkMark: {
    fontSize: 20,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  crossCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  crossMark: {
    fontSize: 20,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    color: theme.colors.surface,
    marginBottom: theme.spacing.xxs,
  },
  instructionDesc: {
    color: theme.colors.placeholder,
  },
  exerciseTip: {
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  exerciseName: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.xxs,
  },
  exerciseDesc: {
    color: theme.colors.placeholder,
  },
  proTipsContainer: {
    backgroundColor: `${theme.colors.primary}15`,
    padding: theme.spacing.md,
    borderRadius: theme.radii.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  proTips: {
    color: theme.colors.surface,
  },
  proTipsTitle: {
    color: theme.colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.muted,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.input,
  },
  continueButtonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: theme.colors.background,
  },
});
