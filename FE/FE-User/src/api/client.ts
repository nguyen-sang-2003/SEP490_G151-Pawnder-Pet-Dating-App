import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { Alert } from 'react-native';
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
 * Get stored access token
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

/**
 * Get stored refresh token
 */
const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'pawnder.refresh',
    });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored refresh token:', error);
    return null;
  }
};

/**
 * Store tokens
 */
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    // Store access token
    await Keychain.setGenericPassword('accessToken', accessToken, {
      service: 'pawnder.auth',
    });
    // Store refresh token
    await Keychain.setGenericPassword('refreshToken', refreshToken, {
      service: 'pawnder.refresh',
    });
  } catch (error) {
    console.error('Error storing tokens:', error);
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

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for auto-refresh token
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getStoredRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        console.log('🔄 Refreshing access token...');
        
        // Call refresh endpoint
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          RefreshToken: refreshToken,
        });

        const { AccessToken, RefreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        await storeTokens(AccessToken, newRefreshToken);
        
        console.log('✅ Token refreshed successfully');
        
        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${AccessToken}`;
        
        processQueue(null, AccessToken);
        isRefreshing = false;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('❌ Refresh token failed, logging out...');
        
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear all tokens
        try {
          await Keychain.resetGenericPassword({ service: 'pawnder.auth' });
          await Keychain.resetGenericPassword({ service: 'pawnder.refresh' });
        } catch (e) {
          console.error('Error clearing tokens:', e);
        }
        
        // Show alert
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
          [{ text: 'OK' }]
        );
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  },
);

export default apiClient;

