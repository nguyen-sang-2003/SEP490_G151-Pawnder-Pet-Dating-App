/**
 * API Retry Utility
 */

import { AxiosError } from 'axios';

export interface RetryConfig {
  attempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Retryable HTTP status codes
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Retryable error codes
 */
const RETRYABLE_ERROR_CODES = [
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ENETUNREACH',
];

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: AxiosError): boolean => {
  // Network errors (no response)
  if (!error.response) {
    // Check for retryable error codes
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }
    // Timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }
    return false;
  }

  // HTTP status code errors
  const status = error.response.status;
  return RETRYABLE_STATUS_CODES.includes(status);
};

/**
 * Calculate retry delay with exponential backoff
 */
export const getRetryDelay = (
  attemptNumber: number,
  baseDelay: number,
  maxDelay: number = DEFAULT_RETRY_CONFIG.maxDelay
): number => {
  // Exponential backoff: baseDelay * 2^(attemptNumber - 1)
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  
  // Cap at maxDelay
  return Math.min(delay, maxDelay);
};

/**
 * Sleep utility for retry delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get retry attempt number from request config
 */
export const getRetryAttempt = (config: any): number => {
  return config.__retryCount || 0;
};

/**
 * Set retry attempt number in request config
 */
export const setRetryAttempt = (config: any, count: number): void => {
  config.__retryCount = count;
};
