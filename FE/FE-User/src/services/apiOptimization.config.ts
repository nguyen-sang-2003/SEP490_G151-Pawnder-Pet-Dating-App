/**
 * API Optimization Configuration
 */

export const API_OPTIMIZATION_CONFIG = {
  // Cache settings
  cache: {
    enabled: true,
    defaultDuration: 5 * 60 * 1000, // 5 minutes
    shortDuration: 30 * 1000, // 30 seconds for frequently changing data
    longDuration: 15 * 60 * 1000, // 15 minutes for static data
    maxSize: 150, // Max cache entries (increased)
  },

  // Retry settings
  retry: {
    enabled: true,
    attempts: 2, // Reduced from 3 to 2 for faster failure detection
    baseDelay: 2000, // 2 seconds (increased for Azure cold start)
    maxDelay: 15000, // 15 seconds (increased for production)
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
