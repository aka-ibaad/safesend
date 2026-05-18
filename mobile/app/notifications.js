import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, ArrowLeft, ShieldAlert, CreditCard, ChevronRight } from 'lucide-react-native';
import api from '../services/api.service';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // For this demo, we'll fetch notifications from a mock or shared resource
      // Alternatively, we could fetch 'screenshot attempts' specifically for freelancers
      const { data: myFiles } = await api.get('/files/my-files');
      
      const allNotifs = [];
      if (Array.isArray(myFiles)) {
        myFiles.forEach(file => {
          if (!file) return;
          
          // Add screenshot alerts
          file.screenshotAttempts?.forEach(attempt => {
            if (!attempt) return;
            allNotifs.push({
              id: `ss-${attempt._id || Date.now() + Math.random()}`,
              type: 'screenshot',
              title: 'Screenshot Detected',
              message: `Someone attempted to screenshot your file: ${file.originalFileUrl?.split('/').pop() || 'Unknown File'}`,
              date: attempt.timestamp || new Date(),
              fileId: file._id
            });
          });

          // Add payment alerts
          if (file.isUnlocked) {
            allNotifs.push({
              id: `pay-${file._id}`,
              type: 'payment',
              title: 'Payment Received',
              message: `File "${file.originalFileUrl?.split('/').pop() || 'Unknown File'}" has been unlocked.`,
              date: file.updatedAt || file.createdAt || new Date(),
              fileId: file._id
            });
          }
        });
      }

      // Sort by newest first
      allNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(allNotifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.notifCard}
      onPress={() => router.push(`/preview/${item.fileId}`)}
    >
      <View style={[styles.iconBox, item.type === 'screenshot' ? styles.ssIcon : styles.payIcon]}>
        {item.type === 'screenshot' ? <ShieldAlert size={20} color="#ef4444" /> : <CreditCard size={20} color="#10b981" />}
      </View>
      <View style={styles.notifInfo}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notifDate}>
          {item.date ? new Date(item.date).toLocaleString() : 'Recently'}
        </Text>
      </View>
      <ChevronRight size={16} color="#334155" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={48} color="#1e293b" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>Activity regarding your files will appear here</Text>
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
  list: { padding: 20 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ssIcon: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  payIcon: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  notifInfo: { flex: 1 },
  notifTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  notifMessage: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  notifDate: { color: '#475569', fontSize: 11, marginTop: 6 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#475569', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: '#334155', fontSize: 14, marginTop: 6 },
});
