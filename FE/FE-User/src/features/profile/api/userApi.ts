import apiClient, { cachedGet, invalidateCache } from '../../../api/axiosClient';
import type { UserResponse } from '../../auth/api/authApi';

export interface UserUpdateRequest {
  RoleId: number;
  AddressId?: number;
  FullName: string;
  Gender: string;
  NewPassword?: string;
}

/**
 * Get user by ID
 * GET /user/{userId}
 * Optimized with 5min cache
 */
export const getUserById = async (userId: number): Promise<UserResponse> => {
  try {
    return await cachedGet<UserResponse>(`/user/${userId}`, {
      cacheDuration: 5 * 60 * 1000, // 5 minutes cache
      cacheKey: `user-${userId}`,
      timeout: 30000,
      retryAttempts: 2,
    });
  } catch (error: any) {
    throw error;
  }
};

/**
 * Update user
 * PUT /user/{userId}
 * Invalidates user cache after update
 */
export const updateUser = async (
  userId: number,
  data: UserUpdateRequest
): Promise<UserResponse> => {
  try {
    const response = await apiClient.put(`/user/${userId}`, data);
    
    // Invalidate user cache after update
    invalidateCache(`user-${userId}`);
    invalidateCache('user'); // Also clear any user-related patterns
    
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

