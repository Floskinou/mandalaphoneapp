import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { toggleFavorite } from '../domain/favorites';
import { SessionLog, logSession } from '../domain/stats';
import { Profile } from '../types';

const STORAGE_KEY = '@mandala-pilates/state-v1';

type AppState = {
  profile: Profile | null;
  favorites: string[];
  premium: boolean;
  challengeProgress: Record<string, number>;
  sessions: SessionLog;
  water: string[];
  moods: Record<string, string>;
  cycle: { enabled: boolean; periodStart: string | null; cycleLength: number } | null;
};

type Store = AppState & {
  hydrated: boolean;
  completeOnboarding: (profile: Profile) => void;
  toggleWorkoutFavorite: (id: string) => void;
  activateDemoPremium: () => void;
  advanceChallenge: (id: string, max: number) => void;
  markSessionDone: (workoutId: string) => void;
  toggleWater: () => void;
  setMood: (mood: string) => void;
  setCycle: (cycle: AppState['cycle']) => void;
  reset: () => void;
};

const initialState: AppState = {
  profile: null,
  favorites: [],
  premium: false,
  challengeProgress: { 'challenge-pilates-6': 1 },
  sessions: {},
  water: [],
  moods: {},
  cycle: null,
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => value && setState({ ...initialState, ...JSON.parse(value) }))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<Store>(() => ({
    ...state,
    hydrated,
    completeOnboarding: (profile) => setState((current) => ({ ...current, profile })),
    toggleWorkoutFavorite: (id) => setState((current) => ({
      ...current,
      favorites: toggleFavorite(current.favorites, id),
    })),
    activateDemoPremium: () => setState((current) => ({ ...current, premium: true })),
    advanceChallenge: (id, max) => setState((current) => ({
      ...current,
      challengeProgress: {
        ...current.challengeProgress,
        [id]: Math.min((current.challengeProgress[id] ?? 0) + 1, max),
      },
    })),
    markSessionDone: (workoutId) => setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      return { ...current, sessions: logSession(current.sessions, today, workoutId) };
    }),
    toggleWater: () => setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      return { ...current, water: current.water.includes(today) ? current.water.filter((d) => d !== today) : [...current.water, today] };
    }),
    setMood: (mood) => setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      return { ...current, moods: { ...current.moods, [today]: mood } };
    }),
    setCycle: (cycle) => setState((current) => ({ ...current, cycle })),
    reset: () => setState(initialState),
  }), [state, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within StoreProvider');
  return store;
}
