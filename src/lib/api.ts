import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * IMPORTANT:
 * If using an Android Emulator, use 'http://10.0.2.2:8088/api/v1'
 * If using a Physical Device, use your computer's IP: 'http://192.168.1.3:8088/api/v1'
 */
// const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8088/api/v1' : 'http://localhost:8088/api/v1';
const API_BASE_URL = 'http://192.168.1.83:8088/api/v1';
// const API_BASE_URL = 'http://192.168.1.3:8088/api/v1'; // Uncomment and update if using physical device

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // A 401 from a credential-check endpoint (login / change-password) means the
    // submitted credentials were wrong — not that the active session expired — so
    // we must NOT clear the stored token in that case, otherwise mistyping the
    // current password would silently break the whole session.
    const requestUrl: string = originalRequest?.url || '';
    const isCredentialCheck =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/change-password');
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isCredentialCheck
    ) {
      originalRequest._retry = true;
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.warn('Unauthorized – logging out');
    }
    return Promise.reject(error);
  }
);

export default api;