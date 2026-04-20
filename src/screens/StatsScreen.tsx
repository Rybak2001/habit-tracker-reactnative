import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  getCompletions,
  getCurrentStreak,
  getTotalCompletions,
  getAllData,
  getDateString,
} from '../storage/habitStorage';
import { Habit, Completion, CATEGORIES } from '../models/types';

interface HabitStat {
  habit: Habit;
  streak: number;
  total: number;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function StatsScreen() {
  const [stats, setStats] = useState<HabitStat[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [bestDay, setBestDay] = useState('');
  const [weekReport, setWeekReport] = useState({ pct: 0, bestStreak: '', mostConsistent: '', perfectDays: 0 });
  const [recentNotes, setRecentNotes] = useState<(Completion & { habitName: string })[]>([]);

  const loadStats = useCallback(async () => {
    const habits = await getHabits();
    const allComps = await getCompletions();
    setCompletions(allComps);

    const data: HabitStat[] = await Promise.all(
      habits.map(async (h) => ({
        habit: h,
        streak: await getCurrentStreak(h.id),
        total: await getTotalCompletions(h.id),
      }))
    );
    setStats(data);

    // Weekly data (last 7 days)
    const today = new Date();
    const weekly: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = getDateString(d);
      weekly.push(allComps.filter(c => c.date === ds).length);
    }
    setWeeklyData(weekly);

    // Monthly data (last 30 days, grouped by 5-day chunks)
    const monthly: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = getDateString(d);
      monthly.push(allComps.filter(c => c.date === ds).length);
    }
    setMonthlyData(monthly);

    // Best day of week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    allComps.forEach(c => {
      const d = new Date(c.date + 'T12:00:00');
      dayCounts[d.getDay()]++;
    });
    const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
    setBestDay(DAY_NAMES[maxDay]);

    // Weekly report
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = getDateString(monday);
    const weekComps = allComps.filter(c => c.date >= mondayStr);
    const weekTotal = habits.length * 7;
    const weekPct = weekTotal > 0 ? Math.round((weekComps.length / weekTotal) * 100) : 0;

    let bestStreakHabit = '';
    let maxStreak = 0;
    let mostConsistentHabit = '';
    let maxConsistent = 0;
    data.forEach(s => {
      if (s.streak > maxStreak) { maxStreak = s.streak; bestStreakHabit = s.habit.name; }
      if (s.total > maxConsistent) { maxConsistent = s.total; mostConsistentHabit = s.habit.name; }
    });

