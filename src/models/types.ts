export const CATEGORIES = [
  { key: 'Salud', color: '#FF6B6B', icon: '❤️' },
  { key: 'Ejercicio', color: '#FF8C42', icon: '💪' },
  { key: 'Educación', color: '#4ECDC4', icon: '📚' },
  { key: 'Productividad', color: '#6C63FF', icon: '⚡' },
  { key: 'Bienestar', color: '#A8E6CF', icon: '🌿' },
  { key: 'Social', color: '#FFD93D', icon: '👥' },
] as const;

export type CategoryKey = typeof CATEGORIES[number]['key'];

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  targetDays: number;
  category: string;
  createdAt: string;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // yyyy-MM-dd
  completedAt: string;
  note?: string;
}

export interface HabitWithStatus extends Habit {
  completedToday: boolean;
  currentStreak: number;
  totalCompletions: number;
  weekCompletions: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface Settings {
  startOfWeek: 'monday' | 'sunday';
  theme: 'light';
}
