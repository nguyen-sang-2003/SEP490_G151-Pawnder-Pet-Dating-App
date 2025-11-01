import client from './client';

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

export interface SendMessageRequest {
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
    console.log('📞 Getting AI chat sessions for user:', userId);
    const response = await client.get(`/api/chat-ai/${userId}`);
    console.log('✅ Got AI chat sessions:', response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Error getting AI chat sessions:', error);
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
    console.log('📞 Creating new AI chat session:', { userId, request });
    const response = await client.post(`/api/chat-ai/${userId}`, request);
    console.log('✅ Created AI chat session:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error creating AI chat session:', error);
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
    console.log('📞 Getting AI chat history:', chatAiId);
    const response = await client.get(`/api/chat-ai/${chatAiId}/messages`);
    console.log('✅ Got AI chat history:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error getting AI chat history:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải lịch sử chat');
  }
};

/**
 * Send message to AI
 * POST /api/chat-ai/{chatAiId}/messages
 */
export const sendMessageToAI = async (
  chatAiId: number,
  question: string
): Promise<{ question: string; answer: string; timestamp: string }> => {
  try {
    console.log('📞 Sending message to AI:', { chatAiId, question });
    const response = await client.post(`/api/chat-ai/${chatAiId}/messages`, {
      question,
    });
    console.log('✅ Got AI response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error sending message to AI:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi tin nhắn đến AI');
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
    console.log('📞 Updating AI chat title:', { chatAiId, title });
    const response = await client.put(`/api/chat-ai/${chatAiId}`, { title });
    console.log('✅ Updated AI chat title:', response.data);
  } catch (error: any) {
    console.error('❌ Error updating AI chat title:', error);
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
    console.log('📞 Deleting AI chat session:', chatAiId);
    const response = await client.delete(`/api/chat-ai/${chatAiId}`);
    console.log('✅ Deleted AI chat session:', response.data);
  } catch (error: any) {
    console.error('❌ Error deleting AI chat session:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể xóa cuộc trò chuyện');
  }
};

