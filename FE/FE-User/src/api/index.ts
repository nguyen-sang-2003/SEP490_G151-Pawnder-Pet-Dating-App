// Export axios client
export { apiClient, storeTokens, cachedGet, invalidateCache, clearCache, getCacheStats } from './axiosClient';
export type { ExtendedAxiosRequestConfig } from './axiosClient';

// Re-export APIs from features for backward compatibility
export * from '../features/auth/api/authApi';
export * from '../features/auth/api/otpApi';
export * from '../features/auth/api/addressApi';
export * from '../features/home/api/attributesApi';
export * from '../features/home/api/preferencesApi';
export * from '../features/pet/api/petApi';
export * from '../features/profile/api/userApi';
export * from '../features/match/api/matchApi';
export * from '../features/chat/api/chatApi';
export * from '../features/chat/api/chataiApi';
export * from '../features/report/api/blockApi';
export * from '../features/report/api/reportApi';
export * from '../features/expert/api/expertConfirmationApi';
export * from '../features/expert/api/expertChatApi';
export * from '../features/payment/api/paymentApi';
export * from '../features/notification/api/notificationApi';
