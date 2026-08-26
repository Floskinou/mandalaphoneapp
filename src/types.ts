import type { ImageSourcePropType } from 'react-native';

export type Goal = 'strength' | 'energy' | 'mobility' | 'relaxation';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Workout = {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  level: Level;
  category: 'Yoga' | 'Fitness' | 'Mobilité' | 'Respiration';
  goals: Goal[];
  image: ImageSourcePropType;
  video: string | number;
  premium: boolean;
  calories: number;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  image: ImageSourcePropType;
  workoutIds: string[];
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  days: number;
  image: ImageSourcePropType;
  workoutIds: string[];
};

export type Profile = {
  firstName: string;
  goal: Goal;
  level: Level;
};
