import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { challenges as localChallenges, programs as localPrograms, workouts as localWorkouts } from './content';
import { fetchChallenges, fetchPrograms, fetchWorkouts } from './supabase';
import { Challenge, Program, Workout } from '../types';

let cached: { workouts: Workout[]; programs: Program[]; challenges: Challenge[] } | null = null;

/**
 * Charge les contenus depuis Supabase.
 * En cas d'erreur réseau (hors-ligne, table absente…), bascule silencieusement
 * sur le catalogue embarqué pour que l'app reste utilisable en démonstration.
 */
export function useContent() {
  const [data, setData] = useState(cached ?? {
    workouts: localWorkouts,
    programs: localPrograms,
    challenges: localChallenges,
  });
  const [loading, setLoading] = useState(!cached);
  const [source, setSource] = useState<'supabase' | 'local'>(cached ? 'supabase' : 'local');

  useEffect(() => {
    if (cached) return;
    let alive = true;
    (async () => {
      const [w, p, c] = await Promise.all([fetchWorkouts(), fetchPrograms(), fetchChallenges()]);
      if (!alive) return;
      if (!w.error && w.workouts.length > 0) {
        cached = { workouts: w.workouts, programs: p.length ? p : localPrograms, challenges: c.length ? c : localChallenges };
        setData(cached);
        setSource('supabase');
      } else {
        setSource('local');
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { ...data, loading, source };
}
