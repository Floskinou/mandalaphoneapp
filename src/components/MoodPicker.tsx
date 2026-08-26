import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const MOODS = [
  { id: 'energique', emoji: '⚡', label: 'Énergique' },
  { id: 'calme', emoji: '🌿', label: 'Calme' },
  { id: 'fatiguee', emoji: '🌙', label: 'Fatiguée' },
  { id: 'stressee', emoji: '💧', label: 'Stressée' },
  { id: 'joyeuse', emoji: '✨', label: 'Joyeuse' },
  { id: 'sensible', emoji: '🫧', label: 'Sensible' },
];

export default function MoodPicker({ selected, onSelect }: { selected?: string; onSelect: (mood: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Comment te sens-tu aujourd’hui ?</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={[styles.chip, selected === m.id && styles.chipActive]}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.label, selected === m.id && styles.labelActive]}>{m.label}</Text>
            {selected === m.id ? <Ionicons name="checkmark-circle" size={14} color={colors.green} style={{ position: 'absolute', top: 6, right: 6 }} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  title: { color: colors.ink, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
    minWidth: 96,
    gap: 3,
  },
  chipActive: { borderColor: colors.green, backgroundColor: colors.rosewater },
  emoji: { fontSize: 21 },
  label: { color: colors.muted, fontSize: 11.5, fontWeight: '700' },
  labelActive: { color: colors.violet },
});
