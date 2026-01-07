/**
 * Network Monitor Utility
 * Tracks network connectivity and provides offline handling
 */

let isOnline = true;
let listeners: ((online: boolean) => void)[] = [];

/**
 * Initialize network monitoring
 * Note: Basic implementation - can be enhanced with @react-native-community/netinfo if needed
 */
export const initNetworkMonitor = () => {
  return () => {
    // Cleanup
  };
};

/**
 * Get current online status
 */
export const getIsOnline = (): boolean => {
  return isOnline;
};

/**
 * Subscribe to network status changes
 */
export const onNetworkChange = (callback: (online: boolean) => void): (() => void) => {
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

/**
 * Check if error is due to network issue
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.message?.includes('Network') ||
    error?.message?.includes('timeout') ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    !isOnline
  );
};

