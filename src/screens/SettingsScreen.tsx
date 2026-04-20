import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSettings,
  saveSettings,
  getAllData,
  importAllData,
  clearAllData,
} from '../storage/habitStorage';
import { Settings } from '../models/types';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({ startOfWeek: 'monday', theme: 'light' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const toggleStartOfWeek = async () => {
    const newSettings: Settings = {
      ...settings,
      startOfWeek: settings.startOfWeek === 'monday' ? 'sunday' : 'monday',
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleExport = async () => {
    try {
      const data = await getAllData();
      const json = JSON.stringify(data, null, 2);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(json);
        Alert.alert('Exportado', 'Todos los datos han sido copiados al portapapeles en formato JSON.');
      } else {
        Alert.alert('Exportar', 'Función de portapapeles no disponible en esta plataforma.');
      }
    } catch {
      Alert.alert('Error', 'No se pudieron exportar los datos.');
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importText);
      if (!data.habits || !data.completions) {
        Alert.alert('Error', 'El formato de los datos no es válido.');
        return;
      }
      await importAllData(data);
      setShowImportModal(false);
      setImportText('');
      Alert.alert('Importado', 'Los datos han sido importados correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron importar los datos. Verificá el formato JSON.');
    }
  };

  const handleClearAll = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    Alert.alert('Datos eliminados', 'Todos los datos han sido borrados.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Start of Week */}
      <Text style={styles.sectionHeader}>General</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={toggleStartOfWeek}>
          <View>
            <Text style={styles.settingLabel}>Inicio de semana</Text>
            <Text style={styles.settingValue}>
              {settings.startOfWeek === 'monday' ? 'Lunes' : 'Domingo'}
            </Text>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Tema</Text>
            <Text style={styles.settingValue}>Claro</Text>
          </View>
          <View style={styles.themeBadge}>
            <Text style={styles.themeBadgeText}>☀️</Text>
          </View>
        </View>
      </View>

      {/* Data Management */}
      <Text style={styles.sectionHeader}>Gestión de datos</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={handleExport}>
          <Text style={styles.settingLabel}>📤 Exportar datos</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.settingRow} onPress={() => setShowImportModal(true)}>
          <Text style={styles.settingLabel}>📥 Importar datos</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.settingRow} onPress={() => setShowClearConfirm(true)}>
          <Text style={[styles.settingLabel, { color: '#FF4444' }]}>🗑️ Borrar todos los datos</Text>
          <Text style={[styles.settingArrow, { color: '#FF4444' }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionHeader}>Acerca de</Text>
      <View style={styles.card}>
        <View style={styles.aboutSection}>
          <Text style={styles.appName}>Habit Tracker</Text>
          <Text style={styles.appVersion}>Versión 1.0.0</Text>
          <Text style={styles.appDesc}>
            Una aplicación para crear y mantener hábitos saludables. Hecha con React Native y Expo.
          </Text>
        </View>
      </View>

      {/* Import modal */}
      {showImportModal && (
        <View style={styles.importSection}>
          <Text style={styles.importTitle}>Pegar datos JSON</Text>
          <TextInput
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
            placeholder='{"habits": [...], "completions": [...]}'
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={6}
          />
          <View style={styles.importButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowImportModal(false); setImportText(''); }}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <Text style={styles.importBtnText}>Importar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={showClearConfirm}
        title="Borrar todos los datos"
        message="¿Estás seguro? Se borrarán todos los hábitos, registros y configuraciones. Esta acción no se puede deshacer."
        confirmText="Borrar todo"
        cancelText="Cancelar"
        destructive
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  settingValue: { fontSize: 13, color: '#888', marginTop: 2 },
  settingArrow: { fontSize: 16, color: '#CCC' },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
  themeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeBadgeText: { fontSize: 18 },
  aboutSection: { padding: 16, alignItems: 'center' },
  appName: { fontSize: 20, fontWeight: '800', color: '#6C63FF', marginBottom: 4 },
  appVersion: { fontSize: 13, color: '#999', marginBottom: 8 },
  appDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
  importSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  importTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  importInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  importButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  importBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
  },
  importBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
