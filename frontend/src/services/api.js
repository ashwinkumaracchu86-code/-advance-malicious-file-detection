import axios from 'axios';

const API_BASE = '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const filesAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  list: (params) => api.get('/files', { params }),
  get: (id) => api.get(`/files/${id}`),
};

export const scansAPI = {
  scan: (fileId) => api.post(`/scan/${fileId}`),
  get: (scanId) => api.get(`/scan/${scanId}`),
  list: (params) => api.get('/scans', { params }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/statistics'),
};

export const quarantineAPI = {
  quarantine: (fileId) => api.post(`/quarantine/${fileId}`),
  list: (params) => api.get('/quarantine', { params }),
  restore: (id) => api.post(`/quarantine/${id}/restore`),
  delete: (id) => api.delete(`/quarantine/${id}`),
};

export const reportsAPI = {
  getPDF: (scanId) =>
    api.get(`/reports/${scanId}`, { responseType: 'blob' }),
};

export const logsAPI = {
  list: (params) => api.get('/logs', { params }),
};

export const antivirusAPI = {
  getStatus: () => api.get('/antivirus/status'),
  getStats: () => api.get('/antivirus/stats'),
  scanShared: (formData) =>
    api.post('/antivirus/scan-shared', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  scanFolder: (formData) =>
    api.post('/antivirus/scan-folder', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  enableProtection: () => api.post('/antivirus/protection/enable'),
  disableProtection: () => api.post('/antivirus/protection/disable'),
  enableAutoScan: () => api.post('/antivirus/auto-scan/enable'),
  disableAutoScan: () => api.post('/antivirus/auto-scan/disable'),
  enableAutoQuarantine: () => api.post('/antivirus/auto-quarantine/enable'),
  disableAutoQuarantine: () => api.post('/antivirus/auto-quarantine/disable'),
  getNotifications: (params) => api.get('/antivirus/notifications', { params }),
  markNotificationsRead: () => api.post('/antivirus/notifications/mark-read'),
  clearNotifications: () => api.delete('/antivirus/notifications'),
  getScanHistory: (params) => api.get('/antivirus/scan-history', { params }),
  addMonitoredPath: (path) => api.post(`/antivirus/monitored-paths?path=${encodeURIComponent(path)}`),
  removeMonitoredPath: (path) => api.delete(`/antivirus/monitored-paths?path=${encodeURIComponent(path)}`),
};

export const folderMonitorAPI = {
  getStatus: () => api.get('/antivirus/status'),
  startMonitoring: (path) => api.post(`/antivirus/monitored-paths?path=${encodeURIComponent(path)}`),
  stopMonitoring: (path) => api.delete(`/antivirus/monitored-paths?path=${encodeURIComponent(path)}`),
  getNotifications: () => api.get('/antivirus/notifications'),
  getScanHistory: () => api.get('/antivirus/scan-history'),
};

export default api;
