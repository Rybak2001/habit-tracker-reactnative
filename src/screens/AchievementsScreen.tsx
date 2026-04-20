import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  getCompletions,
  getCurrentStreak,
  getTotalCompletions,
  getDateString,
} from '../storage/habitStorage';

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  habitCount: number;
  totalCompletions: number;
  maxStreak: number;
  allCompletedToday: boolean;
  streaks: number[];
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_habit', title: 'Primer paso', description: 'Crear tu primer hábito', icon: '🌱', color: '#A8E6CF',
    check: (ctx) => ctx.habitCount >= 1 },
  { id: 'streak_7', title: 'Una semana', description: 'Racha de 7 días', icon: '🔥', color: '#FF8C42',
    check: (ctx) => ctx.maxStreak >= 7 },
  { id: 'streak_14', title: 'Dos semanas', description: 'Racha de 14 días', icon: '💪', color: '#FF6B6B',
    check: (ctx) => ctx.maxStreak >= 14 },
  { id: 'streak_30', title: 'Un mes', description: 'Racha de 30 días', icon: '⭐', color: '#FFD93D',
    check: (ctx) => ctx.maxStreak >= 30 },
  { id: 'streak_60', title: 'Dos meses', description: 'Racha de 60 días', icon: '🏅', color: '#FF69B4',
    check: (ctx) => ctx.maxStreak >= 60 },
  { id: 'streak_100', title: 'Centenario', description: 'Racha de 100 días', icon: '👑', color: '#6C63FF',
    check: (ctx) => ctx.maxStreak >= 100 },
  { id: 'comp_10', title: 'Constante', description: '10 registros totales', icon: '📝', color: '#4ECDC4',
    check: (ctx) => ctx.totalCompletions >= 10 },
  { id: 'comp_50', title: 'Dedicado', description: '50 registros totales', icon: '📋', color: '#87CEEB',
    check: (ctx) => ctx.totalCompletions >= 50 },
  { id: 'comp_100', title: 'Comprometido', description: '100 registros totales', icon: '🎯', color: '#DDA0DD',
    check: (ctx) => ctx.totalCompletions >= 100 },
  { id: 'comp_500', title: 'Imparable', description: '500 registros totales', icon: '🚀', color: '#FF6B6B',
    check: (ctx) => ctx.totalCompletions >= 500 },
  { id: 'habits_3', title: 'Multitarea', description: '3 hábitos activos', icon: '🎪', color: '#98D8C8',
    check: (ctx) => ctx.habitCount >= 3 },
  { id: 'habits_5', title: 'Disciplinado', description: '5 hábitos activos', icon: '🏋️', color: '#F08080',
    check: (ctx) => ctx.habitCount >= 5 },
  { id: 'habits_10', title: 'Máquina', description: '10 hábitos activos', icon: '⚡', color: '#FFD93D',
    check: (ctx) => ctx.habitCount >= 10 },
  { id: 'all_today', title: 'Día perfecto', description: 'Todos los hábitos completados hoy', icon: '🌟', color: '#6C63FF',
    check: (ctx) => ctx.allCompletedToday && ctx.habitCount > 0 },
];

export default function AchievementsScreen() {
  const [context, setContext] = useState<AchievementContext>({
    habitCount: 0, totalCompletions: 0, maxStreak: 0, allCompletedToday: false, streaks: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const habits = await getHabits();
    const completions = await getCompletions();
    const today = getDateString(new Date());
    const todayComps = completions.filter(c => c.date === today);
    const todayHabitIds = new Set(todayComps.map(c => c.habitId));
    const allCompletedToday = habits.length > 0 && habits.every(h => todayHabitIds.has(h.id));

    const streaks: number[] = [];
    for (const h of habits) {
      const s = await getCurrentStreak(h.id);
      streaks.push(s);
    }

    setContext({
      habitCount: habits.length,
      totalCompletions: completions.length,
      maxStreak: streaks.length > 0 ? Math.max(...streaks) : 0,
      allCompletedToday,
      streaks,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const unlockedCount = ACHIEVEMENTS.filter(a => a.check(context)).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryIcon}>🏆</Text>
        <Text style={styles.summaryTitle}>{unlockedCount} de {ACHIEVEMENTS.length}</Text>
        <Text style={styles.summarySubtitle}>logros desbloqueados</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Achievement grid */}
      <View style={styles.grid}>
        {ACHIEVEMENTS.map(achievement => {
          const unlocked = achievement.check(context);
          return (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                unlocked ? { borderColor: achievement.color } : styles.lockedCard,
              ]}
            >
              <View style={[
                styles.iconCircle,
                { backgroundColor: unlocked ? achievement.color + '20' : '#F0F0F0' },
              ]}>
                <Text style={[styles.achievementIcon, !unlocked && styles.lockedIcon]}>
                  {unlocked ? achievement.icon : '🔒'}
                </Text>
              </View>
              <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDesc, !unlocked && styles.lockedText]}>
                {achievement.description}
              </Text>
            </View>
          );
        })}
      </View>

      {unlockedCount === 0 && (
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintText}>
            ¡Empezá a crear hábitos y completarlos para desbloquear logros!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  summaryIcon: { fontSize: 40, marginBottom: 8 },
  summaryTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  summarySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12 },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lockedCard: {
    borderColor: '#E8E8E8',
    opacity: 0.7,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: { fontSize: 24 },
  lockedIcon: { opacity: 0.5 },
  achievementTitle: { fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'center' },
  achievementDesc: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 2 },
  lockedText: { color: '#BBB' },
  emptyHint: { alignItems: 'center', padding: 20, marginTop: 10 },
  emptyHintText: { fontSize: 13, color: '#999', textAlign: 'center' },
});
