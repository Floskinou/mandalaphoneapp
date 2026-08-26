import { Goal, Level, Workout } from '../types';

export function buildWeeklyPlan(
  available: Workout[],
  preferences: { goal: Goal; level: Level },
): Workout[] {
  const ranked = [...available].sort((a, b) => {
    const aScore = (a.goals.includes(preferences.goal) ? 2 : 0) + (a.level === preferences.level ? 1 : 0);
    const bScore = (b.goals.includes(preferences.goal) ? 2 : 0) + (b.level === preferences.level ? 1 : 0);
    return bScore - aScore;
  });

  const firstFree = ranked.find((workout) => !workout.premium);
  const remainder = ranked.filter((workout) => workout.id !== firstFree?.id);
  return [...(firstFree ? [firstFree] : []), ...remainder].slice(0, 3);
}
