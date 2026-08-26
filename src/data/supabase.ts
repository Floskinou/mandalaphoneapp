import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Challenge, Program, Workout, Goal, Level } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ldnybpkzhcmzvneyaqfi.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbnlicGt6aGNtenZuZXlhcWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQwNzksImV4cCI6MjEwMzMxMDA3OX0.4KV2qyv7S5arvxmkbjRpBBAw8NaLteJJfYm1sdOBjAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage as any, autoRefreshToken: true, persistSession: true },
});

type WorkoutRow = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration_min: number;
  category_id: string | null;
  level: Level;
  goals: string[] | null;
  video_url: string;
  thumbnail_url: string | null;
  premium: boolean;
  calories: number;
};

const CATEGORY_LABELS: Record<string, Workout['category']> = {
  yoga: 'Yoga',
  pilates: 'Fitness',
  mobilite: 'Mobilité',
  respiration: 'Respiration',
};

function rowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    duration: row.duration_min,
    level: row.level,
    category: CATEGORY_LABELS[row.category_id ?? ''] ?? 'Fitness',
    goals: ((row.goals ?? []) as Goal[]),
    image: { uri: row.thumbnail_url ?? '' },
    video: row.video_url,
    premium: row.premium,
    calories: row.calories,
  };
}

export async function fetchWorkouts(): Promise<{ workouts: Workout[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    if (error) return { workouts: [], error: error.message };
    return { workouts: (data ?? []).map(rowToWorkout), error: null };
  } catch (e: any) {
    return { workouts: [], error: e?.message ?? 'Erreur réseau Supabase' };
  }
}

export async function fetchPrograms(): Promise<Program[]> {
  const { data } = await supabase
    .from('programs')
    .select('*, program_workouts(workout_id)')
    .eq('published', true);
  return (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    durationWeeks: p.duration_weeks,
    image: { uri: p.thumbnail_url },
    workoutIds: (p.program_workouts ?? []).map((pw: any) => pw.workout_id),
  }));
}

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from('challenges')
    .select('*, challenge_workouts(workout_id)')
    .eq('published', true);
  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    days: c.days,
    image: { uri: c.thumbnail_url },
    workoutIds: (c.challenge_workouts ?? [])
      .sort((a: any, b: any) => a.day_number - b.day_number)
      .map((cw: any) => cw.workout_id),
  }));
}
