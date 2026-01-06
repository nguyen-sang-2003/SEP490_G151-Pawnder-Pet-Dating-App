/**
 * useApiCancel Hook
 */

import { useEffect, useRef } from 'react';
import { apiCancel } from '../services/apiCancel';
import { CancelTokenSource } from 'axios';

/**
 * Hook to automatically cancel API requests when component unmounts
 * @param key - Unique key for the cancel token
 * @returns Cancel token source
 */
export const useApiCancel = (key?: string) => {
  const cancelKeyRef = useRef<string>(key || `request-${Date.now()}-${Math.random()}`);
  const tokenRef = useRef<CancelTokenSource | null>(null);

  useEffect(() => {
    // Create cancel token on mount
    tokenRef.current = apiCancel.createToken(cancelKeyRef.current);

    // Cancel on unmount
    return () => {
      apiCancel.cancel(cancelKeyRef.current, 'Component unmounted');
    };
  }, []);

  return {
    cancelToken: tokenRef.current?.token,
    cancelKey: cancelKeyRef.current,
    cancel: (message?: string) => apiCancel.cancel(cancelKeyRef.current, message),
  };
};

/**
 * Hook to get a cancel token without automatic cancellation
 * Useful when you want manual control over cancellation
 */
export const useManualCancel = () => {
  const createToken = (key?: string) => {
    return apiCancel.createToken(key);
  };

  const cancel = (key: string, message?: string) => {
    apiCancel.cancel(key, message);
  };

  const cancelAll = (message?: string) => {
    apiCancel.cancelAll(message);
  };

  return {
    createToken,
    cancel,
    cancelAll,
  };
};
