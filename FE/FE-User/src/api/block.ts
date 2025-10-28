import { apiClient } from './client';

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
    console.log(`📋 Getting blocked users for user: ${fromUserId}`);
    const response = await apiClient.get(`/block/${fromUserId}`);
    console.log(`✅ Got ${response.data.length} blocked users`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No blocked users yet - return empty array
      console.log('ℹ️ No blocked users found');
      return [];
    }
    console.error('❌ Error getting blocked users:', error);
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
    console.log(`🚫 Blocking user: ${fromUserId} -> ${toUserId}`);
    const response = await apiClient.post(`/block/${fromUserId}/${toUserId}`);
    console.log('✅ Block successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error blocking user:', error);
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
    console.log(`✅ Unblocking user: ${fromUserId} -> ${toUserId}`);
    const response = await apiClient.delete(`/block/${fromUserId}/${toUserId}`);
    console.log('✅ Unblock successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error unblocking user:', error);
    if (error.response?.status === 404) {
      throw new Error('Chưa chặn người dùng này hoặc đã hủy chặn.');
    }
    throw new Error(error.response?.data?.Message || 'Không thể hủy chặn người dùng');
  }
};

