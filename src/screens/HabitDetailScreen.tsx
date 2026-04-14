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
import { getHabit, saveHabit } from '../storage/habitStorage';

const COLORS = [
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#FF8C42',
  '#A8E6CF', '#DDA0DD', '#87CEEB', '#F08080', '#98D8C8',
  '#FF69B4', '#20B2AA',
];

export default function HabitDetailScreen({ route, navigation }: any) {
  const habitId = route.params?.habitId;
  const isEditing = !!habitId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [targetDays, setTargetDays] = useState(7);

  useEffect(() => {
    if (isEditing) {
      (async () => {
        const habit = await getHabit(habitId);
        if (habit) {
          setName(habit.name);
          setDescription(habit.description);
          setColor(habit.color);
          setTargetDays(habit.targetDays);
        }
      })();
    }
  }, [habitId, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a habit name.');
      return;
    }

    await saveHabit({
      ...(isEditing ? { id: habitId } : {}),
      name: name.trim(),
      description: description.trim(),
      color,
      targetDays,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Habit Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Exercise, Read, Meditate"
        placeholderTextColor="#aaa"
        maxLength={50}
      />

      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={3}
        maxLength={200}
      />

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

      <Text style={styles.sectionTitle}>Target Days per Week</Text>
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
          ? 'Every day'
          : `${targetDays} day${targetDays > 1 ? 's' : ''} per week`}
      </Text>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: color }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {isEditing ? 'Update Habit' : 'Create Habit'}
        </Text>
      </TouchableOpacity>
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
});
