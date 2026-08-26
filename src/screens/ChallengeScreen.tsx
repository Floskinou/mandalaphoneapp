import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import PrimaryButton from '../components/PrimaryButton';
import { useContent } from '../data/useContent';
import { useStore } from '../store/StoreContext';
import { colors, radius } from '../theme';

export default function ChallengeScreen({ route, navigation }: any) {
  const content = useContent();
  const challenge = content.challenges.find((item) => item.id === route.params.id);
  const { challengeProgress, advanceChallenge } = useStore();
  if (!challenge) return null;
  const progress = challengeProgress[challenge.id] ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable>
        <Image source={challenge.image} style={styles.heroImage} />
        <Text style={styles.eyebrow}>DÉFI · {challenge.days} JOURS</Text>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.lead}>{challenge.description}</Text>
        <View style={styles.bigProgress}><View style={[styles.bigProgressFill, { width: `${progress / challenge.days * 100}%` }]} /></View>
        <Text style={styles.progressStrong}>{progress} jours terminés sur {challenge.days}</Text>
        <View style={styles.dayGrid}>
          {Array.from({ length: challenge.days }, (_, index) => (
            <View key={index} style={[styles.dayCell, index < progress && styles.dayCellDone]}>
              <Text style={[styles.dayCellText, index < progress && { color: 'white' }]}>{index + 1}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton label={progress >= challenge.days ? 'Défi terminé ✓' : 'Valider la journée'} onPress={() => advanceChallenge(challenge.id, challenge.days)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, content: { padding: 20, paddingBottom: 70 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: 8 },
  heroImage: { width: '100%', height: 260, borderRadius: radius.lg, marginBottom: 22 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -1.1, marginTop: 7 },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  bigProgress: { height: 10, borderRadius: 5, backgroundColor: colors.blush, marginTop: 28 }, bigProgressFill: { height: 10, borderRadius: 5, backgroundColor: colors.green }, progressStrong: { color: colors.ink, fontWeight: '800', marginTop: 9 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginVertical: 25 }, dayCell: { width: 43, height: 43, borderRadius: 15, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, dayCellDone: { backgroundColor: colors.green, borderColor: colors.green }, dayCellText: { color: colors.ink, fontWeight: '900' },
});
