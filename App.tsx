import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CycleRing from './src/components/CycleRing';
import MoodPicker from './src/components/MoodPicker';
import WaterTracker from './src/components/WaterTracker';
import { challenges, programs, workouts } from './src/data/content';
import { buildWeeklyPlan } from './src/domain/plan';
import { badges, currentStreak, lastNDays, minutesThisWeek } from './src/domain/stats';
import { phaseFromDay, dayInCycle, phaseInfo, recommendForPhase } from './src/domain/cycle';
import type { Phase } from './src/domain/cycle';
import { StoreProvider, useStore } from './src/store/StoreContext';
import { colors, radius, shadows } from './src/theme';
import { Goal, Level, Workout } from './src/types';

const Stack = createNativeStackNavigator<any>();
const Tabs = createBottomTabNavigator<any>();

const goalOptions: { value: Goal; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'strength', label: 'Me tonifier', icon: 'sparkles-outline' },
  { value: 'energy', label: 'Plus d’énergie', icon: 'flash-outline' },
  { value: 'mobility', label: 'Gagner en souplesse', icon: 'body-outline' },
  { value: 'relaxation', label: 'Me détendre', icon: 'leaf-outline' },
];

const levelOptions: { value: Level; label: string; detail: string }[] = [
  { value: 'beginner', label: 'Je débute', detail: 'Des bases guidées et accessibles' },
  { value: 'intermediate', label: 'Intermédiaire', detail: 'Je pratique déjà régulièrement' },
  { value: 'advanced', label: 'Avancé', detail: 'Je recherche plus d’intensité' },
];

