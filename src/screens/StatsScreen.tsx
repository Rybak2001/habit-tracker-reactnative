import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  getCurrentStreak,
  getTotalCompletions,
} from '../storage/habitStorage';
import { Habit } from '../models/types';

interface HabitStat {
  habit: Habit;
  streak: number;
  total: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<HabitStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const habits = await getHabits();
    const data: HabitStat[] = await Promise.all(
      habits.map(async (h) => ({
        habit: h,
        streak: await getCurrentStreak(h.id),
        total: await getTotalCompletions(h.id),
      }))
    );
    setStats(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const renderStat = ({ item }: { item: HabitStat }) => (
    <View style={[styles.card, { borderLeftColor: item.habit.color, borderLeftWidth: 5 }]}>
      <Text style={styles.habitName}>{item.habit.name}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {item.streak > 0 ? `🔥 ${item.streak}` : '0'}
          </Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{item.total}</Text>
          <Text style={styles.statLabel}>Total Check-ins</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statValue}>🎯 {item.habit.targetDays}</Text>
          <Text style={styles.statLabel}>Days / Week</Text>
        </View>
      </View>

      {item.streak >= 7 && (
        <View style={[styles.badge, { backgroundColor: item.habit.color + '20' }]}>
          <Text style={[styles.badgeText, { color: item.habit.color }]}>
            🏆 {item.streak >= 30 ? 'Monthly Champion!' : item.streak >= 14 ? 'Two Week Warrior!' : 'One Week Strong!'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stats}
        keyExtractor={(item) => item.habit.id}
        renderItem={renderStat}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={stats.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No stats yet</Text>
            <Text style={styles.emptySubtitle}>
              Create habits and start tracking to see your progress
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list: { padding: 16, paddingBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  habitName: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.3 },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },
  badge: {
    marginTop: 12,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
});
