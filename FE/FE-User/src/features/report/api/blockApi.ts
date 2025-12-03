import { apiClient } from '../../../api/axiosClient';

// ==================== INTERFACES ====================

export interface BlockedUser {
  toUserId: number;
  toUserFullName: string;
  toUserEmail: string;
  createdAt: string;
}

export interface BlockResponse {
  fromUserId: number;
  toUserId: number;
  createdAt: string;
  message: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get list of users blocked by current user
 * GET /block/{fromUserId}
 */
export const getBlockedUsers = async (fromUserId: number): Promise<BlockedUser[]> => {
  try {

    const response = await apiClient.get(`/block/${fromUserId}`);

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No blocked users yet - return empty array

      return [];
    }

    throw error;
  }
};

/**
 * Block a user
 * POST /block/{fromUserId}/{toUserId}
 */
export const blockUser = async (
  fromUserId: number,
  toUserId: number
): Promise<BlockResponse> => {
  try {

    const response = await apiClient.post(`/block/${fromUserId}/${toUserId}`);

    return response.data;
  } catch (error: any) {

    if (error.response?.status === 409) {
      throw new Error('Người dùng này đã bị chặn trước đó.');
    }
    if (error.response?.status === 400) {
      throw new Error('Không thể tự chặn chính mình.');
    }
    throw new Error(error.response?.data?.Message || 'Không thể chặn người dùng');
  }
};

/**
 * Unblock a user
 * DELETE /block/{fromUserId}/{toUserId}
 */
export const unblockUser = async (
  fromUserId: number,
  toUserId: number
): Promise<BlockResponse> => {
  try {

    const response = await apiClient.delete(`/block/${fromUserId}/${toUserId}`);

    return response.data;
  } catch (error: any) {

    if (error.response?.status === 404) {
      throw new Error('Chưa chặn người dùng này hoặc đã hủy chặn.');
    }
    throw new Error(error.response?.data?.Message || 'Không thể hủy chặn người dùng');
  }
};

