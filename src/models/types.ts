export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  targetDays: number;
  createdAt: string;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // yyyy-MM-dd
  completedAt: string;
}

export interface HabitWithStatus extends Habit {
  completedToday: boolean;
  currentStreak: number;
  totalCompletions: number;
}
