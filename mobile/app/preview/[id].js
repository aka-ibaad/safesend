import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fileService } from '../../services/api.service';
import api from '../../services/api.service';
import { Shield, Download, CreditCard, Info, AlertTriangle, PenLine, X, Maximize2 } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function PreviewScreen() {
  const { id } = useLocalSearchParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    let subscription;
    // Activate screenshot prevention
    const enablePrevention = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        
        // Add listener for screenshot attempts
        subscription = ScreenCapture.addScreenshotListener(() => {
          handleScreenshot();
        });
      } catch (e) {
        console.warn('Screenshot prevention failed to start', e);
      }
    };

    enablePrevention();
    fetchFileDetails();
    loadUserRole();
    
    return () => {
      subscription?.remove();
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [id]);

  const loadUserRole = async () => {
    const raw = await AsyncStorage.getItem('user');
    if (raw) setUserRole(JSON.parse(raw)?.role);
  };

  const fetchFileDetails = async () => {
    try {
      const { data } = await fileService.getPreview(id);
      setFile(data);
    } catch {
      Alert.alert('Error', 'Could not load preview');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    setPaying(true);
    try {
      const { data: intent } = await api.post('/payment/create-intent', { fileId: id });
      await api.post('/payment/confirm-mock', { paymentIntentId: intent.id });

      Alert.alert(
        '✅ Payment Successful!',
        'Your file has been unlocked. You can now download the original file.',
        [{ text: 'Great!', onPress: () => fetchFileDetails() }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setPaying(false);
    }
  };

  const handleFreelancerAccept = async () => {
    setAccepting(true);
    try {
      const { data: intent } = await api.post('/payment/create-intent', { fileId: id });
      await api.post('/payment/confirm-mock', { paymentIntentId: intent.id });

      Alert.alert(
        '✅ Payment Accepted!',
        'The file has been unlocked. The client can now download it.',
        [{ text: 'Done', onPress: () => fetchFileDetails() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setAccepting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const token = await AsyncStorage.getItem('token');
      
      // Use original filename from the metadata API (which now has fallback for old files)
      const fileName = file?.originalName || `Secure_File_${id}.bin`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log(`Downloading ${fileName} to ${fileUri}`);

      const downloadResult = await FileSystem.downloadAsync(
        `${api.defaults.baseURL}/files/${id}/download`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (downloadResult.status === 200) {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
        
        if (isImage && status === 'granted') {
          // Direct save to gallery for images
          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
          Alert.alert('Success', 'Image saved directly to your gallery!');
        } else if (await Sharing.isAvailableAsync()) {
          // Standard share/save dialog for other files or if permission denied
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/octet-stream',
            dialogTitle: `Save ${fileName}`
          });
        } else {
          Alert.alert('Download Complete', `File saved as ${fileName}`);
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download and save file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleScreenshot = async () => {
    try { await fileService.logScreenshot(id); } catch {}
    Alert.alert(
      '⚠️ Security Violation', 
      'Screenshots are prohibited. This attempt has been logged and the freelancer notified.',
      [{ text: 'I Understand', style: 'destructive' }]
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Loading secure preview...</Text>
    </View>
  );

  const images = file?.previewUrl ? [{ url: file.previewUrl }] : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Watermarked Preview */}
        <TouchableOpacity 
          style={styles.previewContainer} 
          onPress={() => file?.previewUrl && setIsZoomModalVisible(true)}
          activeOpacity={0.9}
        >
          {file?.previewUrl ? (
            <>
              <Image
                source={{ uri: file.previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.zoomPrompt}>
                <Maximize2 size={20} color="#fff" />
                <Text style={styles.zoomText}>Tap to Zoom</Text>
              </View>
            </>
          ) : (
            <View style={styles.pdfPlaceholder}>
              <Shield size={48} color="#334155" />
              <Text style={styles.pdfText}>Preview not available for this file type</Text>
            </View>
          )}
          <View style={styles.securityBadge}>
            <Shield size={12} color="#fff" />
            <Text style={styles.securityText}>Protected Preview</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.statusBanner, file?.isUnlocked && styles.statusBannerUnlocked]}>
            <Text style={styles.statusText}>
              {file?.isUnlocked ? '🔓 File Unlocked — Premium Options Available' : '🔒 File Locked — Payment Required'}
            </Text>
          </View>

          {/* AI Proof of Effort Card */}
          {file?.proofOfEffort && (
            <View style={styles.aiCard}>
              <View style={styles.cardHeader}>
                <Info size={18} color="#3b82f6" />
                <Text style={styles.cardTitle}>AI Proof of Effort</Text>
                <Text style={styles.aiPowered}>Powered by Claude</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Originality</Text>
                  <Text style={styles.statValue}>{file.proofOfEffort.originalityScore ?? '—'}%</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Effort Level</Text>
                  <Text style={[styles.statValue, { color: '#10b981' }]}>{file.proofOfEffort.effortLevel ?? '—'}</Text>
                </View>
              </View>
              <Text style={styles.aiSummary}>{file.proofOfEffort.summary || 'No summary available.'}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {file?.isUnlocked ? (
            <TouchableOpacity 
              style={[styles.downloadBtn, downloading && { opacity: 0.7 }]} 
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Download size={22} color="#fff" />
                  <Text style={styles.btnText}>Download Original File</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.demoPayContainer}>
              <View style={styles.demoBanner}>
                <CreditCard size={14} color="#f59e0b" />
                <Text style={styles.demoBannerText}>🧪 DEMO MODE — No real payment needed</Text>
              </View>

              {userRole === 'freelancer' ? (
                // Freelancer: accept/unlock the file on their side
                <TouchableOpacity
                  style={[styles.acceptBtn, accepting && { opacity: 0.7 }]}
                  onPress={handleFreelancerAccept}
                  disabled={accepting}
                >
                  {accepting
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <CreditCard size={22} color="#fff" />
                        <Text style={styles.btnText}>Accept Payment & Unlock File</Text>
                      </>
                  }
                </TouchableOpacity>
              ) : (
                // Client: simulate paying
                <TouchableOpacity
                  style={[styles.payBtn, paying && { opacity: 0.7 }]}
                  onPress={handleMockPayment}
                  disabled={paying}
                >
                  {paying
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <CreditCard size={22} color="#fff" />
                        <Text style={styles.btnText}>Simulate Payment $50.00</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.annotateBtn}
            onPress={() => router.push(`/preview/annotate?id=${id}`)}
          >
            <PenLine size={20} color="#fff" />
            <Text style={styles.annotateBtnText}>Open Annotation Canvas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Screen Zoom Modal */}
      <Modal 
        visible={isZoomModalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setIsZoomModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <ImageViewer
            imageUrls={images}
            onCancel={() => setIsZoomModalVisible(false)}
            enableSwipeDown={true}
            renderHeader={() => (
              <TouchableOpacity 
                style={styles.closeModalBtn} 
                onPress={() => setIsZoomModalVisible(false)}
              >
                <X color="#fff" size={32} />
              </TouchableOpacity>
            )}
            renderIndicator={() => null}
            backgroundColor="#000"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', marginTop: 12 },
  previewContainer: { width, height: width, backgroundColor: '#000', position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  pdfPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  pdfText: { color: '#475569', marginTop: 12 },
  zoomPrompt: {
    position: 'absolute', bottom: 12, left: '50%', transform: [{ translateX: -50 }],
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  zoomText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  securityBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(59,130,246,0.85)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  securityText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  content: { padding: 20, gap: 16 },
  statusBanner: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 12, padding: 12,
  },
  statusBannerUnlocked: {
    backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)',
  },
  statusText: { color: '#e2e8f0', fontSize: 14, textAlign: 'center' },
  aiCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { color: '#fff', fontWeight: 'bold', flex: 1 },
  aiPowered: { color: '#475569', fontSize: 11 },
  statsRow: { flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#334155' },
  statLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#3b82f6', fontSize: 22, fontWeight: 'bold' },
  aiSummary: { color: '#94a3b8', lineHeight: 22, fontSize: 14 },
  annotateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 14, backgroundColor: '#475569',
  },
  annotateBtnText: { color: '#fff', fontWeight: 'bold' },
  optionsCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  optionsTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  formatRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  formatTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  formatTabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  formatTabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  formatTextActive: { color: '#fff' },
  qualityLabel: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  qualitySlider: { flexDirection: 'row', gap: 8 },
  qBtn: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  qBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  qText: { color: '#94a3b8', fontSize: 13 },
  qTextActive: { color: '#fff', fontWeight: 'bold' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 60, borderRadius: 16, backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 60, borderRadius: 16, backgroundColor: '#10b981',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  demoPayContainer: { gap: 12 },
  demoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  demoBannerText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 60, borderRadius: 16, backgroundColor: '#10b981',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: '#000' },
  closeModalBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 99,
    padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30,
  },
});
