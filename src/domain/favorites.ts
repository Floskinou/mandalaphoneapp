export function toggleFavorite(favorites: string[], workoutId: string): string[] {
  return favorites.includes(workoutId)
    ? favorites.filter((id) => id !== workoutId)
    : [...favorites, workoutId];
}
