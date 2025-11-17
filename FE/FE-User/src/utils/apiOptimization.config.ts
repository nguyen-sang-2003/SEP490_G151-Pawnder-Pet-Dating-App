/**
 * ⚙️ API Optimization Configuration
 * Centralized configuration for API layer optimizations
 */

export const API_OPTIMIZATION_CONFIG = {
  // Cache settings
  cache: {
    enabled: true,
    defaultDuration: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Max cache entries
  },

  // Retry settings
  retry: {
    enabled: true,
    attempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },

  // Compression
  compression: {
    enabled: true,
    acceptEncoding: 'gzip, deflate',
  },

  // Cancellation
  cancellation: {
    enabled: true,
    autoCancel: true, // Auto-cancel on component unmount
  },

  // Logging
  logging: {
    enabled: true,
    logCacheHits: true,
    logRetries: true,
    logCancellations: true,
  },
};

/**
 * Request configuration interface
 */
export interface OptimizedRequestConfig {
  // Cache options
  useCache?: boolean;
  cacheDuration?: number;
  cacheKey?: string;

  // Retry options
  retry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;

  // Cancellation
  cancelKey?: string;
}
