import { Workout } from '../types';

export type SessionLog = Record<string, string[]>;

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dayKeyOffset(base: string, offset: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

export function logSession(log: SessionLog, day: string, workoutId: string): SessionLog {
  const existing = log[day] ?? [];
  if (existing.includes(workoutId)) return log;
  return { ...log, [day]: [...existing, workoutId] };
}

export function minutesThisWeek(log: SessionLog, workouts: Workout[], days: string[]): number {
  const byId = new Map(workouts.map((w) => [w.id, w]));
  return days.reduce(
    (total, day) => total + (log[day] ?? []).reduce((sum, id) => sum + (byId.get(id)?.duration ?? 0), 0),
    0,
  );
}

export function lastNDays(n: number, endDate = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });
}

export function currentStreak(log: SessionLog, today: string): number {
  if (!log[today]?.length) return 0;
  let streak = 0;
  const [y, m, d] = today.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!log[key]?.length) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type BadgeState = {
  sessions: number;
  streak: number;
  hydratedToday: boolean;
  moodEntries: number;
  challengeJoined: boolean;
};

export type Badge = { id: string; label: string; emoji: string; unlocked: boolean };

export function badges(state: BadgeState, activeDays: string[]): Badge[] {
  const totalSessions = Object.values(activeDays).length >= 0 ? state.sessions : state.sessions;
  return [
    { id: 'first-session', label: 'Première séance', emoji: '🌸', unlocked: totalSessions >= 1 },
    { id: 'streak-3', label: '3 jours d’affilée', emoji: '✨', unlocked: state.streak >= 3 },
    { id: 'streak-7', label: 'Une semaine complète', emoji: '🏆', unlocked: state.streak >= 7 },
    { id: 'hydrated', label: 'Bien hydratée', emoji: '💧', unlocked: state.hydratedToday },
    { id: 'mood', label: 'Écoute de soi', emoji: '🪞', unlocked: state.moodEntries >= 1 },
    { id: 'challenge', label: 'Défi relevé', emoji: '🎯', unlocked: state.challengeJoined },
  ];
}
