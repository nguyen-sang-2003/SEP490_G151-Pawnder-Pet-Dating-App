import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { getBaseUrl, API_CONFIG } from '../config/api.config';

// Get base URL from config
const BASE_URL = getBaseUrl();

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get stored auth token
 */
const getStoredToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'pawnder.auth',
    });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async config => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Only clear token if it's a login/auth endpoint
      if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/verify')) {
        try {
          await Keychain.resetGenericPassword({
            service: 'pawnder.auth',
          });
        } catch (e) {
          console.error('Error clearing token:', e);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

