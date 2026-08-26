import { buildWeeklyPlan } from './plan';
import { workouts } from '../data/content';

describe('buildWeeklyPlan', () => {
  it('prioritizes the selected goal and keeps a free first session', () => {
    const plan = buildWeeklyPlan(workouts, { goal: 'strength', level: 'beginner' });

    expect(plan).toHaveLength(3);
    expect(new Set(plan.map((item) => item.id)).size).toBe(3);
    expect(plan[0].premium).toBe(false);
    expect(plan.some((item) => item.goals.includes('strength'))).toBe(true);
  });

  it('falls back to available sessions when a goal has few matches', () => {
    const plan = buildWeeklyPlan(workouts, { goal: 'mobility', level: 'advanced' });
    expect(plan).toHaveLength(3);
  });
});
