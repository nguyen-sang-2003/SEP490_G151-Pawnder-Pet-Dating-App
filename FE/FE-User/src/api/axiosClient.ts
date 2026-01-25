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
import { emitPolicyRequired, hasPolicyRequiredListeners } from '../services/policyEventEmitter';

// Get base URL from config
const BASE_URL = getBaseUrl();

// Extended request config interface
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig, OptimizedRequestConfig {
  _policyRetry?: boolean;
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Get stored access token
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

//Get stored refresh token
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

// Store tokens
 
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    if (!accessToken || accessToken.trim() === '') {
      return;
    }
    if (!refreshToken || refreshToken.trim() === '') {
      return;
    }

    await Keychain.setGenericPassword('accessToken', accessToken, {
      service: 'pawnder.auth',
    });
    await Keychain.setGenericPassword('refreshToken', refreshToken, {
      service: 'pawnder.refresh',
    });
  } catch (error) {
    // Silent fail
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
let refreshPromise: Promise<string> | null = null;
let refreshAttempts = 0;
let lastRefreshAttemptTime = 0;

// Policy acceptance queue - similar to token refresh queue
let isPolicyModalShowing = false;
let policyQueue: { resolve: (value: any) => void; reject: (error: any) => void; config: any }[] = [];

const processPolicyQueue = (error: any = null) => {
  console.log('[Policy] Processing queue, items:', policyQueue.length, 'error:', !!error);
  policyQueue.forEach(async (item) => {
    if (error) {
      item.reject(error);
    } else {
      try {
        // Retry the request
        const response = await apiClient(item.config);
        item.resolve(response);
      } catch (retryError) {
        item.reject(retryError);
      }
    }
  });
  policyQueue = [];
  isPolicyModalShowing = false;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
  refreshPromise = null;
  
  if (!error) {
    refreshAttempts = 0;
    lastRefreshAttemptTime = 0;
  }
};

// Response interceptor for auto-refresh token, retry logic, and cache management
apiClient.interceptors.response.use(
  response => {
    const method = response.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const url = response.config.url || '';

      const resourceMatch = url.match(/\/api\/([^\/]+)/);
      if (resourceMatch) {
        const resource = resourceMatch[1];
        apiCache.invalidatePattern(resource);
      }
    }

    return response;
  },
  async error => {
    const originalRequest = error.config;

    if (isCancel(error)) {
      return Promise.reject(error);
    }

    if (!error.response && error.code) {
      if (originalRequest) {
        const retryAttempt = getRetryAttempt(originalRequest);
        if (retryAttempt >= 1) {
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

        await sleep(delay);

        return apiClient(originalRequest);
      }
    }

    // Handle POLICY_REQUIRED error (403 with specific errorCode)
    if (
      error.response?.status === 403 &&
      (error.response?.data?.errorCode === 'POLICY_REQUIRED' ||
        error.response?.data?.ErrorCode === 'POLICY_REQUIRED') &&
      !originalRequest._policyRetry
    ) {
      // Support both camelCase and PascalCase from backend
      const rawPolicies =
        error.response.data.pendingPolicies ||
        error.response.data.PendingPolicies ||
        [];

      // Map PascalCase to camelCase
      const pendingPolicies = rawPolicies.map((p: any) => ({
        policyCode: p.policyCode || p.PolicyCode,
        policyName: p.policyName || p.PolicyName,
        description: p.description || p.Description,
        displayOrder: p.displayOrder || p.DisplayOrder,
        versionNumber: p.versionNumber || p.VersionNumber,
        title: p.title || p.Title,
        content: p.content || p.Content,
        changeLog: p.changeLog || p.ChangeLog,
        publishedAt: p.publishedAt || p.PublishedAt,
        hasPreviousAccept: p.hasPreviousAccept ?? p.HasPreviousAccept ?? false,
        previousAcceptVersion: p.previousAcceptVersion || p.PreviousAcceptVersion,
      }));

      // Only handle if there are listeners registered
      if (hasPolicyRequiredListeners() && pendingPolicies.length > 0) {
        originalRequest._policyRetry = true;

        // If modal is already showing, queue this request
        if (isPolicyModalShowing) {
          console.log('[Policy] Modal already showing, queuing request:', originalRequest.url);
          return new Promise((resolve, reject) => {
            policyQueue.push({ resolve, reject, config: originalRequest });
          });
        }

        // First request - show modal
        isPolicyModalShowing = true;
        console.log('[Policy] Showing modal for request:', originalRequest.url);

        return new Promise((resolve, reject) => {
          // Add current request to queue
          policyQueue.push({ resolve, reject, config: originalRequest });

          emitPolicyRequired({
            pendingPolicies,
            originalRequest,
            onAccepted: () => {
              console.log('[Policy] onAccepted called, processing queue');
              processPolicyQueue(null);
            },
            onRejected: err => {
              console.log('[Policy] onRejected called');
              processPolicyQueue(err || error);
            },
          });
        });
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

      if (isRefreshing && refreshPromise) {
        return refreshPromise.then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      
      const now = Date.now();
      const timeSinceLastAttempt = now - lastRefreshAttemptTime;
      const backoffDelay = Math.min(1000 * Math.pow(2, refreshAttempts), 30000);
      
      if (refreshAttempts > 0 && timeSinceLastAttempt < backoffDelay) {
        await new Promise<void>(resolve => setTimeout(resolve, backoffDelay - timeSinceLastAttempt));
      }
      
      refreshAttempts++;
      lastRefreshAttemptTime = Date.now();
      isRefreshing = true;

      refreshPromise = (async () => {
        try {
          const refreshToken = await getStoredRefreshToken();

          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await axios.post(
            `${BASE_URL}/api/refresh`,
            { RefreshToken: refreshToken },
            { signal: controller.signal }
          );

        clearTimeout(timeoutId);

        const accessToken =
          (response.data as any).AccessToken ??
          (response.data as any).accessToken;
        const newRefreshToken =
          (response.data as any).RefreshToken ??
          (response.data as any).refreshToken;

        if (!accessToken || !newRefreshToken) {
          throw new Error('Invalid tokens received from server');
        }

        await storeTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);
          isRefreshing = false;

          return accessToken;
        } catch (refreshError: any) {

          processQueue(refreshError, null);
          isRefreshing = false;

          const isTokenError = 
            refreshError?.message === 'No refresh token' ||
            refreshError?.message === 'Invalid tokens received from server' ||
            (refreshError?.response?.status === 401 && refreshError?.response?.data?.message?.includes('token')) ||
            (refreshError?.response?.status === 403 && refreshError?.response?.data?.message?.includes('token'));

          const isNetworkError = 
            !refreshError?.response ||
            refreshError?.code === 'ECONNABORTED' ||
            refreshError?.code === 'ERR_NETWORK';

          if (isTokenError && !isNetworkError) {
            try {
              await Keychain.resetGenericPassword({ service: 'pawnder.auth' });
              await Keychain.resetGenericPassword({ service: 'pawnder.refresh' });
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.setItem('shouldLogout', 'true');
            } catch (e) {
              // Silent fail
            }
          }

          throw refreshError;
        }
      })();

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        return Promise.reject(err);
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