function PrimaryButton({ label, onPress, light = false }: { label: string; onPress: () => void; light?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}>
      {!light && <LinearGradient colors={[colors.green, colors.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {light && <View style={[StyleSheet.absoluteFill, styles.lightFill]} />}
      <Text style={[styles.primaryButtonText, light && { color: colors.violet }]}>{label}</Text>
      <Ionicons name="arrow-forward" color={light ? colors.violet : 'white'} size={18} />
    </Pressable>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

function WorkoutCard({ workout, navigation, compact = false }: { workout: Workout; navigation: any; compact?: boolean }) {
  const { favorites, toggleWorkoutFavorite, premium } = useStore();
  const isFavorite = favorites.includes(workout.id);
  return (
    <Pressable
      onPress={() => navigation.navigate(workout.premium && !premium ? 'Paywall' : 'Workout', { id: workout.id })}
      style={[styles.workoutCard, compact && styles.workoutCardCompact, shadows.soft]}
    >
      <Image source={workout.image} style={[styles.workoutImage, compact && styles.workoutImageCompact]} />
      <LinearGradient colors={['transparent', 'rgba(30,20,36,.55)']} style={styles.workoutShade} />
      <Pressable onPress={() => toggleWorkoutFavorite(workout.id)} hitSlop={12} style={styles.favoriteButton}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} color="white" size={20} />
      </Pressable>
      {workout.premium && !premium ? (
        <View style={styles.lockBadge}><Ionicons name="lock-closed" size={11} color={colors.violet} /><Text style={styles.lockText}>PLUS</Text></View>
      ) : null}
      <View style={styles.workoutCopy}>
        <Text style={styles.cardEyebrow}>{workout.category.toUpperCase()} · {workout.duration} MIN</Text>
        <Text style={styles.workoutTitle}>{workout.title}</Text>
        {!compact ? <Text numberOfLines={1} style={styles.workoutSubtitle}>{workout.subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

function Onboarding() {
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [goal, setGoal] = useState<Goal>('energy');
  const [level, setLevel] = useState<Level>('beginner');

  if (step === 0) {
    return (
      <ImageBackground source={require('./assets/mandala/site/hero-1.jpg')} style={styles.onboardingHero}>
        <LinearGradient colors={['rgba(30,20,40,.10)', 'rgba(45,25,50,.90)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.onboardingWelcome}>
          <View style={styles.logoPlate}><Image source={require('./assets/mandala/logo.png')} style={styles.brandLogo} resizeMode="contain" /></View>
          <View style={styles.onboardingCopy}>
            <Text style={styles.onboardingKicker}>BIENVENUE DANS TON RITUEL ✨</Text>
            <Text style={styles.onboardingTitle}>Bouge. Respire.{`\n`}Rayonne.</Text>
            <Text style={styles.onboardingLead}>Pilates et yoga pensés pour ton corps et ton cycle, à ton rythme.</Text>
            <PrimaryButton label="Créer mon programme" onPress={() => setStep(1)} light />
            <Text style={styles.disclaimer}>Prototype de démonstration — aucun paiement réel</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (step === 1 || step === 2) {
    return (
      <SafeAreaView style={styles.onboardingForm} edges={['top', 'bottom']}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }]} /></View>
        <Pressable onPress={() => setStep(step - 1)} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable>
        {step === 1 ? (
          <View style={styles.formBody}>
            <Text style={styles.formKicker}>ÉTAPE 1 SUR 3</Text>
            <Text style={styles.formTitle}>Ravi(e) de te rencontrer{firstName ? `, ${firstName}` : ''} 💜{'\n'}Comment t’appelles-tu ?</Text>
            <TextInput value={firstName} onChangeText={setFirstName} placeholder="Ton prénom" placeholderTextColor="#B49CBF" style={styles.nameInput} />
            <View style={{ flex: 1 }} />
            <PrimaryButton label="Continuer" onPress={() => setStep(2)} />
          </View>
        ) : step === 2 ? (
          <View style={styles.formBody}>
            <Text style={styles.formKicker}>ÉTAPE 2 SUR 3</Text>
            <Text style={styles.formTitle}>Qu’est-ce qui compte le plus pour toi ?</Text>
            <View style={styles.optionGrid}>
              {goalOptions.map((option) => (
                <Pressable key={option.value} onPress={() => setGoal(option.value)} style={[styles.goalOption, goal === option.value && styles.optionSelected]}>
                  <Ionicons name={option.icon} size={24} color={goal === option.value ? 'white' : colors.green} />
                  <Text style={[styles.goalLabel, goal === option.value && { color: 'white' }]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label="Continuer" onPress={() => setStep(3)} />
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.onboardingForm} edges={['top', 'bottom']}>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '100%' }]} /></View>
      <Pressable onPress={() => setStep(2)} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable>
      <View style={styles.formBody}>
        <Text style={styles.formKicker}>ÉTAPE 3 SUR 3</Text>
        <Text style={styles.formTitle}>Quel est ton niveau actuel ?</Text>
        <View style={{ gap: 12, marginTop: 24 }}>
          {levelOptions.map((option) => (
            <Pressable key={option.value} onPress={() => setLevel(option.value)} style={[styles.levelOption, level === option.value && styles.levelSelected]}>
              <View style={[styles.radio, level === option.value && styles.radioSelected]} />
              <View><Text style={styles.levelLabel}>{option.label}</Text><Text style={styles.levelDetail}>{option.detail}</Text></View>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Découvrir mon programme" onPress={() => completeOnboarding({ firstName: firstName.trim() || 'toi', goal, level })} />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }: any) {
  const { profile, premium, sessions, water, moods, setMood, toggleWater, cycle, challengeProgress } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const week = lastNDays(7);
  const streak = currentStreak(sessions, today);
  const minutes = minutesThisWeek(sessions, workouts, week);
  const plan = useMemo(() => buildWeeklyPlan(workouts, { goal: profile!.goal, level: profile!.level }), [profile]);
  const phase: Phase | null = cycle?.enabled && cycle.periodStart ? phaseFromDay(dayInCycle(cycle.periodStart, today), cycle.cycleLength) : null;
  const phasePicks = phase ? recommendForPhase(workouts, phase, 2) : [];
  const allBadges = badges({ sessions: Object.values(sessions).flat().length, streak, hydratedToday: water.includes(today), moodEntries: Object.keys(moods).length, challengeJoined: Object.values(challengeProgress).some((p) => p > 0) }, week);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View><Text style={styles.greeting}>Bonjour {profile?.firstName === 'toi' ? '' : profile?.firstName} 🌸</Text><Text style={styles.muted}>Ton rituel du jour t’attend</Text></View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}><Text style={styles.avatarText}>{profile?.firstName.charAt(0).toUpperCase()}</Text></Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadows.soft]}><Text style={styles.statValue}>{streak}</Text><Text style={styles.statLabel}>jours d’affilée 🔥</Text></View>
          <View style={[styles.statCard, shadows.soft]}><Text style={styles.statValue}>{minutes}</Text><Text style={styles.statLabel}>min cette semaine</Text></View>
        </View>

        <ImageBackground source={plan[0].image} imageStyle={{ borderRadius: radius.lg }} style={styles.heroCard}>
          <LinearGradient colors={['rgba(30,20,40,.05)', 'rgba(45,25,50,.85)']} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} />
          <View style={styles.todayBadge}><View style={styles.liveDot} /><Text style={styles.todayBadgeText}>POUR AUJOURD’HUI</Text></View>
          <View>
            <Text style={styles.heroTitle}>{plan[0].title}</Text>
            <Text style={styles.heroMeta}>{plan[0].duration} min · {plan[0].category} · {plan[0].calories} kcal</Text>
            <Pressable onPress={() => navigation.navigate('Workout', { id: plan[0].id })} style={styles.playButton}>
              <Ionicons name="play" color={colors.violet} size={18} /><Text style={styles.playButtonText}>Commencer</Text>
            </Pressable>
          </View>
        </ImageBackground>

        {phase ? (
          <View style={[styles.phaseCard, shadows.soft]}>
            <CycleRing size={190} progress={(dayInCycle(cycle!.periodStart!, today) % cycle!.cycleLength) / cycle!.cycleLength} dayNumber={dayInCycle(cycle!.periodStart!, today)} phaseLabel={phaseInfo[phase].label} phaseEmoji={phaseInfo[phase].emoji} />
            <Text style={styles.phaseTip}>{phaseInfo[phase].tip}</Text>
            <Text style={styles.phaseSub}>Recommandé pour toi aujourd’hui :</Text>
            <View style={{ gap: 10 }}>{phasePicks.map((w: Workout) => <WorkoutCard key={w.id} workout={w} navigation={navigation} compact />)}</View>
          </View>
        ) : (
          <Pressable onPress={() => navigation.navigate('Cycle')} style={[styles.cycleInvite, shadows.soft]}>
            <Ionicons name="moon" size={26} color={colors.violet} />
            <View style={{ flex: 1 }}><Text style={styles.cycleInviteTitle}>Active ton suivi de cycle</Text><Text style={styles.cycleInviteText}>Des séances adaptées à chaque phase 🌙</Text></View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </Pressable>
        )}

        <MoodPicker selected={moods[today]} onSelect={setMood} />

        <WaterTracker glasses={water} onToggle={toggleWater} />

        <SectionHeader title="Tes badges" />
        <View style={styles.badgesRow}>
          {allBadges.map((b) => (
            <View key={b.id} style={[styles.badgeChip, b.unlocked && styles.badgeUnlocked]}>
              <Text style={{ fontSize: 19 }}>{b.emoji}</Text>
              <Text style={[styles.badgeLabel, b.unlocked && styles.badgeLabelOn]}>{b.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Ton plan de la semaine" action="Voir les plans" onAction={() => navigation.navigate('Plans')} />
        <View style={{ gap: 14 }}>{plan.slice(1).map((item) => <WorkoutCard key={item.id} workout={item} navigation={navigation} />)}</View>

        {!premium ? (
          <LinearGradient colors={[colors.violet, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.premiumBanner, shadows.soft]}>
            <Ionicons name="sparkles" color="#FFE9F4" size={27} />
            <View style={{ flex: 1 }}><Text style={styles.premiumTitle}>Passe à Mandala Plus</Text><Text style={styles.premiumText}>Tous les programmes, sans limite.</Text></View>
            <Pressable onPress={() => navigation.navigate('Paywall')}><Ionicons name="arrow-forward-circle" color="white" size={34} /></Pressable>
          </LinearGradient>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CycleScreen() {
  const { cycle, setCycle } = useStore();
  const enabled = cycle?.enabled ?? false;
  const today = new Date().toISOString().slice(0, 10);
  const phase = cycle?.enabled && cycle.periodStart ? phaseFromDay(dayInCycle(cycle.periodStart, today), cycle.cycleLength) : null;
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Mon cycle</Text>
        <Text style={styles.pageLead}>Un entraînement en harmonie avec ton corps, phase après phase.</Text>
        {!enabled ? (
          <>
            <PrimaryButton label="Activer mon suivi" onPress={() => setCycle({ enabled: true, periodStart: today, cycleLength: 28 })} />
            <Text style={styles.disclaimerDark}>Prototype : aucune donnée n’est partagée, tout reste sur ton téléphone.</Text>
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <CycleRing size={230} progress={(dayInCycle(cycle!.periodStart!, today) % cycle!.cycleLength) / cycle!.cycleLength} dayNumber={dayInCycle(cycle!.periodStart!, today)} phaseLabel={phaseInfo[phase!].label} phaseEmoji={phaseInfo[phase!].emoji} />
            </View>
            <View style={[styles.phaseInfoCard, shadows.soft]}>
              <Text style={styles.phaseInfoTitle}>{phaseInfo[phase!].emoji} {phaseInfo[phase!].label}</Text>
              <Text style={styles.phaseInfoText}>{phaseInfo[phase!].tip}</Text>
            </View>
            <Text style={styles.settingsTitle}>DURÉE DE CYCLE</Text>
            <View style={[styles.settingsCard, shadows.soft]}>
              {[26, 28, 30, 32].map((len) => (
                <Pressable key={len} onPress={() => setCycle({ ...cycle!, cycleLength: len })} style={styles.cycleLengthRow}>
                  <Text style={styles.levelLabel}>{len} jours</Text>
                  {cycle!.cycleLength === len ? <Ionicons name="checkmark-circle" size={22} color={colors.green} /> : <Ionicons name="ellipse-outline" size={22} color={colors.border} />}
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setCycle({ ...cycle!, periodStart: today })} style={styles.resetButton}><Text style={styles.resetText}>Mes règles ont commencé aujourd’hui</Text></Pressable>
            <Pressable onPress={() => setCycle(null)} style={styles.resetButton}><Text style={[styles.resetText, { color: colors.muted }]}>Désactiver le suivi</Text></Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExploreScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tout');
  const categories = ['Tout', 'Yoga', 'Fitness', 'Mobilité', 'Respiration'];
  const filtered = workouts.filter((item) => (category === 'Tout' || item.category === category) && `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<>
          <Text style={styles.pageTitle}>Explorer</Text><Text style={styles.pageLead}>Trouve la séance qui matche ton énergie.</Text>
          <View style={[styles.searchBox, shadows.soft]}><Ionicons name="search" size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher une séance" placeholderTextColor="#B49CBF" style={styles.searchInput} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filterChip, category === item && styles.filterActive]}><Text style={[styles.filterText, category === item && { color: 'white' }]}>{item}</Text></Pressable>)}</ScrollView>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>{filtered.length} séances</Text>
        </>}
        renderItem={({ item }) => <View style={{ marginBottom: 14 }}><WorkoutCard workout={item} navigation={navigation} /></View>}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="search-outline" size={40} color={colors.sage} /><Text style={styles.emptyTitle}>Aucune séance trouvée</Text><Text style={styles.muted}>Essaie une autre recherche.</Text></View>}
      />
    </SafeAreaView>
  );
}

function PlansScreen({ navigation }: any) {
  const { challengeProgress } = useStore();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Plans</Text><Text style={styles.pageLead}>Construis ta routine, un jour après l’autre.</Text>
        <SectionHeader title="Programmes guidés" />
        {programs.map((program) => (
          <Pressable key={program.id} onPress={() => navigation.navigate('Program', { id: program.id })} style={[styles.programCard, shadows.soft]}>
            <Image source={program.image} style={styles.programImage} />
            <View style={styles.programCopy}><Text style={styles.cardEyebrowDark}>{program.durationWeeks} SEMAINES</Text><Text style={styles.programTitle}>{program.title}</Text><Text style={styles.programDescription}>{program.description}</Text><View style={styles.inlineLink}><Text style={styles.inlineLinkText}>Découvrir</Text><Ionicons name="arrow-forward" size={16} color={colors.green} /></View></View>
          </Pressable>
        ))}
        <SectionHeader title="Défis" />
        {challenges.map((challenge) => {
          const progress = challengeProgress[challenge.id] ?? 0;
          return <Pressable key={challenge.id} onPress={() => navigation.navigate('Challenge', { id: challenge.id })} style={[styles.challengeCard, shadows.soft]}><Image source={challenge.image} style={styles.challengeImage} /><View style={{ flex: 1 }}><Text style={styles.challengeDays}>{challenge.days} JOURS</Text><Text style={styles.challengeTitle}>{challenge.title}</Text><View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${progress / challenge.days * 100}%` }]} /></View><Text style={styles.progressText}>{progress} sur {challenge.days} terminés</Text></View></Pressable>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoritesScreen({ navigation }: any) {
  const { favorites } = useStore();
  const saved = workouts.filter((item) => favorites.includes(item.id));
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList data={saved} keyExtractor={(item) => item.id} contentContainerStyle={styles.scrollContent} ListHeaderComponent={<><Text style={styles.pageTitle}>Favoris</Text><Text style={styles.pageLead}>Tes séances préférées, toujours à portée de main.</Text></>} renderItem={({ item }) => <View style={{ marginBottom: 14 }}><WorkoutCard workout={item} navigation={navigation} /></View>} ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="heart-outline" size={48} color={colors.sage} /><Text style={styles.emptyTitle}>Ta sélection est vide</Text><Text style={[styles.muted, { textAlign: 'center' }]}>Touche le cœur d’une séance pour la retrouver ici.</Text><View style={{ height: 18 }} /><PrimaryButton label="Explorer les séances" onPress={() => navigation.navigate('Explore')} /></View>} />
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation }: any) {
  const { profile, premium, reset } = useStore();
  const goal = goalOptions.find((item) => item.value === profile?.goal)?.label;
  return (
    <SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Profil</Text>
      <View style={styles.profileHeader}><View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>{profile?.firstName.charAt(0).toUpperCase()}</Text></View><View><Text style={styles.profileName}>{profile?.firstName === 'toi' ? 'Mon profil' : profile?.firstName}</Text><Text style={styles.muted}>{premium ? 'Membre Mandala Plus 💜' : 'Formule gratuite'}</Text></View></View>
      {!premium ? <Pressable onPress={() => navigation.navigate('Paywall')} style={[styles.upgradeCard, shadows.soft]}><LinearGradient colors={[colors.violet, colors.coral]} style={StyleSheet.absoluteFill} /><Ionicons name="sparkles" size={26} color="#FFE9F4" /><View style={{ flex: 1 }}><Text style={styles.upgradeTitle}>Débloquer Mandala Plus</Text><Text style={styles.upgradeText}>Programmes et séances premium</Text></View><Ionicons name="chevron-forward" color="white" size={22} /></Pressable> : null}
      <Text style={styles.settingsTitle}>MES PRÉFÉRENCES</Text>
      <View style={[styles.settingsCard, shadows.soft]}><ProfileRow icon="flag-outline" label="Objectif" value={goal ?? ''} /><ProfileRow icon="speedometer-outline" label="Niveau" value={levelOptions.find((item) => item.value === profile?.level)?.label ?? ''} last /></View>
      <Text style={styles.settingsTitle}>BIEN-ÊTRE</Text>
      <View style={[styles.settingsCard, shadows.soft]}><ProfileRow icon="moon-outline" label="Suivi de cycle" value="Personnaliser" /><ProfileRow icon="water-outline" label="Hydratation" value="Suivi quotidien" /><ProfileRow icon="happy-outline" label="Humeur & énergie" value="Chaque jour" last /></View>
      <Text style={styles.settingsTitle}>APPLICATION</Text>
      <View style={[styles.settingsCard, shadows.soft]}><ProfileRow icon="notifications-outline" label="Rappels" value="À configurer" /><ProfileRow icon="heart-outline" label="Apple Santé" value="À connecter" /><ProfileRow icon="help-circle-outline" label="Aide" value="" last /></View>
      <Pressable onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>Réinitialiser la démonstration</Text></Pressable>
    </ScrollView></SafeAreaView>
  );
}

function ProfileRow({ icon, label, value, last }: any) {
  return <View style={[styles.profileRow, last && { borderBottomWidth: 0 }]}><Ionicons name={icon} size={20} color={colors.green} /><Text style={styles.profileRowLabel}>{label}</Text><Text style={styles.profileRowValue}>{value}</Text><Ionicons name="chevron-forward" size={16} color="#C9AFC4" /></View>;
}

function WorkoutScreen({ route, navigation }: any) {
  const workout = workouts.find((item) => item.id === route.params.id)!;
  const { favorites, toggleWorkoutFavorite, markSessionDone } = useStore();
  const player = useVideoPlayer(workout.video, (instance) => { instance.loop = false; });
  return (
    <View style={styles.detailScreen}>
      <View style={styles.videoWrap}>
        <VideoView player={player} style={styles.video} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture />
        <SafeAreaView style={styles.videoTop} edges={['top']} pointerEvents="box-none"><Pressable onPress={() => navigation.goBack()} style={styles.overlayButton}><Ionicons name="arrow-back" size={22} color="white" /></Pressable><Pressable onPress={() => toggleWorkoutFavorite(workout.id)} style={styles.overlayButton}><Ionicons name={favorites.includes(workout.id) ? 'heart' : 'heart-outline'} size={22} color="white" /></Pressable></SafeAreaView>
      </View>
      <ScrollView contentContainerStyle={styles.detailContent}><Text style={styles.cardEyebrowDark}>{workout.category.toUpperCase()}</Text><Text style={styles.detailTitle}>{workout.title}</Text><Text style={styles.detailLead}>{workout.subtitle}</Text><View style={styles.workoutStatsRow}><Stat icon="time-outline" value={`${workout.duration} min`} /><Stat icon="flame-outline" value={`${workout.calories} kcal`} /><Stat icon="podium-outline" value={levelOptions.find((item) => item.value === workout.level)?.label ?? ''} /></View><Text style={styles.detailSectionTitle}>À propos</Text><Text style={styles.detailBody}>Une séance guidée conçue pour progresser à ton rythme. Respire, écoute ton corps et adapte chaque mouvement selon tes sensations.</Text><PrimaryButton label="Lancer la séance" onPress={() => player.play()} /><Pressable onPress={() => { markSessionDone(workout.id); navigation.goBack(); }} style={styles.resetButton}><Text style={styles.doneText}>✓ Séance terminée</Text></Pressable></ScrollView>
    </View>
  );
}

function Stat({ icon, value }: any) { return <View style={[styles.stat, shadows.soft]}><Ionicons name={icon} size={19} color={colors.green} /><Text style={styles.statPillValue}>{value}</Text></View>; }

function ProgramScreen({ route, navigation }: any) {
  const program = programs.find((item) => item.id === route.params.id)!;
  const items = program.workoutIds.map((id) => workouts.find((item) => item.id === id)!).filter(Boolean);
  return <SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.detailContent}><Pressable onPress={() => navigation.goBack()} style={styles.plainBack}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable><Image source={program.image} style={styles.detailHeroImage} /><Text style={styles.cardEyebrowDark}>{program.durationWeeks} SEMAINES · {items.length} SÉANCES</Text><Text style={styles.detailTitle}>{program.title}</Text><Text style={styles.detailLead}>{program.description}</Text><SectionHeader title="Au programme" />{items.map((item) => <View key={item.id} style={{ marginBottom: 14 }}><WorkoutCard workout={item} navigation={navigation} compact /></View>)}</ScrollView></SafeAreaView>;
}

function ChallengeScreen({ route, navigation }: any) {
  const challenge = challenges.find((item) => item.id === route.params.id)!;
  const { challengeProgress, advanceChallenge } = useStore();
  const progress = challengeProgress[challenge.id] ?? 0;
  return <SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.detailContent}><Pressable onPress={() => navigation.goBack()} style={styles.plainBack}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable><Image source={challenge.image} style={styles.detailHeroImage} /><Text style={styles.cardEyebrowDark}>DÉFI · {challenge.days} JOURS</Text><Text style={styles.detailTitle}>{challenge.title}</Text><Text style={styles.detailLead}>{challenge.description}</Text><View style={styles.bigProgress}><View style={[styles.bigProgressFill, { width: `${progress / challenge.days * 100}%` }]} /></View><Text style={styles.progressStrong}>{progress} jours terminés sur {challenge.days}</Text><View style={styles.dayGrid}>{Array.from({ length: challenge.days }, (_, index) => <View key={index} style={[styles.dayCell, index < progress && styles.dayCellDone]}><Text style={[styles.dayCellText, index < progress && { color: 'white' }]}>{index + 1}</Text></View>)}</View><PrimaryButton label={progress >= challenge.days ? 'Défi terminé ✓' : 'Valider la journée'} onPress={() => advanceChallenge(challenge.id, challenge.days)} /></ScrollView></SafeAreaView>;
}

function PaywallScreen({ navigation }: any) {
  const { activateDemoPremium } = useStore();
  const [annual, setAnnual] = useState(true);
  const activate = () => { activateDemoPremium(); navigation.goBack(); };
  return <View style={styles.paywall}><ImageBackground source={workouts[5].image} style={styles.paywallImage}><LinearGradient colors={['rgba(30,20,40,.05)', colors.black]} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.paywallTop} edges={['top']}><Pressable onPress={() => navigation.goBack()} style={styles.closeButton}><Ionicons name="close" size={24} color="white" /></Pressable></SafeAreaView></ImageBackground><SafeAreaView style={styles.paywallContent} edges={['bottom']}><View style={styles.brandPillDark}><Ionicons name="sparkles" color="#FFD9EC" size={16} /><Text style={styles.brandPillDarkText}>MANDALA PLUS</Text></View><Text style={styles.paywallTitle}>Toute ta pratique,{`\n`}sans limites.</Text><View style={styles.benefits}><Benefit text="Tous les entraînements et programmes" /><Benefit text="Programmes adaptés à ton cycle" /><Benefit text="Défis, suivi et nouveaux contenus chaque semaine" /></View><View style={styles.planToggle}><Pressable onPress={() => setAnnual(true)} style={[styles.priceOption, annual && styles.priceSelected]}><View><Text style={styles.priceName}>Annuel</Text><Text style={styles.priceDetail}>49,99 € / an</Text></View><View style={styles.saveBadge}><Text style={styles.saveText}>-58 %</Text></View></Pressable><Pressable onPress={() => setAnnual(false)} style={[styles.priceOption, !annual && styles.priceSelected]}><View><Text style={styles.priceName}>Mensuel</Text><Text style={styles.priceDetail}>9,99 € / mois</Text></View></Pressable></View><PrimaryButton label="Essayer gratuitement" onPress={activate} /><Text style={styles.paywallFine}>Démo uniquement : aucun achat n’est déclenché. RevenueCat et les produits App Store seront connectés avant publication.</Text></SafeAreaView></View>;
}

function MainTabs() {
  return <Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: '#B49CBF', tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel, tabBarIcon: ({ color, focused }) => { const icons: Record<string, keyof typeof Ionicons.glyphMap> = { Today: focused ? 'sunny' : 'sunny-outline', Explore: focused ? 'compass' : 'compass-outline', Plans: focused ? 'calendar' : 'calendar-outline', Favorites: focused ? 'heart' : 'heart-outline', Profile: focused ? 'person' : 'person-outline' }; return <Ionicons name={icons[route.name]} size={21} color={color} />; } })}><Tabs.Screen name="Today" component={HomeScreen} options={{ title: 'Aujourd’hui' }} /><Tabs.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explorer' }} /><Tabs.Screen name="Plans" component={PlansScreen} options={{ title: 'Plans' }} /><Tabs.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoris' }} /><Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} /></Tabs.Navigator>;
}

function AppNavigator() {
  const { hydrated, profile } = useStore();
  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={colors.green} size="large" /><Text style={styles.loadingText}>Mandala Yoga & Pilates</Text></View>;
  if (!profile) return <Onboarding />;
  return <NavigationContainer><Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}><Stack.Screen name="Main" component={MainTabs} /><Stack.Screen name="Workout" component={WorkoutScreen} /><Stack.Screen name="Program" component={ProgramScreen} /><Stack.Screen name="Challenge" component={ChallengeScreen} /><Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} /><Stack.Screen name="Cycle" component={CycleScreen} /></Stack.Navigator></NavigationContainer>;
}

export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><StoreProvider><AppNavigator /></StoreProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, scrollContent: { paddingHorizontal: 20, paddingBottom: 120 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream, gap: 12 }, loadingText: { fontSize: 17, fontWeight: '800', color: colors.green, letterSpacing: 1 },
  primaryButton: { minHeight: 58, borderRadius: 22, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, overflow: 'hidden' }, lightFill: { backgroundColor: 'white' }, primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 }, sectionTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 }, sectionAction: { color: colors.green, fontWeight: '700', fontSize: 13 },
  onboardingHero: { flex: 1 }, onboardingWelcome: { flex: 1, alignSelf: 'stretch', minWidth: 0, padding: 24, justifyContent: 'space-between' }, logoPlate: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.94)', paddingVertical: 8, paddingHorizontal: 13, borderRadius: 18 }, brandLogo: { width: 150, height: 88 }, onboardingCopy: { alignSelf: 'stretch', minWidth: 0 }, onboardingKicker: { color: '#F6C6DE', fontSize: 12, fontWeight: '900', letterSpacing: 1.6, marginBottom: 12 }, onboardingTitle: { color: 'white', fontSize: 42, lineHeight: 46, fontWeight: '900', letterSpacing: -1.5, marginBottom: 16, flexShrink: 1 }, onboardingLead: { color: 'rgba(255,255,255,.88)', fontSize: 17, lineHeight: 25, marginBottom: 28, flexShrink: 1 }, disclaimer: { color: 'rgba(255,255,255,.62)', textAlign: 'center', fontSize: 11, marginTop: 13 },
  onboardingForm: { flex: 1, backgroundColor: colors.cream }, progressTrack: { height: 4, backgroundColor: colors.blush }, progressFill: { height: 4, backgroundColor: colors.green }, backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', margin: 12 }, formBody: { flex: 1, paddingHorizontal: 24, paddingBottom: 22 }, formKicker: { color: colors.coral, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginTop: 8, marginBottom: 10 }, formTitle: { fontSize: 31, lineHeight: 37, fontWeight: '900', color: colors.ink, letterSpacing: -1 }, nameInput: { height: 56, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 17, fontSize: 16, marginTop: 22 }, optionGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', gap: 12, marginVertical: 20 }, goalOption: { width: '48%', minHeight: 112, backgroundColor: 'white', borderRadius: radius.md, padding: 17, justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border }, optionSelected: { backgroundColor: colors.green, borderColor: colors.green }, goalLabel: { color: colors.ink, fontWeight: '800', fontSize: 15 }, levelOption: { minHeight: 79, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, levelSelected: { borderColor: colors.green, borderWidth: 2 }, radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.sage }, radioSelected: { borderWidth: 6, borderColor: colors.green }, levelLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' }, levelDetail: { color: colors.muted, fontSize: 13, marginTop: 3 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 18 }, greeting: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 }, muted: { color: colors.muted, fontSize: 14, marginTop: 3 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontWeight: '900', fontSize: 17, color: colors.violet },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 }, statCard: { flex: 1, backgroundColor: 'white', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' }, statValue: { fontSize: 24, fontWeight: '900', color: colors.violet }, statLabel: { color: colors.muted, fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  heroCard: { height: 380, borderRadius: radius.lg, padding: 20, justifyContent: 'space-between', overflow: 'hidden' }, todayBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 30 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral }, todayBadgeText: { fontSize: 10, fontWeight: '900', color: colors.violet, letterSpacing: 1 }, heroTitle: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: -1.1 }, heroMeta: { color: 'rgba(255,255,255,.78)', fontSize: 14, marginTop: 7, marginBottom: 17 }, playButton: { alignSelf: 'flex-start', backgroundColor: '#FFE3F0', height: 47, borderRadius: 24, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', gap: 9 }, playButtonText: { color: colors.violet, fontWeight: '900' },
  phaseCard: { backgroundColor: 'white', borderRadius: radius.md, padding: 18, marginTop: 16, alignItems: 'center' }, phaseTip: { color: colors.ink, fontWeight: '700', textAlign: 'center', marginTop: 8, lineHeight: 20 }, phaseSub: { alignSelf: 'flex-start', color: colors.muted, fontSize: 12.5, fontWeight: '800', marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cycleInvite: { backgroundColor: 'white', borderRadius: radius.md, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 16 }, cycleInviteTitle: { color: colors.ink, fontWeight: '900', fontSize: 15.5 }, cycleInviteText: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, badgeChip: { backgroundColor: 'white', opacity: 0.55, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 11, alignItems: 'center', width: '32%', minWidth: 96, flexGrow: 1 }, badgeUnlocked: { opacity: 1, backgroundColor: colors.rosewater }, badgeLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 }, badgeLabelOn: { color: colors.violet },
  workoutCard: { height: 200, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.ink }, workoutCardCompact: { height: 130 }, workoutImage: { width: '100%', height: '100%' }, workoutImageCompact: { height: 130 }, workoutShade: { ...StyleSheet.absoluteFill }, favoriteButton: { position: 'absolute', right: 13, top: 13, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(30,20,40,.35)', alignItems: 'center', justifyContent: 'center' }, lockBadge: { position: 'absolute', left: 13, top: 13, backgroundColor: '#FFE3F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 }, lockText: { fontSize: 9, fontWeight: '900', letterSpacing: .7, color: colors.violet }, workoutCopy: { position: 'absolute', left: 17, bottom: 16, right: 17 }, cardEyebrow: { color: '#FFD9EC', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, workoutTitle: { color: 'white', fontSize: 23, fontWeight: '900', marginTop: 4 }, workoutSubtitle: { color: 'rgba(255,255,255,.78)', marginTop: 5, fontSize: 13 }, premiumBanner: { marginTop: 25, padding: 19, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: 13 }, premiumTitle: { color: 'white', fontWeight: '900', fontSize: 16 }, premiumText: { color: 'rgba(255,255,255,.72)', marginTop: 3, fontSize: 12 },
  pageTitle: { fontSize: 36, color: colors.ink, fontWeight: '900', letterSpacing: -1.3, marginTop: 15 }, pageLead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5, marginBottom: 24 }, searchBox: { height: 54, borderRadius: 18, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 9 }, searchInput: { flex: 1, fontSize: 15, color: colors.ink }, filterRow: { gap: 8, paddingVertical: 17 }, filterChip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 22, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.green, borderColor: colors.green }, filterText: { color: colors.ink, fontSize: 13, fontWeight: '700' }, emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 30 }, emptyTitle: { fontSize: 21, fontWeight: '900', color: colors.ink, marginTop: 14, marginBottom: 6 },
  programCard: { backgroundColor: 'white', borderRadius: radius.md, overflow: 'hidden', marginBottom: 15 }, programImage: { width: '100%', height: 180 }, programCopy: { padding: 18 }, cardEyebrowDark: { color: colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, programTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 6 }, programDescription: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 }, inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, inlineLinkText: { color: colors.green, fontWeight: '900' }, challengeCard: { backgroundColor: 'white', borderRadius: radius.md, padding: 12, flexDirection: 'row', gap: 14, marginBottom: 13 }, challengeImage: { width: 105, height: 120, borderRadius: 14 }, challengeDays: { color: colors.coral, fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 1 }, challengeTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 4 }, miniProgress: { height: 6, borderRadius: 3, backgroundColor: colors.blush, marginTop: 15 }, miniProgressFill: { height: 6, borderRadius: 3, backgroundColor: colors.green }, progressText: { color: colors.muted, fontSize: 10, marginTop: 5 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginVertical: 24 }, largeAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }, largeAvatarText: { fontSize: 26, fontWeight: '900', color: colors.violet }, profileName: { color: colors.ink, fontSize: 23, fontWeight: '900' }, upgradeCard: { borderRadius: radius.md, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden' }, upgradeTitle: { color: 'white', fontSize: 16, fontWeight: '900' }, upgradeText: { color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 3 }, settingsTitle: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginTop: 28, marginBottom: 9 }, settingsCard: { backgroundColor: 'white', borderRadius: radius.md, paddingHorizontal: 16 }, profileRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }, profileRowLabel: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' }, profileRowValue: { color: colors.muted, fontSize: 12 }, resetButton: { alignItems: 'center', padding: 20, marginTop: 15 }, resetText: { color: colors.coral, fontWeight: '800' }, doneText: { color: colors.green, fontWeight: '900', fontSize: 15 },
  cycleLengthRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, phaseInfoCard: { backgroundColor: 'white', borderRadius: radius.md, padding: 18 }, phaseInfoTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 }, phaseInfoText: { color: colors.muted, lineHeight: 21, marginTop: 6 },
  detailScreen: { flex: 1, backgroundColor: colors.cream }, videoWrap: { height: Platform.OS === 'web' ? 380 : 300, backgroundColor: colors.black }, video: { width: '100%', height: '100%' }, videoTop: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15 }, overlayButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,.38)', alignItems: 'center', justifyContent: 'center' }, detailContent: { padding: 20, paddingBottom: 70 }, detailTitle: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2, marginTop: 7 }, detailLead: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10 }, workoutStatsRow: { flexDirection: 'row', gap: 8, marginVertical: 24 }, stat: { flex: 1, backgroundColor: 'white', borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 6 }, statPillValue: { color: colors.ink, fontWeight: '800', fontSize: 11, textAlign: 'center' }, detailSectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 7 }, detailBody: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 25 }, plainBack: { width: 44, height: 44, justifyContent: 'center' }, detailHeroImage: { width: '100%', height: 260, borderRadius: radius.lg, marginBottom: 22 },
  bigProgress: { height: 10, borderRadius: 5, backgroundColor: colors.blush, marginTop: 28 }, bigProgressFill: { height: 10, borderRadius: 5, backgroundColor: colors.green }, progressStrong: { color: colors.ink, fontWeight: '800', marginTop: 9 }, dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginVertical: 25 }, dayCell: { width: 43, height: 43, borderRadius: 15, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, dayCellDone: { backgroundColor: colors.green, borderColor: colors.green }, dayCellText: { color: colors.ink, fontWeight: '900' },
  paywall: { flex: 1, backgroundColor: colors.black }, paywallImage: { height: '34%' }, paywallTop: { flex: 1, paddingHorizontal: 16 }, closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,.38)', alignItems: 'center', justifyContent: 'center' }, paywallContent: { flex: 1, backgroundColor: colors.black, paddingHorizontal: 24, paddingTop: 8 }, brandPillDark: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 20, backgroundColor: '#4A2A57' }, brandPillDarkText: { color: '#FFD9EC', fontWeight: '900', fontSize: 10, letterSpacing: 1 }, paywallTitle: { color: 'white', fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.1, marginTop: 13 }, benefits: { gap: 8, marginVertical: 16 }, benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, benefitText: { color: 'rgba(255,255,255,.85)', fontSize: 13 }, planToggle: { gap: 8, marginBottom: 14 }, priceOption: { minHeight: 60, borderRadius: 15, borderWidth: 1, borderColor: '#5C3D68', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, priceSelected: { borderColor: '#FFD9EC', borderWidth: 2, backgroundColor: '#3A2344' }, priceName: { color: 'white', fontWeight: '900', fontSize: 14 }, priceDetail: { color: 'rgba(255,255,255,.58)', fontSize: 11, marginTop: 2 }, saveBadge: { backgroundColor: '#FFD9EC', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10 }, saveText: { color: colors.violet, fontSize: 10, fontWeight: '900' }, paywallFine: { color: 'rgba(255,255,255,.45)', textAlign: 'center', fontSize: 9, lineHeight: 13, marginTop: 9 },
  disclaimerDark: { color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: 14 },
  tabBar: { height: Platform.OS === 'ios' ? 86 : 69, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 23 : 9, borderTopWidth: 0, backgroundColor: 'rgba(255,255,255,.98)' }, tabLabel: { fontSize: 10, fontWeight: '700' },
});

function Benefit({ text }: { text: string }) { return <View style={styles.benefitRow}><Ionicons name="checkmark-circle" size={20} color="#FFD9EC" /><Text style={styles.benefitText}>{text}</Text></View>; }
