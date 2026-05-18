import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api.service';
import { Shield, ArrowLeft, Settings as SettingsIcon, LogOut, Fingerprint, User } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setHasHardware(compatible);
    setIsEnrolled(enrolled);
  };

  const loadSettings = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setName(parsed.name);
      }
      
      const value = await AsyncStorage.getItem('biometricEnabled');
      if (value !== null) {
        setBiometricEnabled(JSON.parse(value));
      } else {
        // Default to true if hardware is available
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricEnabled(enrolled);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const toggleBiometrics = async (value) => {
    if (value) {
      // If enabling, verify hardware first
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return Alert.alert(
          'Not Set Up',
          'Biometrics are not set up on this device. Please go to your device settings to enable FaceID, TouchID, or Fingerprint.'
        );
      }
    }
    
    setBiometricEnabled(value);
    try {
      await AsyncStorage.setItem('biometricEnabled', JSON.stringify(value));
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleUpdateProfile = async () => {
    if (!name) return Alert.alert('Error', 'Name cannot be empty');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name });
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <User size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#475569"
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Update Name'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasHardware && isEnrolled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.iconBox}>
                  <Fingerprint size={20} color="#3b82f6" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Biometric Login</Text>
                  <Text style={styles.settingDesc}>Use FaceID or Fingerprint</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: '#334155', true: '#3b82f6' }}
                thumbColor={biometricEnabled ? '#fff' : '#94a3b8'}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Shield size={24} color="#334155" />
          <Text style={styles.version}>SecureDeliver v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 4 },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#64748b', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  settingDesc: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, height: 48, color: '#fff', fontSize: 15, marginLeft: 10 },
  saveBtn: { backgroundColor: '#3b82f6', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  version: { color: '#94a3b8', fontSize: 12, marginTop: 8 }
});
