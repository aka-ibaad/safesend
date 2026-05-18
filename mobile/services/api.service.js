import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local IP address for physical device testing
// Windows: ipconfig -> IPv4 Address
const BASE_URL = 'http://192.168.0.102:5000/api';

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

export default api;
