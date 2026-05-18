import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Fingerprint, Shield } from 'lucide-react-native';

export default function BiometricScreen() {
  const [loading, setLoading] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAndPrompt();
  }, []);

  const checkAndPrompt = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Hardware not available or user hasn't set up biometrics, skip to dashboard
      return navigateToDashboard();
    }
    
    // Auto-prompt on screen load
    promptBiometrics();
  };

  const promptBiometrics = async () => {
    setLoading(true);
    setAuthFailed(false);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        navigateToDashboard();
      } else {
        setAuthFailed(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Biometric error:', err);
      // Fallback if biometrics crash or are unsupported on this specific device state
      Alert.alert(
        'Authentication Error', 
        'Could not complete biometric verification.',
        [{ text: 'Manual Login', onPress: () => router.replace('/') }]
      );
      setLoading(false);
    }
  };

  const navigateToDashboard = async () => {
    const raw = await AsyncStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    
    if (!user) return router.replace('/');

    if (user.role === 'freelancer') {
      router.replace('/freelancer/dashboard');
    } else {
      router.replace('/client/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Shield size={64} color="#3b82f6" />
        </View>
        <Text style={styles.title}>SecureDeliver</Text>
        <Text style={styles.subtitle}>Verify your identity to continue</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.biometricBtn} onPress={promptBiometrics}>
              <Fingerprint size={28} color="#fff" />
              <Text style={styles.biometricBtnText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.replace('/')} 
              style={styles.logoutBtn}
            >
              <Text style={styles.logoutText}>Use different account</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {authFailed && !loading && (
          <Text style={styles.errorText}>Authentication failed. Please try again.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  iconWrap: {
    width: 120, height: 120, backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: 'rgba(59,130,246,0.3)',
  },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 16, marginTop: 8, textAlign: 'center' },
  actionContainer: { width: '100%', alignItems: 'center', marginTop: 40 },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#3b82f6', paddingVertical: 18, paddingHorizontal: 40,
    borderRadius: 20, width: '100%', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  biometricBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { marginTop: 24 },
  logoutText: { color: '#475569', fontSize: 14, textDecorationLine: 'underline' },
  errorText: { color: '#ef4444', marginTop: 20, fontSize: 14, fontWeight: '500' }
});
