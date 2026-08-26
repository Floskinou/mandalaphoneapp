import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContent } from '../data/useContent';
import { useStore } from '../store/StoreContext';
import { colors, radius, shadows } from '../theme';

export default function PlansScreen({ navigation }: any) {
  const content = useContent();
  const { challengeProgress } = useStore();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Plans</Text><Text style={styles.pageLead}>Construis ta routine, un jour après l’autre.</Text>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Programmes guidés</Text></View>
        {content.programs.map((program) => (
          <Pressable key={program.id} onPress={() => navigation.navigate('Program', { id: program.id })} style={[styles.programCard, shadows.soft]}>
            <Image source={program.image} style={styles.programImage} />
            <View style={styles.programCopy}><Text style={styles.cardEyebrowDark}>{program.durationWeeks} SEMAINES</Text><Text style={styles.programTitle}>{program.title}</Text><Text style={styles.programDescription}>{program.description}</Text><View style={styles.inlineLink}><Text style={styles.inlineLinkText}>Découvrir</Text><Ionicons name="arrow-forward" size={16} color={colors.green} /></View></View>
          </Pressable>
        ))}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Défis</Text></View>
        {content.challenges.map((challenge) => {
          const progress = challengeProgress[challenge.id] ?? 0;
          return <Pressable key={challenge.id} onPress={() => navigation.navigate('Challenge', { id: challenge.id })} style={[styles.challengeCard, shadows.soft]}><Image source={challenge.image} style={styles.challengeImage} /><View style={{ flex: 1 }}><Text style={styles.challengeDays}>{challenge.days} JOURS</Text><Text style={styles.challengeTitle}>{challenge.title}</Text><View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${progress / challenge.days * 100}%` }]} /></View><Text style={styles.progressText}>{progress} sur {challenge.days} terminés</Text></View></Pressable>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  pageTitle: { fontSize: 36, color: colors.ink, fontWeight: '900', letterSpacing: -1.3, marginTop: 15 }, pageLead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5, marginBottom: 24 },
  sectionHeader: { marginTop: 10, marginBottom: 15 }, sectionTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  programCard: { backgroundColor: 'white', borderRadius: radius.md, overflow: 'hidden', marginBottom: 15 }, programImage: { width: '100%', height: 180 }, programCopy: { padding: 18 }, cardEyebrowDark: { color: colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, programTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 6 }, programDescription: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 }, inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, inlineLinkText: { color: colors.green, fontWeight: '900' },
  challengeCard: { backgroundColor: 'white', borderRadius: radius.md, padding: 12, flexDirection: 'row', gap: 14, marginBottom: 13 }, challengeImage: { width: 105, height: 120, borderRadius: 14 }, challengeDays: { color: colors.coral, fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 1 }, challengeTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 4 }, miniProgress: { height: 6, borderRadius: 3, backgroundColor: colors.blush, marginTop: 15 }, miniProgressFill: { height: 6, borderRadius: 3, backgroundColor: colors.green }, progressText: { color: colors.muted, fontSize: 10, marginTop: 5 },
});
