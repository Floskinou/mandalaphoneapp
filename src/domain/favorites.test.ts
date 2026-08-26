import { toggleFavorite } from './favorites';

describe('toggleFavorite', () => {
  it('adds a missing workout', () => {
    expect(toggleFavorite([], 'flow-1')).toEqual(['flow-1']);
  });

  it('removes an existing workout', () => {
    expect(toggleFavorite(['flow-1', 'hiit-1'], 'flow-1')).toEqual(['hiit-1']);
  });
});
