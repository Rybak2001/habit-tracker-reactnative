import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  isCompletedToday,
  toggleCompletion,
  deleteHabit,
  getCurrentStreak,
  getWeekCompletions,
} from '../storage/habitStorage';
import { HabitWithStatus, CATEGORIES } from '../models/types';
import ConfirmDialog from '../components/ConfirmDialog';
import NoteInput from '../components/NoteInput';
import ProgressRing from '../components/ProgressRing';

type SortMode = 'name' | 'date' | 'streak' | 'rate';

export default function HabitListScreen({ navigation }: any) {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    const raw = await getHabits();
    const enriched: HabitWithStatus[] = await Promise.all(
      raw.map(async (h) => ({
        ...h,
        completedToday: await isCompletedToday(h.id),
        currentStreak: await getCurrentStreak(h.id),
        totalCompletions: 0,
        weekCompletions: await getWeekCompletions(h.id),
      }))
    );
    setHabits(enriched);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const handleToggle = async (habitId: string, isCompleted: boolean) => {
    if (isCompleted) {
      await toggleCompletion(habitId);
      await loadHabits();
    } else {
      setNoteTarget(habitId);
    }
  };

  const handleNoteSubmit = async (note: string) => {
    if (noteTarget) {
      await toggleCompletion(noteTarget, undefined, note || undefined);
      setNoteTarget(null);
      await loadHabits();
    }
  };

  const handleNoteSkip = async () => {
    if (noteTarget) {
      await toggleCompletion(noteTarget);
      setNoteTarget(null);
      await loadHabits();
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteHabit(deleteTarget.id);
      setDeleteTarget(null);
      await loadHabits();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const sortedFiltered = () => {
    let result = [...habits];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(h => h.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter(h => h.category === categoryFilter);
    }
    switch (sortMode) {
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'date': result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'streak': result.sort((a, b) => b.currentStreak - a.currentStreak); break;
      case 'rate':
        result.sort((a, b) => {
          const ra = a.targetDays > 0 ? a.weekCompletions / a.targetDays : 0;
          const rb = b.targetDays > 0 ? b.weekCompletions / b.targetDays : 0;
          return rb - ra;
        });
        break;
    }
    return result;
  };

  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getMotivation = () => {
    if (totalCount === 0) return '¡Crea tu primer hábito!';
    if (progressPct === 100) return '🎉 ¡Excelente! ¡Todos completados!';
    if (progressPct >= 75) return '💪 ¡Casi llegas! ¡Sigue así!';
    if (progressPct >= 50) return '👍 ¡Buen progreso! ¡No pares!';
    if (progressPct > 0) return '🌱 ¡Buen comienzo! ¡Tú puedes!';
    return '⏰ ¡Es hora de empezar el día!';
  };

  const sortLabels: Record<SortMode, string> = {
    name: 'Alfabético',
    date: 'Fecha de creación',
    streak: 'Racha',
    rate: 'Tasa de completado',
  };

  const data = sortedFiltered();
  const getCategoryInfo = (key: string) => CATEGORIES.find(c => c.key === key);

  const renderHabit = ({ item }: { item: HabitWithStatus }) => {
    const weekPct = item.targetDays > 0 ? (item.weekCompletions / item.targetDays) * 100 : 0;
    const cat = getCategoryInfo(item.category);
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 5 }]}
        onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
        onLongPress={() => setDeleteTarget({ id: item.id, name: item.name })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardText}>
            <View style={styles.nameRow}>
              <Text style={styles.habitName}>{item.name}</Text>
              {cat && (
                <View style={[styles.categoryBadge, { backgroundColor: cat.color + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: cat.color }]}>
                    {cat.icon} {cat.key}
                  </Text>
                </View>
              )}
            </View>
            {item.description ? (
              <Text style={styles.habitDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>🎯 {item.targetDays} días/sem</Text>
              {item.currentStreak > 0 && (
                <Text style={styles.streakBadge}>🔥 {item.currentStreak}</Text>
              )}
            </View>
          </View>

          <View style={styles.cardRight}>
            <ProgressRing progress={weekPct} size={40} strokeWidth={4} color={item.color} />
            <TouchableOpacity
              style={[
                styles.checkBtn,
                item.completedToday
                  ? { backgroundColor: item.color }
                  : { borderColor: item.color, borderWidth: 2 },
              ]}
              onPress={() => handleToggle(item.id, item.completedToday)}
            >
              <Text style={[styles.checkIcon, item.completedToday && { color: '#fff' }]}>
                {item.completedToday ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={data.length === 0 && !search && !categoryFilter ? styles.empty : styles.list}
        ListHeaderComponent={
          <View>
            {/* Daily Summary */}
            {totalCount > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Hoy: {completedCount} de {totalCount} hábitos completados
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                </View>
                <Text style={styles.motivationText}>{getMotivation()}</Text>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar hábitos..."
                  placeholderTextColor="#aaa"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={styles.clearSearch}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <Text style={styles.sortIcon}>⇅</Text>
              </TouchableOpacity>
            </View>

            {/* Sort dropdown */}
            {showSortMenu && (
              <View style={styles.sortMenu}>
                {(Object.keys(sortLabels) as SortMode[]).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.sortOption, sortMode === mode && styles.sortOptionActive]}
                    onPress={() => { setSortMode(mode); setShowSortMenu(false); }}
                  >
                    <Text style={[styles.sortOptionText, sortMode === mode && styles.sortOptionTextActive]}>
                      {sortLabels[mode]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Category filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !categoryFilter && styles.chipActive]}
                onPress={() => setCategoryFilter('')}
              >
                <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.chip,
                    categoryFilter === cat.key && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setCategoryFilter(categoryFilter === cat.key ? '' : cat.key)}
                >
                  <Text style={[
                    styles.chipText,
                    categoryFilter === cat.key && { color: '#fff' },
                  ]}>
                    {cat.icon} {cat.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {search || categoryFilter ? (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySubtitle}>No se encontraron hábitos con esos filtros</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => { setSearch(''); setCategoryFilter(''); }}
                >
                  <Text style={styles.emptyBtnText}>Limpiar filtros</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Sin hábitos aún</Text>
                <Text style={styles.emptySubtitle}>¡Crea tu primer hábito y comienza a mejorar!</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('HabitDetail', {})}
                >
                  <Text style={styles.emptyBtnText}>Crear primer hábito</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('HabitDetail', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Eliminar hábito"
        message={`¿Estás seguro de que querés eliminar "${deleteTarget?.name}"? Se perderán todos los registros.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <NoteInput
        visible={!!noteTarget}
        onSubmit={handleNoteSubmit}
        onSkip={handleNoteSkip}
      />
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
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  summaryCard: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  summaryTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  motivationText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  clearSearch: { fontSize: 16, color: '#999', paddingLeft: 8 },
  sortBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIcon: { fontSize: 20, color: '#6C63FF' },
  sortMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sortOption: { paddingHorizontal: 16, paddingVertical: 12 },
  sortOptionActive: { backgroundColor: '#6C63FF10' },
  sortOptionText: { fontSize: 14, color: '#555' },
  sortOptionTextActive: { color: '#6C63FF', fontWeight: '700' },
  chipRow: { marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  chipTextActive: { color: '#fff' },
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
  cardRight: { alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  habitName: { fontSize: 17, fontWeight: '600', color: '#222' },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: { fontSize: 18, fontWeight: '700', color: '#ccc' },
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
