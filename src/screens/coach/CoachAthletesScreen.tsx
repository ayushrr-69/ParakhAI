import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { coachService } from '@/services/coach';
import { routes } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { CoachHeader } from '@/components/coach/CoachHeader';

const CARD_COLORS = [
  theme.colors.lavender,
  theme.colors.success,
  theme.colors.yellow,
  theme.colors.accentOrange,
];

export function CoachAthletesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspectedAthlete, setInspectedAthlete] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(refreshing ? false : true);
    try {
      const data = await coachService.getMyAthletes();
      setAthletes((data || []).filter(Boolean));
    } catch (error) {
      console.error('[CoachAthletes] Error loading athletes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <AppShell footerMode="hidden">
      <CoachHeader title="My Athletes" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header matching athlete screens */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodySmall" color={theme.colors.placeholder}>
            {athletes.length > 0 ? `${athletes.length} enrolled athlete${athletes.length !== 1 ? 's' : ''}` : 'Awaiting enrollment requests'}
          </AppText>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : athletes.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="bodyLarge" weight="bold" color={theme.colors.placeholder}>No Athletes Yet</AppText>
            <AppText variant="bodySmall" color={theme.colors.placeholder} style={{ textAlign: 'center', marginTop: 4 }}>
              Athletes will appear here once you accept their enrollment requests.
            </AppText>
          </View>
        ) : (
          athletes.map((athlete, index) => {
            const cardColor = CARD_COLORS[index % CARD_COLORS.length];
            return (
              <Pressable
                key={athlete?.id ?? `athlete-${index}`}
                style={[styles.athleteCard, { backgroundColor: cardColor }]}
                onPress={() => setInspectedAthlete(athlete)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                      {athlete?.full_name?.charAt(0) ?? '?'}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="heading" weight="bold" color={theme.colors.textDark}>
                      {athlete?.full_name ?? '—'}
                    </AppText>
                    <AppText variant="bodySmall" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>
                      @{athlete?.username ?? '—'}
                    </AppText>
                  </View>
                  <Pressable
                    style={styles.chatBtn}
                    onPress={() => athlete && navigation.navigate(routes.chat, {
                      targetName: athlete.full_name,
                      targetId: athlete.id,
                    })}
                    hitSlop={8}
                  >
                    <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>CHAT →</AppText>
                  </Pressable>
                </View>

                {/* Stat pills */}
                <View style={styles.statRow}>
                  <View style={styles.statPill}>
                    <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>
                      {athlete?.weight ? `${athlete.weight} ${athlete?.pref_units === 'metric' ? 'KG' : 'LBS'}` : 'WEIGHT —'}
                    </AppText>
                  </View>
                  <View style={styles.statPill}>
                    <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>
                      {athlete?.height ? `${athlete.height} ${athlete?.pref_units === 'metric' ? 'CM' : 'IN'}` : 'HEIGHT —'}
                    </AppText>
                  </View>
                  {athlete?.goals?.slice(0, 1).map((g: string) => (
                    <View key={g} style={styles.statPill}>
                      <AppText variant="tiny" weight="bold" color={theme.colors.textDark}>{g.toUpperCase()}</AppText>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* ATHLETE FULL PROFILE MODAL */}
      <Modal
        visible={!!inspectedAthlete}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspectedAthlete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Colored hero top matching card card */}
            <View style={[styles.modalHero, { backgroundColor: CARD_COLORS[athletes.indexOf(inspectedAthlete) % CARD_COLORS.length] || theme.colors.lavender }]}>
              <Pressable onPress={() => setInspectedAthlete(null)} style={styles.modalCloseBtn}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={theme.colors.nearBlack} strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </Pressable>
              <View style={styles.heroAvatar}>
                <AppText variant="hero" weight="bold" color={theme.colors.textDark}>
                  {inspectedAthlete?.full_name?.charAt(0)}
                </AppText>
              </View>
              <AppText variant="hero" weight="bold" color={theme.colors.textDark} style={{ marginTop: 12 }}>
                {inspectedAthlete?.full_name}
              </AppText>
              <AppText variant="body" color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>
                @{inspectedAthlete?.username}
              </AppText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Vital Stats */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.yellow }]}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>
                  VITAL STATS
                </AppText>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                      {inspectedAthlete?.weight ?? '—'}
                    </AppText>
                    <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>
                      {inspectedAthlete?.pref_units === 'metric' ? 'KG' : 'LBS'}
                    </AppText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statBox}>
                    <AppText variant="title" weight="bold" color={theme.colors.textDark}>
                      {inspectedAthlete?.height ?? '—'}
                    </AppText>
                    <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>
                      {inspectedAthlete?.pref_units === 'metric' ? 'CM' : 'IN'}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Sports & Goals */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.lavender }]}>
                <AppText variant="bodySmall" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>
                  SPORTS & GOALS
                </AppText>
                <View style={styles.chipRow}>
                  {(inspectedAthlete?.goals && inspectedAthlete.goals.length > 0
                    ? inspectedAthlete.goals
                    : ['None listed']
                  ).map((s: string) => (
                    <View key={s} style={styles.chip}>
                      <AppText variant="tiny" weight="bold" color={theme.colors.nearBlack}>{s.toUpperCase()}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bio */}
              {inspectedAthlete?.bio && (
                <View style={[styles.infoCard, { backgroundColor: theme.colors.success }]}>
                  <AppText variant="bodySmall" weight="bold" color={theme.colors.nearBlack} style={styles.infoLabel}>BIO</AppText>
                  <AppText variant="body" color={theme.colors.textDark}>{inspectedAthlete.bio}</AppText>
                </View>
              )}

              <Pressable
                style={styles.messageBtn}
                onPress={() => {
                  const athlete = inspectedAthlete;
                  setInspectedAthlete(null);
                  navigation.navigate(routes.chat, {
                    targetName: athlete.full_name,
                    targetId: athlete.id,
                  });
                }}
              >
                <AppText variant="title" weight="bold" color={theme.colors.textDark}>MESSAGE ATHLETE</AppText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
  emptyState: {
    marginTop: 40,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.radii.largeCard,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  // Athlete Card
  athleteCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '92%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  modalHero: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
    gap: 4,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: 60,
  },
  infoCard: {
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoLabel: {
    opacity: 0.6,
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  messageBtn: {
    height: 58,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
});
