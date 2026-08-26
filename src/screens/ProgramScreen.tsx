import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import { useContent } from '../data/useContent';
import { colors, radius } from '../theme';

const Pressable = require('react-native').Pressable;

export default function ProgramScreen({ route, navigation }: any) {
  const content = useContent();
  const program = content.programs.find((item) => item.id === route.params.id);
  if (!program) return null;
  const items = program.workoutIds
    .map((id: string) => content.workouts.find((w) => w.id === id))
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <Image source={program.image} style={styles.heroImage} />
        <Text style={styles.eyebrow}>{program.durationWeeks} SEMAINES · {items.length} SÉANCES</Text>
        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.lead}>{program.description}</Text>
        <Text style={styles.sectionTitle}>Au programme</Text>
        {items.map((item: any) => (
          <View key={item.id} style={{ marginBottom: 14 }}>
            <WorkoutCard workout={item} navigation={navigation} compact />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 70 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: 8 },
  heroImage: { width: '100%', height: 260, borderRadius: radius.lg, marginBottom: 22 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -1.1, marginTop: 7 },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 24, marginBottom: 14 },
});
