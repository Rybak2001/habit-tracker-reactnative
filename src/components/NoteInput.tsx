import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface NoteInputProps {
  visible: boolean;
  onSubmit: (note: string) => void;
  onSkip: () => void;
}

export default function NoteInput({ visible, onSubmit, onSkip }: NoteInputProps) {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(note.trim());
    setNote('');
  };

  const handleSkip = () => {
    setNote('');
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>📝 Agregar nota</Text>
          <Text style={styles.subtitle}>¿Querés agregar una nota a este registro?</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Nota opcional..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={200}
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  skipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
  },
  saveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
