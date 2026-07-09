import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically use the same IP that Expo is running from.
// This works on physical devices with Expo Go without manual IP changes.
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  // Fallback for production or standalone builds
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const fileService = {
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyFiles: () => api.get('/files/my-files'),
  getSharedFiles: () => api.get('/files/shared-files'),
  getPreview: (id) => api.get(`/files/${id}/preview`),
  download: (id) => api.get(`/files/${id}/download`),
  annotate: (id, data) => api.post(`/files/${id}/annotate`, data),
  getAnnotations: (id) => api.get(`/files/${id}/annotations`),
  logScreenshot: (id) => api.post(`/files/${id}/screenshot-alert`),
};

export const paymentService = {
  createIntent: (fileId) => api.post('/payment/create-intent', { fileId }),
  confirmPayment: (paymentIntentId) => api.post('/payment/confirm-mock', { paymentIntentId }),
  getMyPayments: () => api.get('/payment/my-payments'),
  getPendingPayments: () => api.get('/payment/pending'),
  getPaymentHistory: () => api.get('/payment/history'),
  rejectPayment: (fileId) => api.post('/payment/reject', { fileId }),
};

export default api;
