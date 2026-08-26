import { badges, currentStreak, logSession, minutesThisWeek } from './stats';
import { Workout } from '../types';

const sample = [
  { id: 'a', duration: 10 },
  { id: 'b', duration: 20 },
] as unknown as Workout[];

describe('logSession', () => {
  it('appends a session id for the day', () => {
    const next = logSession({}, '2026-08-21', 'flow-1');
    expect(next['2026-08-21']).toEqual(['flow-1']);
  });

  it('does not duplicate the same session', () => {
    const next = logSession({ '2026-08-21': ['flow-1'] }, '2026-08-21', 'flow-1');
    expect(next['2026-08-21']).toEqual(['flow-1']);
  });
});

describe('minutesThisWeek', () => {
  it('sums durations across the given days', () => {
    const log = { '2026-08-20': ['a'], '2026-08-21': ['a', 'b'] };
    expect(minutesThisWeek(log, sample, ['2026-08-19', '2026-08-20', '2026-08-21'])).toBe(40);
  });
});

describe('currentStreak', () => {
  it('counts consecutive active days ending today', () => {
    const log = { '2026-08-20': ['a'], '2026-08-21': ['b'] };
    expect(currentStreak(log, '2026-08-21')).toBe(2);
  });

  it('returns zero when today is empty', () => {
    expect(currentStreak({ '2026-08-20': ['a'] }, '2026-08-21')).toBe(0);
  });
});

describe('badges', () => {
  it('unlocks the first session badge', () => {
    const unlocked = badges(
      { sessions: 1, streak: 0, hydratedToday: false, moodEntries: 0, challengeJoined: false },
      ['2026-08-21'],
    ).filter((b) => b.unlocked);
    expect(unlocked.map((b) => b.id)).toContain('first-session');
  });
});
