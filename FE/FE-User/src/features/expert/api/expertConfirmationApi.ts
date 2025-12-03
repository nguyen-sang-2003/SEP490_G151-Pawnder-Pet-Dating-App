import { apiClient } from '../../../api/axiosClient';

// Types
export interface ExpertConfirmation {
  userId: number;
  chatAiId: number;
  expertId: number;
  status: string;
  message?: string;
  userQuestion?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpertConfirmationCreateRequest {
  expertId?: number;  // Optional - will be auto-assigned if not provided
  message?: string;
  userQuestion?: string;
}

export interface ExpertConfirmationResponse {
  userId: number;
  chatAiId: number;
  expertId: number;
  status: string;
  message?: string;
  resultMessage: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get all expert confirmations for a user
 * GET /api/expert-confirmation/{userId}
 */
export const getUserExpertConfirmations = async (
  userId: number
): Promise<ExpertConfirmation[]> => {
  try {
    const response = await apiClient.get<ExpertConfirmation[]>(
      `/expert-confirmation/${userId}`
    );
    return response.data;
  } catch (error: any) {

    if (error.response?.data?.Message) {
      throw new Error(error.response.data.Message);
    }
    throw new Error('Không thể tải danh sách yêu cầu chuyên gia.');
  }
};

/**
 * Create expert confirmation request
 * POST /api/expert-confirmation/{userId}/{chatId}
 */
export const createExpertConfirmation = async (
  userId: number,
  chatId: number,
  data: ExpertConfirmationCreateRequest
): Promise<ExpertConfirmationResponse> => {
  try {
    const response = await apiClient.post<ExpertConfirmationResponse>(
      `/expert-confirmation/${userId}/${chatId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    // Don't log 429 limit errors (handled by UI modal)
    if (error.response?.status !== 429) {

    }
    // Pass through the original error for UI handling
    throw error;
  }
};

/**
 * Update expert confirmation (for expert to respond)
 * PUT /api/expert-confirmation/{expertId}/{userId}/{chatId}
 */
export const updateExpertConfirmation = async (
  expertId: number,
  userId: number,
  chatId: number,
  status: string,
  message?: string
): Promise<ExpertConfirmationResponse> => {
  try {
    const response = await apiClient.put<ExpertConfirmationResponse>(
      `/expert-confirmation/${expertId}/${userId}/${chatId}`,
      { Status: status, Message: message }
    );
    return response.data;
  } catch (error: any) {

    if (error.response?.data?.Message) {
      throw new Error(error.response.data.Message);
    }
    throw new Error('Không thể cập nhật yêu cầu.');
  }
};

/**
 * Get user's expert chats (legacy endpoint)
 * GET /api/expert-chats/{userId}
 * @deprecated Use getUserExpertChats from expertChatApi.ts instead
 */
export const getUserExpertChatsList = async (
  userId: number
): Promise<import('./expertChatApi').ExpertChatListItem[]> => {
  try {
    const response = await apiClient.get(`/expert-chats/${userId}`);
    return (response.data.data || []) as import('./expertChatApi').ExpertChatListItem[];
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chat với chuyên gia.');
  }
};

