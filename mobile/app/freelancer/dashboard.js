import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { fileService } from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, FileText, ChevronRight, LogOut, Settings, Bell, Wallet, Clock } from 'lucide-react-native';
import { paymentService } from '../../services/api.service';

export default function FreelancerDashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    fetchFiles();
    fetchPendingCount();
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchPendingCount = async () => {
    try {
      const { data } = await paymentService.getPendingPayments();
      setPendingCount(data.length);
    } catch {}
  };

  const fetchFiles = async () => {
    try {
      const { data } = await fileService.getMyFiles();
      setFiles(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load your files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const unsoldCount = files.filter(f => !f.isUnlocked && f.paymentStatus !== 'pending_acceptance').length;
  const pendingFileCount = files.filter(f => f.paymentStatus === 'pending_acceptance').length;
  const unlockedCount = files.filter(f => f.isUnlocked).length;

  const getFileStatus = (item) => {
    if (item.isUnlocked) return { label: '✅ Payment Received', color: '#10b981' };
    if (item.paymentStatus === 'pending_acceptance') return { label: '⏳ Pending Your Approval', color: '#f59e0b' };
    return { label: `🔒 Awaiting Payment ($${item.price?.toFixed(2) || '0.00'})`, color: '#94a3b8' };
  };

  const renderFileItem = ({ item }) => {
    const status = getFileStatus(item);
    return (
      <TouchableOpacity
        style={styles.fileCard}
        onPress={() => router.push(`/preview/${item._id}`)}
      >
        <View style={styles.fileIcon}>
          <FileText size={22} color="#3b82f6" />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.originalName || 'Untitled File'}
          </Text>
          <Text style={[styles.fileStatus, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <ChevronRight size={18} color="#334155" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Freelancer'}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={[styles.iconBtn, { marginRight: 10 }]}>
            <Bell size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/freelancer/payments')} style={[styles.iconBtn, { marginRight: 10 }]}>
            <Wallet size={20} color={pendingCount > 0 ? '#10b981' : '#94a3b8'} />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.iconBtn, { marginRight: 10 }]}>
            <Settings size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{unsoldCount}</Text>
          <Text style={styles.statLabel}>Unsold</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingFileCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#10b981' }]}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Uploaded Files</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item._id}
          renderItem={renderFileItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={52} color="#1e293b" />
              <Text style={styles.emptyText}>No files yet</Text>
              <Text style={styles.emptySubtext}>Tap + to upload your first file</Text>
            </View>
          }
        />
      )}

      {/* Upload FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/freelancer/upload')}>
        <Plus size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
  },
  welcomeText: { color: '#94a3b8', fontSize: 14 },
  userName: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  iconBtn: { padding: 10, backgroundColor: '#1e293b', borderRadius: 12 },
  headerBtns: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  statNum: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  fileIcon: {
    width: 46, height: 46, backgroundColor: '#0f172a', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  fileInfo: { flex: 1 },
  fileName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  fileStatus: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  fileStatusUnlocked: { color: '#10b981' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#475569', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: '#334155', fontSize: 14, marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 32, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});
