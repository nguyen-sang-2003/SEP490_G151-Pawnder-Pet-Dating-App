/**
 * API Configuration
 * Update these values based on your environment
 */

export const API_CONFIG = {
  // Development URLs
  ANDROID_EMULATOR: 'http://10.0.2.2:5297',
  IOS_SIMULATOR: 'http://localhost:5297',
  
  // Production URL (update with your actual production URL)
  PRODUCTION: 'https://api.pawnder.com',
  
  // For testing on real device, use your computer's IP
  // Find your IP:
  // - Windows: Run 'ipconfig' in CMD
  // - Mac/Linux: Run 'ifconfig' or 'ip addr'
  LOCAL_NETWORK: 'http://192.168.1.100:5297', // Update with your IP
  
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
};

/**
 * Environment type
 */
export type Environment = 'android' | 'ios' | 'local_network' | 'production';

/**
 * Current environment - Change this to switch between different environments
 */
const CURRENT_ENVIRONMENT: Environment = 'android';

/**
 * Get the appropriate base URL based on platform and environment
 */
export const getBaseUrl = (environment: Environment = CURRENT_ENVIRONMENT): string => {
  switch (environment) {
    case 'android':
      return API_CONFIG.ANDROID_EMULATOR;
    case 'ios':
      return API_CONFIG.IOS_SIMULATOR;
    case 'local_network':
      return API_CONFIG.LOCAL_NETWORK;
    case 'production':
      return API_CONFIG.PRODUCTION;
    default:
      return API_CONFIG.ANDROID_EMULATOR;
  }
};

