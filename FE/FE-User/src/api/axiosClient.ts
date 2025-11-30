import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl, API_CONFIG } from '../config/api.config';
import { apiCache, createCacheKey } from '../services/apiCache';
import {
  isRetryableError,
  getRetryDelay,
  sleep,
  getRetryAttempt,
  setRetryAttempt
} from '../services/apiRetry';
import { apiCancel, isCancel } from '../services/apiCancel';
import { API_OPTIMIZATION_CONFIG, OptimizedRequestConfig } from '../services/apiOptimization.config';

// Get base URL from config
const BASE_URL = getBaseUrl();

// Extended request config interface
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig, OptimizedRequestConfig { }

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

    return null;
  }
};

/**
 * Store tokens
 */
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    // ✅ Validate tokens before storing
    if (!accessToken || accessToken.trim() === '') {
      console.warn('⚠️ Invalid access token, skipping storage');
      return;
    }
    if (!refreshToken || refreshToken.trim() === '') {
      console.warn('⚠️ Invalid refresh token, skipping storage');
      return;
    }

    // Store access token
    await Keychain.setGenericPassword('accessToken', accessToken, {
      service: 'pawnder.auth',
    });
    // Store refresh token
    await Keychain.setGenericPassword('refreshToken', refreshToken, {
      service: 'pawnder.refresh',
    });
    console.log('✅ Tokens stored successfully');
  } catch (error) {
    console.error('❌ Error storing tokens:', error);
  }
};

