import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { getHabit, saveHabit, getCompletionsForHabit } from '../storage/habitStorage';
import { CATEGORIES, Completion } from '../models/types';

const COLORS = [
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#FF8C42',
  '#A8E6CF', '#DDA0DD', '#87CEEB', '#F08080', '#98D8C8',
  '#FF69B4', '#20B2AA',
];

const TEMPLATES = [
  { name: 'Ejercicio diario', icon: '🏃', color: '#FF6B6B', targetDays: 7, category: 'Ejercicio', description: '30 minutos de actividad física' },
  { name: 'Leer 30 minutos', icon: '📖', color: '#87CEEB', targetDays: 5, category: 'Educación', description: 'Lectura diaria de libros o artículos' },
  { name: 'Meditar', icon: '🧘', color: '#DDA0DD', targetDays: 7, category: 'Bienestar', description: '10-15 minutos de meditación' },
  { name: 'Beber 2L agua', icon: '💧', color: '#4ECDC4', targetDays: 7, category: 'Salud', description: 'Hidratación adecuada durante el día' },
  { name: 'Estudiar idiomas', icon: '🌍', color: '#A8E6CF', targetDays: 5, category: 'Educación', description: 'Práctica de idiomas con apps o libros' },
  { name: 'Dormir 8 horas', icon: '🌙', color: '#6C63FF', targetDays: 7, category: 'Salud', description: 'Acostarse temprano para dormir bien' },
];

export default function HabitDetailScreen({ route, navigation }: any) {
  const habitId = route.params?.habitId;
  const isEditing = !!habitId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [targetDays, setTargetDays] = useState(7);
  const [category, setCategory] = useState('');
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);

  useEffect(() => {
    if (isEditing) {
      (async () => {
        const habit = await getHabit(habitId);
        if (habit) {
          setName(habit.name);
          setDescription(habit.description);
          setColor(habit.color);
          setTargetDays(habit.targetDays);
          setCategory(habit.category || '');
        }
        const comps = await getCompletionsForHabit(habitId);
        setRecentCompletions(comps.sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 5));
      })();
    }
  }, [habitId, isEditing]);

  const applyTemplate = (template: typeof TEMPLATES[number]) => {
    setName(template.name);
    setDescription(template.description);
    setColor(template.color);
    setTargetDays(template.targetDays);
    setCategory(template.category);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Requerido', 'Ingresá un nombre para el hábito.');
      return;
    }

    await saveHabit({
      ...(isEditing ? { id: habitId } : {}),
      name: name.trim(),
      description: description.trim(),
      color,
      targetDays,
      category,
    });
    navigation.goBack();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Templates - only show when creating new */}
      {!isEditing && (
        <>
          <Text style={styles.sectionTitle}>Plantillas rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesRow}>
            {TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.templateCard, { borderColor: t.color }]} onPress={() => applyTemplate(t)}>
                <Text style={styles.templateIcon}>{t.icon}</Text>
                <Text style={styles.templateName}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>Nombre del hábito *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej: Ejercicio, Leer, Meditar"
        placeholderTextColor="#aaa"
        maxLength={50}
      />

      <Text style={styles.sectionTitle}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción opcional..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={3}
        maxLength={200}
      />

      <Text style={styles.sectionTitle}>Categoría</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryPill,
              { borderColor: cat.color },
              category === cat.key && { backgroundColor: cat.color },
            ]}
            onPress={() => setCategory(category === cat.key ? '' : cat.key)}
          >
            <Text style={[
              styles.categoryPillText,
              { color: category === cat.key ? '#fff' : cat.color },
            ]}>
              {cat.icon} {cat.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Color</Text>
      <View style={styles.colorGrid}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
            onPress={() => setColor(c)}
          >
            {color === c && <Text style={styles.colorCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Días objetivo por semana</Text>
      <View style={styles.daysRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.dayBtn,
              targetDays === d && { backgroundColor: color },
            ]}
            onPress={() => setTargetDays(d)}
          >
            <Text
              style={[
                styles.dayText,
                targetDays === d && { color: '#fff', fontWeight: '700' },
              ]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.daysLabel}>
        {targetDays === 7
          ? 'Todos los días'
          : `${targetDays} día${targetDays > 1 ? 's' : ''} por semana`}
      </Text>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: color }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {isEditing ? 'Actualizar hábito' : 'Crear hábito'}
        </Text>
      </TouchableOpacity>

      {/* Recent completions with notes */}
      {isEditing && recentCompletions.length > 0 && (
        <>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Historial reciente</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HabitHistory', { habitId })}>
              <Text style={styles.viewAllText}>Ver todo →</Text>
            </TouchableOpacity>
          </View>
          {recentCompletions.map((comp) => (
            <View key={comp.id} style={styles.completionItem}>
              <Text style={styles.completionDate}>✅ {formatDate(comp.completedAt)}</Text>
              {comp.note && <Text style={styles.completionNote}>📝 {comp.note}</Text>}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  templatesRow: { marginBottom: 4 },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 110,
  },
  templateIcon: { fontSize: 28, marginBottom: 4 },
  templateName: { fontSize: 11, fontWeight: '600', color: '#444', textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryPillText: { fontSize: 13, fontWeight: '600' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  colorCheck: { color: '#fff', fontSize: 18, fontWeight: '700' },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayText: { fontSize: 18, fontWeight: '500', color: '#666' },
  daysLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  saveBtn: {
    marginTop: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  viewAllText: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },
  completionItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  completionDate: { fontSize: 13, color: '#555', fontWeight: '500' },
  completionNote: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
});
