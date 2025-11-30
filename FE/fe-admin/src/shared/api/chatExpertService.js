import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class ChatExpertService {
  /**
   * Get all chats for an expert
   * Backend: GET /api/chat-expert/expert/{expertId}
   */
  async getChatsByExpertId(expertId) {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_EXPERT.GET_BY_EXPERT(expertId));
    return response;
  }

  /**
   * Get all chats for a user
   * Backend: GET /api/chat-expert/user/{userId}
   */
  async getChatsByUserId(userId) {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_EXPERT.GET_BY_USER(userId));
    return response;
  }

  /**
   * Create a new chat between expert and user
   * Backend: POST /api/chat-expert/{expertId}/{userId}
   */
  async createChat(expertId, userId) {
    const response = await apiClient.post(API_ENDPOINTS.CHAT_EXPERT.CREATE(expertId, userId));
    return response;
  }

  /**
   * Get messages for a chat
   * Backend: GET /api/chat-expert-content/{chatExpertId}
   */
  async getMessages(chatExpertId) {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_EXPERT_CONTENT.GET_MESSAGES(chatExpertId));
    return response;
  }

  /**
   * Send a message
   * Backend: POST /api/chat-expert-content/{chatExpertId}/{fromId}
   * Body: { Message, ExpertId?, UserId?, ChatAiid? }
   */
  async sendMessage(chatExpertId, fromId, message, expertId = null, userId = null, chatAiId = null) {
    const body = {
      Message: message,
      ExpertId: expertId,
      UserId: userId,
      ChatAiid: chatAiId,
    };
    const response = await apiClient.post(
      API_ENDPOINTS.CHAT_EXPERT_CONTENT.SEND_MESSAGE(chatExpertId, fromId),
      body
    );
    return response;
  }
}

export default new ChatExpertService();