// Request interceptor to add auth token, compression headers, and handle caching
apiClient.interceptors.request.use(
  async config => {
    // Add auth token
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add compression headers
    if (API_OPTIMIZATION_CONFIG.compression.enabled) {
      config.headers['Accept-Encoding'] = API_OPTIMIZATION_CONFIG.compression.acceptEncoding;
    }

    // Handle request cancellation
    const extendedConfig = config as ExtendedAxiosRequestConfig;
    if (API_OPTIMIZATION_CONFIG.cancellation.enabled && extendedConfig.cancelKey) {
      const cancelToken = apiCancel.createToken(extendedConfig.cancelKey);
      config.cancelToken = cancelToken.token;
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

// Response interceptor for auto-refresh token, retry logic, and cache management
apiClient.interceptors.response.use(
  response => {
    // Invalidate cache on mutation requests (POST, PUT, DELETE, PATCH)
    const method = response.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const url = response.config.url || '';

      // Extract resource type from URL (e.g., /api/pet/123 -> pet)
      const resourceMatch = url.match(/\/api\/([^\/]+)/);
      if (resourceMatch) {
        const resource = resourceMatch[1];
        apiCache.invalidatePattern(resource);
        console.log(`🗑️ [ApiClient] Invalidated cache for resource: ${resource}`);
      }
    }

    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle cancelled requests silently
    if (isCancel(error)) {
      console.log('🚫 [ApiClient] Request cancelled:', originalRequest?.url);
      return Promise.reject(error);
    }

    // Handle network errors gracefully
    if (!error.response && error.code) {
      console.log(`📡 [ApiClient] Network error: ${error.code} - ${error.message}`);
      // Don't retry network errors as aggressively (they're likely to fail again)
      if (originalRequest) {
        const retryAttempt = getRetryAttempt(originalRequest);
        if (retryAttempt >= 1) {
          // Already retried once, fail fast
          console.log('⚠️ [ApiClient] Network error - failing fast after 1 retry');
          return Promise.reject(error);
        }
      }
    }

    // Retry logic for retryable errors (before 401 handling)
    if (
      API_OPTIMIZATION_CONFIG.retry.enabled &&
      isRetryableError(error as AxiosError) &&
      originalRequest &&
      !originalRequest._retry // Don't retry token refresh attempts
    ) {
      const retryAttempt = getRetryAttempt(originalRequest);
      const maxAttempts = (originalRequest as ExtendedAxiosRequestConfig).retryAttempts ||
        API_OPTIMIZATION_CONFIG.retry.attempts;

      if (retryAttempt < maxAttempts) {
        const nextAttempt = retryAttempt + 1;
        setRetryAttempt(originalRequest, nextAttempt);

        const delay = getRetryDelay(
          nextAttempt,
          (originalRequest as ExtendedAxiosRequestConfig).retryDelay ||
          API_OPTIMIZATION_CONFIG.retry.baseDelay,
          API_OPTIMIZATION_CONFIG.retry.maxDelay
        );

        console.log(
          `🔄 [ApiClient] Retry attempt ${nextAttempt}/${maxAttempts} for ${originalRequest.url} after ${delay}ms (timeout: ${originalRequest.timeout || API_CONFIG.TIMEOUT}ms)`
        );

        await sleep(delay);

        // IMPORTANT: Preserve the original timeout for retry
        // This is critical for long-running requests like AI chat (50s timeout)
        // Without this, retries would use the default 10s timeout and fail
        return apiClient(originalRequest);
      } else {
        console.log(
          `❌ [ApiClient] Max retry attempts (${maxAttempts}) reached for ${originalRequest.url}`
        );
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for login/register endpoints (they don't need tokens)
      const url = originalRequest.url || '';
      const isAuthEndpoint = url.includes('/login') ||
        url.includes('/register') ||
        url.includes('/refresh') ||
        url.includes('/forgot-password');

      if (isAuthEndpoint) {
        // Don't try to refresh token for auth endpoints, just reject
        return Promise.reject(error);
      }

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
          console.log('⚠️ No refresh token found in Keychain');
          throw new Error('No refresh token');
        }

        console.log('🔄 Refreshing access token...');

        // Call refresh endpoint
        const response = await axios.post(`${BASE_URL}/api/refresh`, {
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
      } catch (refreshError: any) {
        console.log('❌ Refresh token failed:', refreshError?.message || refreshError);

        processQueue(refreshError, null);
        isRefreshing = false;

        // Only logout if it's actually a token issue (not network error)
        const shouldLogout =
          refreshError?.message === 'No refresh token' ||
          refreshError?.response?.status === 401 ||
          refreshError?.response?.status === 403;

        if (shouldLogout) {
          console.log('🚪 Logging out due to invalid/missing refresh token');
          // Clear all tokens and user data
          try {
            await Keychain.resetGenericPassword({ service: 'pawnder.auth' });
            await Keychain.resetGenericPassword({ service: 'pawnder.refresh' });
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userRole');
            // Set logout flag to trigger navigation
            await AsyncStorage.setItem('shouldLogout', 'true');
            console.log('🔐 Cleared all tokens and set logout flag');
          } catch (e) {

          }
        } else {
          console.log('⚠️ Refresh failed due to network/server error, not logging out');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Helper function to make cached GET requests
 */
export const cachedGet = async <T = any>(
  url: string,
  config?: ExtendedAxiosRequestConfig
): Promise<T> => {
  const useCache = config?.useCache ?? API_OPTIMIZATION_CONFIG.cache.enabled;
  const cacheDuration = config?.cacheDuration ?? API_OPTIMIZATION_CONFIG.cache.defaultDuration;

  if (!useCache || config?.method?.toUpperCase() !== 'GET') {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  }

  // Create cache key
  const cacheKey = config?.cacheKey || createCacheKey(url, config?.params);

  // Use cache
  return apiCache.get(
    cacheKey,
    async () => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    },
    cacheDuration
  );
};

/**
 * Helper function to invalidate cache by pattern
 */
export const invalidateCache = (pattern: string): void => {
  apiCache.invalidatePattern(pattern);
};

/**
 * Helper function to clear all cache
 */
export const clearCache = (): void => {
  apiCache.clear();
};

/**
 * Helper function to get cache stats
 */
export const getCacheStats = () => {
  return apiCache.getStats();
};

export default apiClient;

