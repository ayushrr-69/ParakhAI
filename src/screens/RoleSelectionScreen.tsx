import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';
import { routes } from '@/constants/routes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { roleOptions } from '@/constants/content';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

function RoleIllustration({ role }: { role: string }) {
  const iconSize = 80;
  
  if (role === 'athlete') {
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="4" stroke={theme.colors.nearBlack} strokeWidth="2" />
        <Path d="M17 14h.352a3 3 0 0 1 2.976 2.628l.391 3.124A2 2 0 0 1 18.734 22H5.266a2 2 0 0 1-1.985-2.248l.391-3.124A3 3 0 0 1 6.648 14H7" stroke={theme.colors.nearBlack} strokeWidth="2" strokeLinecap="round" />
        <Path d="M12 14v4M10 16h4" stroke={theme.colors.nearBlack} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2" stroke={theme.colors.nearBlack} strokeWidth="2" />
      <Path d="M9 7h6M9 11h6M9 15h4" stroke={theme.colors.nearBlack} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 3v3" stroke={theme.colors.nearBlack} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function RoleSelectionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (selectedKey: string) => {
    if (!user) return;
    
    // Process role selection (athlete or coach)
    const role = selectedKey; // Keys are already 'athlete' or 'coach'
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          role, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      // Navigate to Success screen first, logic for refresh will be handled there
      navigation.replace(routes.roleSuccess, { role });
    } catch (error: any) {
      Alert.alert('Selection Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell footerMode='hidden' contentStyle={{ backgroundColor: theme.colors.background }}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <AppText variant='hero' weight='semibold' color={theme.colors.textPrimary} style={styles.title}>
            Choose your entry point
          </AppText>
          <AppText variant='bodyLarge' color={theme.colors.textPrimary} style={styles.subtitle}>
            Start as an athlete or as a coach. This selection helps us tailor your experience.
          </AppText>
        </View>

        <View style={styles.cards}>
          {roleOptions.map((option) => (
            <Pressable 
              key={option.key} 
              onPress={() => handleRoleSelect(option.key)} 
              style={({ pressed }) => [
                styles.card, 
                pressed && styles.pressed,
                loading && styles.disabled
              ]}
              disabled={loading}
            >
              <View style={[styles.imageArea, { backgroundColor: option.imageAccent }]}>
                <RoleIllustration role={option.key} />
              </View>
              <View style={styles.labelBar}>
                <View style={styles.labelContent}>
                  <AppText variant='title' weight='semibold' color={theme.colors.textPrimary}>
                    {option.title}
                  </AppText>
                  <AppText variant='bodySmall' color={theme.colors.textPrimary} style={styles.cardDetail}>
                    {option.key === 'athlete' 
                      ? 'Track your sessions and results.' 
                      : 'Review athlete performance and progress.'}
                  </AppText>
                </View>
                {loading && (
                   <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  headerBlock: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    maxWidth: 310,
    opacity: 0.7,
  },
  cards: {
    gap: theme.spacing.lg,
  },
  card: {
    overflow: 'hidden',
    borderRadius: theme.radii.largeCard,
    backgroundColor: '#000', // Base for overlay
  },
  imageArea: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBar: {
    backgroundColor: 'rgba(35, 34, 32, 0.92)', // Lightened charcoal-gray instead of black
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContent: {
    flex: 1,
    gap: 4,
  },
  cardDetail: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
