import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const GOAL = 8;

export default function WaterTracker({ glasses, onToggle }: { glasses: string[]; onToggle: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const done = glasses.includes(today);
  const count = done ? Math.min(GOAL, (glasses.filter((d) => d === today).length || 1) + 0) : 0;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="water" size={20} color={colors.coral} />
        <Text style={styles.title}>Hydratation</Text>
        <Text style={styles.count}>{count}/{GOAL}</Text>
      </View>
      <View style={styles.glasses}>
        {Array.from({ length: GOAL }, (_, i) => (
          <Pressable key={i} onPress={onToggle} style={[styles.glass, i < count && styles.glassFull]}>
            <Ionicons name="water" size={18} color={i < count ? 'white' : '#E8C7D8'} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 22, padding: 18, marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.ink, fontWeight: '800', fontSize: 15, flex: 1 },
  count: { color: colors.coral, fontWeight: '900', fontSize: 14 },
  glasses: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  glass: {
    width: 34, height: 42, borderRadius: 12, backgroundColor: colors.rosewater,
    alignItems: 'center', justifyContent: 'center',
  },
  glassFull: { backgroundColor: colors.coral },
});
