import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/StoreContext';
import { colors, shadows } from '../theme';
import { Workout } from '../types';

export default function WorkoutCard({ workout, navigation, compact = false }: { workout: Workout; navigation: any; compact?: boolean }) {
  const { favorites, toggleWorkoutFavorite, premium } = useStore();
  const isFavorite = favorites.includes(workout.id);
  return (
    <Pressable
      onPress={() => navigation.navigate(workout.premium && !premium ? 'Paywall' : 'Workout', { id: workout.id })}
      style={[styles.card, compact && styles.cardCompact, shadows.soft]}
    >
      <Image source={workout.image} style={[styles.image, compact && styles.imageCompact]} />
      <LinearGradient colors={['transparent', 'rgba(30,20,36,.55)']} style={StyleSheet.absoluteFill} />
      <Pressable onPress={() => toggleWorkoutFavorite(workout.id)} hitSlop={12} style={styles.favButton}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} color="white" size={20} />
      </Pressable>
      {workout.premium && !premium ? (
        <View style={styles.lockBadge}><Ionicons name="lock-closed" size={11} color={colors.violet} /><Text style={styles.lockText}>PLUS</Text></View>
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{workout.category.toUpperCase()} · {workout.duration} MIN</Text>
        <Text style={styles.title}>{workout.title}</Text>
        {!compact ? <Text numberOfLines={1} style={styles.subtitle}>{workout.subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1E1424' },
  cardCompact: { height: 130 },
  image: { width: '100%', height: '100%' },
  imageCompact: { height: 130 },
  favButton: { position: 'absolute', right: 13, top: 13, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(30,20,40,.35)', alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', left: 13, top: 13, backgroundColor: '#FFE3F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockText: { fontSize: 9, fontWeight: '900', letterSpacing: .7, color: colors.violet },
  copy: { position: 'absolute', left: 17, bottom: 16, right: 17 },
  eyebrow: { color: '#FFD9EC', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: 'white', fontSize: 23, fontWeight: '900', marginTop: 4 },
  subtitle: { color: 'rgba(255,255,255,.78)', marginTop: 5, fontSize: 13 },
});
