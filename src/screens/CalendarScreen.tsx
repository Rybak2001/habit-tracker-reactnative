import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHabits, getCompletions, getDateString } from '../storage/habitStorage';
import { Habit, Completion } from '../models/types';

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setHabits(await getHabits());
    setCompletions(await getCompletions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Mon=0
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const getCompletionsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completions.filter(c => c.date === dateStr);
  };

  const getDayColors = (day: number): string[] => {
    const dayComps = getCompletionsForDay(day);
    const colors: string[] = [];
    dayComps.forEach(c => {
      const h = habits.find(h => h.id === c.habitId);
      if (h && !colors.includes(h.color)) colors.push(h.color);
    });
    return colors.slice(0, 4);
  };

  const selectedDayComps = selectedDay
    ? completions.filter(c => c.date === selectedDay)
    : [];
  const selectedDayHabits = selectedDayComps.map(c => {
    const h = habits.find(h => h.id === c.habitId);
    return { completion: c, habit: h };
  }).filter(x => x.habit);

  const todayStr = getDateString(new Date());

  const renderCalendarGrid = () => {
    const cells: React.ReactNode[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const colors = getDayColors(day);
      const isToday = dateStr === todayStr;

      cells.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => setSelectedDay(dateStr)}
        >
          <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
          {colors.length > 0 && (
            <View style={styles.dotsRow}>
              {colors.map((c, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: c }]} />
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaderRow}>
          {DAY_HEADERS.map(d => (
            <View key={d} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {renderCalendarGrid()}
        </View>

        {/* Legend */}
        {habits.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Leyenda</Text>
            <View style={styles.legendItems}>
              {habits.map(h => (
                <View key={h.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: h.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{h.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {habits.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Sin hábitos aún</Text>
            <Text style={styles.emptySubtitle}>Creá hábitos para verlos en el calendario</Text>
          </View>
        )}
      </ScrollView>

      {/* Day detail modal */}
      <Modal visible={!!selectedDay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-BO', {
                  weekday: 'long', day: 'numeric', month: 'long',
                }) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedDayHabits.length === 0 ? (
              <Text style={styles.modalEmpty}>Sin registros este día</Text>
            ) : (
              selectedDayHabits.map(({ completion: c, habit: h }) => (
                <View key={c.id} style={[styles.modalItem, { borderLeftColor: h!.color, borderLeftWidth: 4 }]}>
                  <Text style={styles.modalHabitName}>✅ {h!.name}</Text>
                  {c.note && <Text style={styles.modalNote}>📝 {c.note}</Text>}
                  <Text style={styles.modalTime}>
                    {new Date(c.completedAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navText: { fontSize: 16, color: '#6C63FF' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: 'center' },
  dayHeaderText: { fontSize: 12, fontWeight: '600', color: '#999' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  todayCell: {
    backgroundColor: '#6C63FF15',
    borderRadius: 8,
  },
  dayNumber: { fontSize: 14, fontWeight: '500', color: '#333' },
  todayNumber: { color: '#6C63FF', fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  legendTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#666', maxWidth: 100 },
  emptyContainer: { alignItems: 'center', padding: 32, marginTop: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333', textTransform: 'capitalize' },
  modalClose: { fontSize: 20, color: '#999', padding: 4 },
  modalEmpty: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },
  modalItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalHabitName: { fontSize: 14, fontWeight: '600', color: '#333' },
  modalNote: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
  modalTime: { fontSize: 11, color: '#BBB', marginTop: 4 },
});