    let perfectDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d > today) break;
      const ds = getDateString(d);
      const dayComps = allComps.filter(c => c.date === ds);
      if (dayComps.length >= habits.length && habits.length > 0) perfectDays++;
    }

    setWeekReport({ pct: weekPct, bestStreak: bestStreakHabit, mostConsistent: mostConsistentHabit, perfectDays });

    // Recent notes
    const withNotes = allComps
      .filter(c => c.note)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 5)
      .map(c => {
        const h = habits.find(h => h.id === c.habitId);
        return { ...c, habitName: h?.name || 'Desconocido' };
      });
    setRecentNotes(withNotes);
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

  const handleExport = async () => {
    try {
      const data = await getAllData();
      const json = JSON.stringify(data, null, 2);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(json);
        Alert.alert('Exportado', 'Datos copiados al portapapeles.');
      } else {
        Alert.alert('Exportar', 'Los datos se han generado. Función de portapapeles no disponible en esta plataforma.');
      }
    } catch {
      Alert.alert('Error', 'No se pudieron exportar los datos.');
    }
  };

  const maxWeekly = Math.max(...weeklyData, 1);
  const maxMonthly = Math.max(...monthlyData, 1);

  // Category breakdown
  const categoryBreakdown = CATEGORIES.map(cat => {
    const count = stats.filter(s => s.habit.category === cat.key).length;
    return { ...cat, count };
  }).filter(c => c.count > 0);
  const totalCategorized = categoryBreakdown.reduce((s, c) => s + c.count, 0) || 1;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {stats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Sin estadísticas aún</Text>
          <Text style={styles.emptySubtitle}>Creá hábitos y empezá a registrar para ver tu progreso</Text>
        </View>
      ) : (
        <>
          {/* Weekly Report Card */}
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>📅 Resumen semanal</Text>
            <View style={styles.reportGrid}>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>{weekReport.pct}%</Text>
                <Text style={styles.reportLabel}>Completado</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>{weekReport.perfectDays}</Text>
                <Text style={styles.reportLabel}>Días perfectos</Text>
              </View>
            </View>
            {weekReport.bestStreak ? (
              <Text style={styles.reportDetail}>🔥 Mejor racha: {weekReport.bestStreak}</Text>
            ) : null}
            {weekReport.mostConsistent ? (
              <Text style={styles.reportDetail}>⭐ Más consistente: {weekReport.mostConsistent}</Text>
            ) : null}
          </View>

          {/* Weekly Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📊 Últimos 7 días</Text>
            <View style={styles.barChart}>
              {weeklyData.map((val, i) => {
                const today = new Date();
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                const dayLabel = DAY_NAMES[d.getDay()];
                return (
                  <View key={i} style={styles.barColumn}>
                    <Text style={styles.barValue}>{val}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { height: `${(val / maxWeekly) * 100}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Monthly Trend */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📈 Últimos 30 días</Text>
            <View style={styles.trendChart}>
              {monthlyData.map((val, i) => (
                <View
                  key={i}
                  style={[
                    styles.trendBar,
                    {
                      height: Math.max(2, (val / maxMonthly) * 60),
                      backgroundColor: val > 0 ? '#6C63FF' : '#E8E8E8',
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🏷️ Por categoría</Text>
              {categoryBreakdown.map(cat => (
                <View key={cat.key} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{cat.icon} {cat.key}</Text>
                  <View style={styles.categoryBarBg}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${(cat.count / totalCategorized) * 100}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryCount}>{cat.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Best day */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🏆 Mejor día de la semana</Text>
            <Text style={styles.bestDayText}>{bestDay}</Text>
            <Text style={styles.bestDaySubtext}>El día con más registros completados</Text>
          </View>

          {/* Per-habit stats */}
          {stats.map(item => (
            <View key={item.habit.id} style={[styles.card, { borderLeftColor: item.habit.color, borderLeftWidth: 5 }]}>
              <Text style={styles.habitName}>{item.habit.name}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.streak > 0 ? `🔥 ${item.streak}` : '0'}</Text>
                  <Text style={styles.statLabel}>Racha actual</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.total}</Text>
                  <Text style={styles.statLabel}>Total registros</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>🎯 {item.habit.targetDays}</Text>
                  <Text style={styles.statLabel}>Días / Sem</Text>
                </View>
              </View>
              {item.streak >= 7 && (
                <View style={[styles.badge, { backgroundColor: item.habit.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: item.habit.color }]}>
                    🏆 {item.streak >= 30 ? '¡Campeón mensual!' : item.streak >= 14 ? '¡Guerrero de dos semanas!' : '¡Una semana fuerte!'}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Recent notes */}
          {recentNotes.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📝 Notas recientes</Text>
              {recentNotes.map(n => (
                <View key={n.id} style={styles.noteItem}>
                  <Text style={styles.noteHabit}>{n.habitName}</Text>
                  <Text style={styles.noteText}>{n.note}</Text>
                  <Text style={styles.noteDate}>{formatDate(n.completedAt)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Export */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportText}>📤 Exportar datos (JSON)</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  reportCard: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  reportTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  reportGrid: { flexDirection: 'row', marginBottom: 10 },
  reportItem: { flex: 1, alignItems: 'center' },
  reportValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  reportLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  reportDetail: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 14 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barColumn: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barValue: { fontSize: 10, color: '#888', marginBottom: 4 },
  barBg: { width: '70%', height: 80, backgroundColor: '#F0F0F0', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 2 },
  trendBar: { flex: 1, borderRadius: 2, minWidth: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryLabel: { width: 100, fontSize: 12, color: '#555' },
  categoryBarBg: { flex: 1, height: 14, backgroundColor: '#F0F0F0', borderRadius: 7, overflow: 'hidden', marginHorizontal: 8 },
  categoryBarFill: { height: 14, borderRadius: 7 },
  categoryCount: { width: 24, fontSize: 12, color: '#888', textAlign: 'right' },
  bestDayText: { fontSize: 32, fontWeight: '800', color: '#6C63FF', textAlign: 'center' },
  bestDaySubtext: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
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
  badge: { marginTop: 12, borderRadius: 8, padding: 8, alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  noteItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  noteHabit: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  noteText: { fontSize: 13, color: '#555', marginTop: 2 },
  noteDate: { fontSize: 10, color: '#BBB', marginTop: 4 },
  exportBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
    marginTop: 6,
  },
  exportText: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
});
