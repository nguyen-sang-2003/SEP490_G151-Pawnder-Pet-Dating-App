import client from './client';
import type { UserResponse } from './auth';

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
 */
export const getUserById = async (userId: number): Promise<UserResponse> => {
  try {

    const response = await client.get(`/user/${userId}`);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching user:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Update user
 * PUT /user/{userId}
 */
export const updateUser = async (
  userId: number,
  data: UserUpdateRequest
): Promise<UserResponse> => {
  try {

    const response = await client.put(`/user/${userId}`, data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating user:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

