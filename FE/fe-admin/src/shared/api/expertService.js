import apiClient from './apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { getUserIdFromToken } from '../utils/jwtUtils';

class ExpertService {
  /**
   * Get all expert confirmations
   * Backend: GET /expert-confirmation
   */
  async getExpertConfirmations(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.EXPERT.LIST, { params });
    return response;
  }

  /**
   * Get expert confirmation by userId and chatId
   * Backend: GET /expert-confirmation/{userId}/{chatId}
   * 
   * LƯU Ý: Backend endpoint có vấn đề - route chỉ có {userId}/{chatId} nhưng method cần expertId.
   * Workaround: Lọc từ list tất cả confirmations thay vì gọi detail endpoint.
   * Hoặc có thể backend sẽ tự động lấy expertId từ JWT token trong tương lai.
   */
  async getExpertConfirmation(userId, chatId) {
    try {
      // Workaround: Lấy tất cả confirmations và filter
      const allConfirmations = await this.getExpertConfirmations();
      if (Array.isArray(allConfirmations)) {
        const confirmation = allConfirmations.find(
          (ec) => ec.UserId === userId && ec.ChatAiId === chatId
        );
        if (confirmation) {
          return confirmation;
        }
      }
      // Fallback: Vẫn thử gọi endpoint (có thể backend sẽ fix)
      const response = await apiClient.get(API_ENDPOINTS.EXPERT.DETAIL(userId, chatId));
      return response;
    } catch (error) {
      console.warn('getExpertConfirmation: Backend endpoint may have issues, using workaround');
      throw error;
    }
  }

  /**
   * Get expert confirmations by user
   * Backend: GET /expert-confirmation/{userId}
   */
  async getExpertConfirmationsByUser(userId) {
    const response = await apiClient.get(API_ENDPOINTS.EXPERT.LIST_BY_USER(userId));
    return response;
  }

  /**
   * Create expert confirmation
   * Backend: POST /expert-confirmation/{userId}/{chatId}
   * Body: { ExpertId, Message }
   */
  async createExpertConfirmation(userId, chatId, confirmationData) {
    const response = await apiClient.post(
      API_ENDPOINTS.EXPERT.CREATE(userId, chatId), 
      confirmationData
    );
    return response;
  }

  /**
   * Update expert confirmation
   * Backend: PUT /expert-confirmation/{expertId}/{userId}/{chatId}
   * 
   * LƯU Ý: Route parameter đầu tiên là ExpertId (không phải confirmationId).
   * Nếu không có expertId, lấy từ JWT token của user đang đăng nhập.
   */
  async updateExpertConfirmation(expertId, userId, chatId, confirmationData) {
    // Nếu không có expertId, lấy từ JWT token
    if (!expertId) {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        expertId = getUserIdFromToken(token);
      }
      if (!expertId) {
        throw new Error('ExpertId is required. Please provide expertId or ensure user is logged in.');
      }
    }
    
    const response = await apiClient.put(
      API_ENDPOINTS.EXPERT.UPDATE(expertId, userId, chatId), 
      confirmationData
    );
    return response;
  }

  /**
   * Get chat history for a ChatAI
   * Backend: GET /api/chat-ai/{chatAiId}/messages
   */
  async getChatHistory(chatAiId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHAT_AI.MESSAGES(chatAiId));
      return response;
    } catch (error) {
      console.warn(`getChatHistory(${chatAiId}) failed:`, error?.response?.status || error?.message);
      return null;
    }
  }
}

export default new ExpertService();

