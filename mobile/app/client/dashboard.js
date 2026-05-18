import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { fileService } from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ImageIcon, Lock, Unlock, LogOut, ChevronRight, Settings } from 'lucide-react-native';

export default function ClientDashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    fetchFiles();
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchFiles = async () => {
    try {
      const { data } = await fileService.getSharedFiles();
      setFiles(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/');
  };

  const onRefresh = () => { setRefreshing(true); fetchFiles(); };

  const pendingCount = files.filter(f => !f.isUnlocked).length;
  const readyCount = files.filter(f => f.isUnlocked).length;

  const renderFileItem = ({ item }) => (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => router.push(`/preview/${item._id}`)}
    >
      <View style={[styles.fileIcon, item.isUnlocked && styles.fileIconUnlocked]}>
        {item.isUnlocked
          ? <Unlock size={22} color="#10b981" />
          : <Lock size={22} color="#f59e0b" />
        }
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          File from {item.uploadedBy?.name || 'Freelancer'}
        </Text>
        <Text style={[styles.fileStatus, item.isUnlocked && styles.statusReady]}>
          {item.isUnlocked ? 'Ready to Download' : 'Payment Required • $50.00'}
        </Text>
      </View>
      <ChevronRight size={18} color="#334155" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Client Portal</Text>
          <Text style={styles.userName}>{user?.name || 'Client'}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.iconBtn, { marginRight: 10 }]}>
            <Settings size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerStat}>
          <Text style={styles.bannerNum}>{pendingCount}</Text>
          <Text style={styles.bannerLabel}>Pending Payment</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerNum, { color: '#10b981' }]}>{readyCount}</Text>
          <Text style={styles.bannerLabel}>Ready to Download</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Files Shared With You</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item._id}
          renderItem={renderFileItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ImageIcon size={52} color="#1e293b" />
              <Text style={styles.emptyText}>No files yet</Text>
              <Text style={styles.emptySubtext}>Files shared by freelancers appear here</Text>
            </View>
          }
        />
      )}
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
  banner: {
    marginHorizontal: 20, backgroundColor: '#0d9488', borderRadius: 20,
    padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 28,
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerNum: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  bannerDivider: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  fileIcon: {
    width: 46, height: 46, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  fileIconUnlocked: { backgroundColor: 'rgba(16,185,129,0.1)' },
  fileInfo: { flex: 1 },
  fileName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  fileStatus: { color: '#f59e0b', fontSize: 12, marginTop: 3 },
  statusReady: { color: '#10b981' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#475569', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: '#334155', fontSize: 14, marginTop: 6 },
});
