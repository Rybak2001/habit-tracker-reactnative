import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getHabit, getCompletionsForHabit } from '../storage/habitStorage';
import { Habit, Completion } from '../models/types';

interface GroupedMonth {
  label: string;
  completions: Completion[];
}

export default function HabitHistoryScreen({ route }: any) {
  const { habitId } = route.params;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [grouped, setGrouped] = useState<GroupedMonth[]>([]);

  useEffect(() => {
    (async () => {
      const h = await getHabit(habitId);
      setHabit(h);

      const comps = await getCompletionsForHabit(habitId);
      const sorted = comps.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

      // Group by month
      const groups: Record<string, Completion[]> = {};
      sorted.forEach(c => {
        const d = new Date(c.completedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      });

      const monthNames = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
      ];

      const result: GroupedMonth[] = Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, completions]) => {
          const [year, month] = key.split('-');
          const label = `${monthNames[parseInt(month) - 1]} ${year}`;
          return { label, completions };
        });

      setGrouped(result);
    })();
  }, [habitId]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!habit) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: habit.color }]}>
        <Text style={styles.headerName}>{habit.name}</Text>
        <Text style={styles.headerCount}>
          {grouped.reduce((s, g) => s + g.completions.length, 0)} registros totales
        </Text>
      </View>

      {grouped.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>Sin historial</Text>
          <Text style={styles.emptySubtitle}>Aún no hay registros para este hábito</Text>
        </View>
      ) : (
        grouped.map(group => (
          <View key={group.label}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthLabel}>{group.label}</Text>
              <Text style={styles.monthCount}>{group.completions.length} registros</Text>
            </View>
            {group.completions.map(comp => (
              <View
                key={comp.id}
                style={[styles.historyItem, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
              >
                <View style={styles.historyRow}>
                  <Text style={styles.historyDate}>✅ {formatDateTime(comp.completedAt)}</Text>
                </View>
                {comp.note && (
                  <Text style={styles.historyNote}>📝 {comp.note}</Text>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  headerCount: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
    textTransform: 'capitalize',
  },
  monthCount: { fontSize: 12, color: '#999' },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 13, color: '#555', fontWeight: '500' },
  historyNote: { fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' },
});
