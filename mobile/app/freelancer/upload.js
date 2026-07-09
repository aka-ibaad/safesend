import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, TextInput, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { fileService } from '../../services/api.service';
import { Upload, FileText, CheckCircle } from 'lucide-react-native';

export default function UploadFileScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const router = useRouter();

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'image/jpeg', 'image/png', 'application/pdf', 'application/zip', 
          'image/vnd.adobe.photoshop', 'application/postscript', 'application/illustrator'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return Alert.alert('No File', 'Please select a file first');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return Alert.alert('Price Required', 'Please enter a valid price for your work');
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('price', price);
      if (description) formData.append('description', description);

      await fileService.upload(formData);
      setUploaded(true);
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.heading}>Upload New File</Text>
      <Text style={styles.subheading}>Files are encrypted and watermarked automatically</Text>

      {/* File Picker Zone */}
      <TouchableOpacity style={styles.dropZone} onPress={pickFile}>
        {selectedFile ? (
          <View style={styles.selectedFile}>
            <FileText size={40} color="#3b82f6" />
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</Text>
          </View>
        ) : (
          <View style={styles.emptyZone}>
            <Upload size={40} color="#334155" />
            <Text style={styles.dropText}>Tap to select a file</Text>
            <Text style={styles.dropSubtext}>Images, PDFs, or Design Files (PSD/AI), Max 20MB</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Price Field */}
      <Text style={styles.label}>Your Price (USD) *</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.priceCurrency}>$</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="e.g. 120"
          placeholderTextColor="#475569"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Optional Description */}
      <Text style={styles.label}>Work Description (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your work for AI analysis..."
        placeholderTextColor="#475569"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What happens next?</Text>
        <Text style={styles.infoItem}>🔐  Your file will be AES-256 encrypted</Text>
        <Text style={styles.infoItem}>💧  A watermarked preview will be generated</Text>
        <Text style={styles.infoItem}>🤖  Claude AI will analyze your work effort</Text>
        <Text style={styles.infoItem}>☁️  Both versions are stored on Cloudinary</Text>
      </View>

      {uploaded ? (
        <View style={styles.successBadge}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.successText}>File uploaded successfully!</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, !selectedFile && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={uploading || !selectedFile}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload & Encrypt</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  heading: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subheading: { color: '#94a3b8', fontSize: 14, marginBottom: 24 },
  dropZone: {
    height: 180, borderRadius: 20, borderWidth: 2, borderColor: '#334155',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1e293b', marginBottom: 24,
  },
  emptyZone: { alignItems: 'center' },
  dropText: { color: '#64748b', fontSize: 16, marginTop: 12 },
  dropSubtext: { color: '#475569', fontSize: 12, marginTop: 4 },
  selectedFile: { alignItems: 'center' },
  fileName: { color: '#fff', fontWeight: 'bold', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 },
  fileSize: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  label: { color: '#94a3b8', marginBottom: 8, fontSize: 14 },
  priceContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#3b82f6', marginBottom: 20, height: 56,
  },
  priceCurrency: { color: '#3b82f6', fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  priceInput: { flex: 1, color: '#fff', fontSize: 20, fontWeight: 'bold' },
  input: {
    backgroundColor: '#1e293b', color: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#334155', marginBottom: 24, minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#334155', marginBottom: 24,
  },
  infoTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 12 },
  infoItem: { color: '#94a3b8', marginBottom: 8, lineHeight: 20 },
  button: {
    backgroundColor: '#3b82f6', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#1e3a5f', opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  successText: { color: '#10b981', fontWeight: 'bold', fontSize: 16 },
});
