import { apiClient } from './client';

// Types
export interface ExpertConfirmation {
  userId: number;
  chatAiId: number;
  expertId: number;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpertConfirmationCreateRequest {
  expertId: number;
  message?: string;
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
    console.error('❌ Get expert confirmations error:', error);
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
    console.log('📤 Creating expert confirmation:', { userId, chatId, data });
    
    const response = await apiClient.post<ExpertConfirmationResponse>(
      `/expert-confirmation/${userId}/${chatId}`,
      data
    );
    
    console.log('✅ Expert confirmation created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Create expert confirmation error:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.data?.Message) {
      throw new Error(error.response.data.Message);
    }
    throw new Error('Không thể tạo yêu cầu chuyên gia. Vui lòng thử lại.');
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
    console.error('❌ Update expert confirmation error:', error);
    if (error.response?.data?.Message) {
      throw new Error(error.response.data.Message);
    }
    throw new Error('Không thể cập nhật yêu cầu.');
  }
};

