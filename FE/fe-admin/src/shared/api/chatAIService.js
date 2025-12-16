import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class ChatAIService {
  /**
   * Get token usage
   * Backend: GET /api/chat-ai/token-usage
   */
  async getTokenUsage() {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_AI.TOKEN_USAGE);
    return response;
  }

  /**
   * Get all chats for a user
   * Backend: GET /api/chat-ai/{userId}
   */
  async getAllChats(userId) {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_AI.GET_ALL_CHATS(userId));
    return response;
  }

  /**
   * Create a new chat
   * Backend: POST /api/chat-ai/{userId}
   * Body: { Title?: string }
   */
  async createChat(userId, title = null) {
    const response = await apiClient.post(
      API_ENDPOINTS.CHAT_AI.CREATE_CHAT(userId),
      title ? { Title: title } : {}
    );
    return response;
  }

  /**
   * Update chat title
   * Backend: PUT /api/chat-ai/{chatAiId}
   * Body: { Title: string }
   */
  async updateChatTitle(chatAiId, title) {
    const response = await apiClient.put(
      API_ENDPOINTS.CHAT_AI.UPDATE_CHAT(chatAiId),
      { Title: title }
    );
    return response;
  }

  /**
   * Delete a chat
   * Backend: DELETE /api/chat-ai/{chatAiId}
   */
  async deleteChat(chatAiId) {
    const response = await apiClient.delete(API_ENDPOINTS.CHAT_AI.DELETE_CHAT(chatAiId));
    return response;
  }

  /**
   * Get chat history
   * Backend: GET /api/chat-ai/{chatAiId}/messages
   */
  async getChatHistory(chatAiId) {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_AI.MESSAGES(chatAiId));
    return response;
  }

  /**
   * Send a message to AI
   * Backend: POST /api/chat-ai/{chatAiId}/messages
   * Body: { Question: string }
   */
  async sendMessage(chatAiId, question) {
    const response = await apiClient.post(
      API_ENDPOINTS.CHAT_AI.SEND_MESSAGE(chatAiId),
      { Question: question }
    );
    return response;
  }

  /**
   * Clone an existing AI chat for Expert to continue the conversation
   * Backend: POST /api/chat-ai/clone/{originalChatAiId}
   * Returns: { success: true, data: {...}, message: "..." }
   */
  async cloneChat(originalChatAiId) {
    const response = await apiClient.post(API_ENDPOINTS.CHAT_AI.CLONE(originalChatAiId));
    return response;
  }
}

export default new ChatAIService();

