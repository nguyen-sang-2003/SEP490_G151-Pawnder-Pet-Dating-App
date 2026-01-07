import apiClient from '../../../api/axiosClient';

/**
 * Chat AI API endpoints
 */

// =============== Types ===============
export interface ChatAISession {
  chatAiid: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastQuestion: string | null;
}

export interface ChatAIMessage {
  contentId: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface CreateChatRequest {
  title?: string;
}

export interface SendAIMessageRequest {
  question: string;
}

export interface UpdateTitleRequest {
  title: string;
}

// =============== API Functions ===============

/**
 * Get all AI chat sessions for a user
 * GET /api/chat-ai/{userId}
 */
export const getChatAISessions = async (userId: number): Promise<ChatAISession[]> => {
  try {

    const response = await apiClient.get(`/api/chat-ai/${userId}`);

    return response.data.data || [];
  } catch (error: any) {
    // Silent fail - let UI handle the error
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chat AI');
  }
};

/**
 * Create new AI chat session
 * POST /api/chat-ai/{userId}
 */
export const createChatAISession = async (
  userId: number,
  request: CreateChatRequest = {}
): Promise<{ chatId: number; title: string; createdAt: string }> => {
  try {
    const response = await apiClient.post(`/api/chat-ai/${userId}`, request);
    return response.data.data;
  } catch (error: any) {

    // Handle specific errors
    if (error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('Không thể tạo cuộc trò chuyện mới');
  }
};

/**
 * Get chat history (messages)
 * GET /api/chat-ai/{chatAiId}/messages
 */
export const getChatAIHistory = async (chatAiId: number): Promise<{
  chatTitle: string;
  messages: ChatAIMessage[];
}> => {
  try {

    const response = await apiClient.get(`/api/chat-ai/${chatAiId}/messages`);

    return response.data.data;
  } catch (error: any) {
    // Silent fail - let UI handle the error
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải lịch sử chat');
  }
};

export interface AIMessageResponse {
  question: string;
  answer: string;
  timestamp: string;
  usage: {
    isVip: boolean;
    dailyQuota: number;
    tokensUsed: number;
    tokensRemaining: number;
    exceededQuota?: boolean;
  };
  tokenDetails: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Send message to AI
 * POST /api/chat-ai/{chatAiId}/messages
 */
export const sendMessageToAI = async (
  chatAiId: number,
  question: string
): Promise<AIMessageResponse> => {
  try {
    // AI requests need longer timeout (50 seconds) because backend calls Gemini API (45s timeout)
    const response = await apiClient.post(
      `/api/chat-ai/${chatAiId}/messages`,
      { question },
      {
        timeout: 50000,
        retryAttempts: 1
      } as any
    );

    return response.data.data;
  } catch (error: any) {


    // Silent fail for all errors (handled by UI modal or screen)
    throw error;
  }
};

/**
 * Update chat title
 * PUT /api/chat-ai/{chatAiId}
 */
export const updateChatAITitle = async (
  chatAiId: number,
  title: string
): Promise<void> => {
  try {

    const response = await apiClient.put(`/api/chat-ai/${chatAiId}`, { title });

  } catch (error: any) {
    // Silent fail - let UI handle the error
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể cập nhật tiêu đề');
  }
};

/**
 * Delete chat session
 * DELETE /api/chat-ai/{chatAiId}
 */
export const deleteChatAISession = async (chatAiId: number): Promise<void> => {
  try {

    const response = await apiClient.delete(`/api/chat-ai/${chatAiId}`);

  } catch (error: any) {
    // Silent fail - let UI handle the error
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể xóa cuộc trò chuyện');
  }
};

/**
 * Get current token usage
 * GET /api/chat-ai/token-usage
 */
export const getTokenUsage = async (): Promise<{
  isVip: boolean;
  dailyQuota: number;
  tokensUsed: number;
  tokensRemaining: number;
}> => {
  try {
    const response = await apiClient.get('/api/chat-ai/token-usage');
    return response.data.data;
  } catch (error: any) {
    // Silent fail - return default values
    return {
      isVip: false,
      dailyQuota: 10000,
      tokensUsed: 0,
      tokensRemaining: 10000
    };
  }
};

