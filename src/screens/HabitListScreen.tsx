import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  isCompletedToday,
  toggleCompletion,
  deleteHabit,
  getCurrentStreak,
} from '../storage/habitStorage';
import { HabitWithStatus } from '../models/types';

export default function HabitListScreen({ navigation }: any) {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHabits = useCallback(async () => {
    const raw = await getHabits();
    const enriched: HabitWithStatus[] = await Promise.all(
      raw.map(async (h) => ({
        ...h,
        completedToday: await isCompletedToday(h.id),
        currentStreak: await getCurrentStreak(h.id),
        totalCompletions: 0,
      }))
    );
    setHabits(enriched);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const handleToggle = async (habitId: string) => {
    await toggleCompletion(habitId);
    await loadHabits();
  };

  const handleDelete = (habitId: string, name: string) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habitId);
          await loadHabits();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const renderHabit = ({ item }: { item: HabitWithStatus }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 5 }]}
      onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardText}>
          <Text style={styles.habitName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.habitDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>🎯 {item.targetDays} days/week</Text>
            {item.currentStreak > 0 && (
              <Text style={styles.streakBadge}>🔥 {item.currentStreak}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.checkBtn,
            item.completedToday
              ? { backgroundColor: item.color }
              : { borderColor: item.color, borderWidth: 2 },
          ]}
          onPress={() => handleToggle(item.id)}
        >
          <Text style={[styles.checkIcon, item.completedToday && { color: '#fff' }]}>
            {item.completedToday ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={habits.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to create your first habit
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('HabitDetail', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardText: { flex: 1, marginRight: 12 },
  habitName: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 2 },
  habitDesc: { fontSize: 13, color: '#888', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaText: { fontSize: 12, color: '#666' },
  streakBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: { fontSize: 22, fontWeight: '700', color: '#ccc' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 30, color: '#fff', lineHeight: 32 },
});
