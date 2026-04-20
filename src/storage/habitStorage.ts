import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, Completion, Settings } from '../models/types';

const HABITS_KEY = '@habits';
const COMPLETIONS_KEY = '@completions';
const SETTINGS_KEY = '@settings';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─── Settings ──────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : { startOfWeek: 'monday', theme: 'light' };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Habits ────────────────────────────────────────────

export async function getHabits(): Promise<Habit[]> {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  const habits: Habit[] = raw ? JSON.parse(raw) : [];
  return habits.map(h => ({ ...h, category: h.category || '' }));
}

export async function getHabit(id: string): Promise<Habit | null> {
  const habits = await getHabits();
  return habits.find(h => h.id === id) || null;
}

export async function saveHabit(habit: Omit<Habit, 'id' | 'createdAt'> & { id?: string }): Promise<Habit> {
  const habits = await getHabits();
  if (habit.id) {
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx !== -1) {
      habits[idx] = { ...habits[idx], ...habit } as Habit;
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
      return habits[idx];
    }
  }
  const newHabit: Habit = {
    id: generateId(),
    name: habit.name,
    description: habit.description,
    color: habit.color,
    targetDays: habit.targetDays,
    category: habit.category || '',
    createdAt: new Date().toISOString(),
  };
  habits.push(newHabit);
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  return newHabit;
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await getHabits();
  const filtered = habits.filter(h => h.id !== id);
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(filtered));
  // Also delete completions for this habit
  const completions = await getCompletions();
  const filteredComps = completions.filter(c => c.habitId !== id);
  await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(filteredComps));
}

// ─── Completions ───────────────────────────────────────

export async function getCompletions(): Promise<Completion[]> {
  const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getCompletionsForHabit(habitId: string): Promise<Completion[]> {
  const completions = await getCompletions();
  return completions.filter(c => c.habitId === habitId);
}

export async function toggleCompletion(habitId: string, date?: string, note?: string): Promise<boolean> {
  const targetDate = date || getTodayString();
  const completions = await getCompletions();
  const existing = completions.findIndex(
    c => c.habitId === habitId && c.date === targetDate
  );

  if (existing !== -1) {
    completions.splice(existing, 1);
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    return false; // unchecked
  } else {
    completions.push({
      id: generateId(),
      habitId,
      date: targetDate,
      completedAt: new Date().toISOString(),
      note: note || undefined,
    });
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    return true; // checked
  }
}

export async function isCompletedToday(habitId: string): Promise<boolean> {
  const today = getTodayString();
  const completions = await getCompletions();
  return completions.some(c => c.habitId === habitId && c.date === today);
}

// ─── Stats ─────────────────────────────────────────────

export async function getCurrentStreak(habitId: string): Promise<number> {
  const completions = await getCompletionsForHabit(habitId);
  const dates = new Set(completions.map(c => c.date));

  let streak = 0;
  const today = new Date();
  const current = new Date(today);

  while (true) {
    const dateStr = getDateString(current);
    if (dates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getTotalCompletions(habitId: string): Promise<number> {
  const completions = await getCompletionsForHabit(habitId);
  return completions.length;
}

export async function getWeekCompletions(habitId: string): Promise<number> {
  const completions = await getCompletionsForHabit(habitId);
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const mondayStr = getDateString(monday);
  return completions.filter(c => c.date >= mondayStr).length;
}

export async function getCompletionsForDate(date: string): Promise<Completion[]> {
  const completions = await getCompletions();
  return completions.filter(c => c.date === date);
}

export async function getAllData(): Promise<{ habits: Habit[]; completions: Completion[]; settings: Settings }> {
  const habits = await getHabits();
  const completions = await getCompletions();
  const settings = await getSettings();
  return { habits, completions, settings };
}

export async function importAllData(data: { habits: Habit[]; completions: Completion[]; settings?: Settings }): Promise<void> {
  if (data.habits) await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
  if (data.completions) await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(data.completions));
  if (data.settings) await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(HABITS_KEY);
  await AsyncStorage.removeItem(COMPLETIONS_KEY);
  await AsyncStorage.removeItem(SETTINGS_KEY);
}

export async function updateCompletionNote(completionId: string, note: string): Promise<void> {
  const completions = await getCompletions();
  const idx = completions.findIndex(c => c.id === completionId);
  if (idx !== -1) {
    completions[idx].note = note || undefined;
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  }
}

export { getTodayString, getDateString };
