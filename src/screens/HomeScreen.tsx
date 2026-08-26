import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CycleRing from '../components/CycleRing';
import MoodPicker from '../components/MoodPicker';
import WaterTracker from '../components/WaterTracker';
import WorkoutCard from '../components/WorkoutCard';
import PrimaryButton from '../components/PrimaryButton';
import { useContent } from '../data/useContent';
import { buildWeeklyPlan } from '../domain/plan';
import { badges, currentStreak, lastNDays, minutesThisWeek } from '../domain/stats';
import { dayInCycle, phaseFromDay, phaseInfo, recommendForPhase } from '../domain/cycle';
import type { Phase } from '../domain/cycle';
import { useStore } from '../store/StoreContext';
import { colors, radius, shadows } from '../theme';
import { Workout } from '../types';

export default function HomeScreen({ navigation }: any) {
  const content = useContent();
  const { profile, premium, sessions, water, moods, setMood, toggleWater, cycle, challengeProgress } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const week = lastNDays(7);
  const streak = currentStreak(sessions, today);
  const minutes = minutesThisWeek(sessions, content.workouts, week);
  const plan = useMemo(() => buildWeeklyPlan(content.workouts, { goal: profile!.goal, level: profile!.level }), [content.workouts, profile]);
  const phase: Phase | null = cycle?.enabled && cycle.periodStart ? phaseFromDay(dayInCycle(cycle.periodStart, today), cycle.cycleLength) : null;
  const phasePicks = phase ? recommendForPhase(content.workouts, phase, 2) : [];
  const allBadges = badges({ sessions: Object.values(sessions).flat().length, streak, hydratedToday: water.includes(today), moodEntries: Object.keys(moods).length, challengeJoined: Object.values(challengeProgress).some((p: number) => p > 0) }, week);

  if (content.loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.loadingText}>Chargement de tes séances…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Bonjour {profile?.firstName === 'toi' ? '' : profile?.firstName} 🌸</Text>
            <Text style={styles.muted}>Ton rituel du jour t’attend</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.firstName.charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadows.soft]}><Text style={styles.statValue}>{streak}</Text><Text style={styles.statLabel}>jours d’affilée 🔥</Text></View>
          <View style={[styles.statCard, shadows.soft]}><Text style={styles.statValue}>{minutes}</Text><Text style={styles.statLabel}>min cette semaine</Text></View>
        </View>

        <ImageBackground
          source={plan[0]?.image ?? require('../../assets/mandala/challenges/01-DcJVu1oKo8J.jpg')}
          imageStyle={{ borderRadius: radius.lg }}
          style={styles.heroCard}
        >
          <LinearGradient colors={['rgba(30,20,40,.05)', 'rgba(45,25,50,.85)']} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} />
          <View style={styles.todayBadge}><View style={styles.liveDot} /><Text style={styles.todayBadgeText}>POUR AUJOURD’HUI</Text></View>
          <View>
            <Text style={styles.heroTitle}>{plan[0]?.title ?? 'Séance du jour'}</Text>
            <Text style={styles.heroMeta}>{plan[0] ? `${plan[0].duration} min · ${plan[0].category} · ${plan[0].calories} kcal` : '—'}</Text>
            {plan[0] ? (
              <Pressable onPress={() => navigation.navigate('Workout', { id: plan[0].id })} style={styles.playButton}>
                <Ionicons name="play" color={colors.violet} size={18} />
                <Text style={styles.playButtonText}>Commencer</Text>
              </Pressable>
            ) : null}
          </View>
        </ImageBackground>

        {phase ? (
          <View style={[styles.phaseCard, shadows.soft]}>
            <CycleRing size={190} progress={(dayInCycle(cycle!.periodStart!, today) % cycle!.cycleLength) / cycle!.cycleLength} dayNumber={dayInCycle(cycle!.periodStart!, today)} phaseLabel={phaseInfo[phase].label} phaseEmoji={phaseInfo[phase].emoji} />
            <Text style={styles.phaseTip}>{phaseInfo[phase].tip}</Text>
            <Text style={styles.phaseSub}>Recommandé pour toi aujourd’hui :</Text>
            <View style={{ gap: 10 }}>
              {phasePicks.map((w: Workout) => <WorkoutCard key={w.id} workout={w} navigation={navigation} compact />)}
            </View>
          </View>
        ) : (
          <Pressable onPress={() => navigation.navigate('Cycle')} style={[styles.cycleInvite, shadows.soft]}>
            <Ionicons name="moon" size={26} color={colors.violet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cycleInviteTitle}>Active ton suivi de cycle</Text>
              <Text style={styles.cycleInviteText}>Des séances adaptées à chaque phase 🌙</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </Pressable>
        )}

        <MoodPicker selected={moods[today]} onSelect={setMood} />

        <WaterTracker glasses={water} onToggle={toggleWater} />

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Tes badges</Text></View>
        <View style={styles.badgesRow}>
          {allBadges.map((b) => (
            <View key={b.id} style={[styles.badgeChip, b.unlocked && styles.badgeUnlocked]}>
              <Text style={{ fontSize: 19 }}>{b.emoji}</Text>
              <Text style={[styles.badgeLabel, b.unlocked && styles.badgeLabelOn]}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ton plan de la semaine</Text>
          <Pressable onPress={() => navigation.navigate('Plans')}><Text style={styles.sectionAction}>Voir les plans</Text></Pressable>
        </View>
        <View style={{ gap: 14 }}>
          {plan.slice(1).map((item) => <WorkoutCard key={item.id} workout={item} navigation={navigation} />)}
        </View>

        {!premium ? (
          <LinearGradient colors={[colors.violet, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.premiumBanner, shadows.soft]}>
            <Ionicons name="sparkles" color="#FFE9F4" size={27} />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Passe à Mandala Plus</Text>
              <Text style={styles.premiumText}>Tous les programmes, sans limite.</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Paywall')}>
              <Ionicons name="arrow-forward-circle" color="white" size={34} />
            </Pressable>
          </LinearGradient>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  centered: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  loadingText: { marginTop: 12, color: colors.muted },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 18 },
  greeting: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  muted: { color: colors.muted, fontSize: 14, marginTop: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', fontSize: 17, color: colors.violet },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.violet },
  statLabel: { color: colors.muted, fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  heroCard: { height: 380, borderRadius: radius.lg, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  todayBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 30 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral },
  todayBadgeText: { fontSize: 10, fontWeight: '900', color: colors.violet, letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: -1.1 },
  heroMeta: { color: 'rgba(255,255,255,.78)', fontSize: 14, marginTop: 7, marginBottom: 17 },
  playButton: { alignSelf: 'flex-start', backgroundColor: '#FFE3F0', height: 47, borderRadius: 24, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', gap: 9 },
  playButtonText: { color: colors.violet, fontWeight: '900' },
  phaseCard: { backgroundColor: 'white', borderRadius: radius.md, padding: 18, marginTop: 16, alignItems: 'center' },
  phaseTip: { color: colors.ink, fontWeight: '700', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  phaseSub: { alignSelf: 'flex-start', color: colors.muted, fontSize: 12.5, fontWeight: '800', marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cycleInvite: { backgroundColor: 'white', borderRadius: radius.md, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 16 },
  cycleInviteTitle: { color: colors.ink, fontWeight: '900', fontSize: 15.5 },
  cycleInviteText: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  sectionAction: { color: colors.green, fontWeight: '700', fontSize: 13 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  badgeChip: { backgroundColor: 'white', opacity: 0.55, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 11, alignItems: 'center', width: '32%', minWidth: 96, flexGrow: 1 },
  badgeUnlocked: { opacity: 1, backgroundColor: colors.rosewater },
  badgeLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  badgeLabelOn: { color: colors.violet },
  premiumBanner: { marginTop: 25, padding: 19, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: 13 },
  premiumTitle: { color: 'white', fontWeight: '900', fontSize: 16 },
  premiumText: { color: 'rgba(255,255,255,.72)', marginTop: 3, fontSize: 12 },
});
