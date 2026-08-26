import { Workout } from '../types';

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export const phaseInfo: Record<Phase, { label: string; emoji: string; tip: string }> = {
  menstrual: { label: 'Phase menstruelle', emoji: '🌙', tip: 'Douceur et écoute : respiration, yoga doux, étirements.' },
  follicular: { label: 'Phase folliculaire', emoji: '🌱', tip: 'Énergie qui remonte : flows dynamiques et renforcement.' },
  ovulatory: { label: 'Ovulation', emoji: '☀️', tip: 'Pic d’énergie : séances intenses et défis.' },
  luteal: { label: 'Phase lutéale', emoji: '🍂', tip: 'Ralentir en douceur : pilates modéré, mobilité, respiration.' },
};

export function dayInCycle(periodStart: string, today: string): number {
  const start = new Date(`${periodStart}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  return Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000) + 1);
}

export function phaseFromDay(day: number, cycleLength = 28): Phase {
  if (day <= 5) return 'menstrual';
  if (day <= 13 && cycleLength >= 26) return 'follicular';
  if (day === 14 || (day >= 12 && day <= 16 && cycleLength < 26)) return 'ovulatory';
  if (day <= Math.min(17, cycleLength - 8)) return 'follicular';
  if (day <= Math.min(18, cycleLength - 6)) return 'ovulatory';
  return 'luteal';
}

const gentleCategories = ['Respiration', 'Yoga', 'Mobilité'];
const energeticGoals = ['strength', 'energy'];

export function recommendForPhase(available: Workout[], phase: Phase, count: number): Workout[] {
  const scored = [...available].sort((a, b) => score(b, phase) - score(a, phase));
  return scored.slice(0, count);
}

function score(workout: Workout, phase: Phase): number {
  if (phase === 'menstrual') {
    let s = 0;
    if (gentleCategories.includes(workout.category)) s += 2;
    if (workout.level === 'beginner') s += 1;
    if (workout.duration <= 15) s += 1;
    return s;
  }
  if (phase === 'ovulatory') {
    let s = 0;
    if (workout.goals.some((g) => energeticGoals.includes(g))) s += 2;
    if (workout.duration >= 20) s += 1;
    return s;
  }
  if (phase === 'follicular') {
    let s = 1;
    if (workout.goals.includes('energy')) s += 1;
    if (workout.duration >= 10) s += 1;
    return s;
  }
  let s = 0;
  if (gentleCategories.includes(workout.category)) s += 1;
  if (workout.goals.includes('mobility')) s += 1;
  return s;
}
