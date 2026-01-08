import apiClient, { cachedGet } from '../../../api/axiosClient';

/**
 * Chat API endpoints
 */

// =============== Types ===============
export interface ChatUser {
  matchId: number;
  fromUserId: number;
  toUserId: number;
  fromPetId?: number; // Pet that sent the match request
  toPetId?: number; // Pet that received the match request
  status: string;
  createdAt: string;
}

export interface ChatMessage {
  contentId: number;
  matchId: number;
  fromUserId: number;
  fromUserName: string | null;
  message: string;
  createdAt: string;
}

export interface SendMessageRequest {
  message: string;
}

// =============== Chat User APIs ===============

/**
 * Get all accepted matches (chats) for a user
 * GET /api/ChatUser/chat/{userId}
 */
export const getChats = async (userId: number, petId?: number): Promise<ChatUser[]> => {
  try {

    const url = petId
      ? `/api/ChatUser/chat/${userId}?petId=${petId}`
      : `/api/ChatUser/chat/${userId}`;
    const response = await apiClient.get<ChatUser[]>(url);

    return response.data;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chat');
  }
};

/**
 * Delete a chat (unmatch)
 * DELETE /api/ChatUser/chat/{matchId}
 */
export const deleteChat = async (matchId: number): Promise<void> => {
  try {

    const response = await apiClient.delete(`/api/ChatUser/chat/${matchId}`);

  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể xóa đoạn chat');
  }
};

// =============== Chat Content APIs ===============

/**
 * Get all messages in a chat
 * GET /api/ChatUserContent/chat-user-content/{matchId}
 * Optimized with 10s cache to reduce rapid re-fetches
 */
export const getChatMessages = async (matchId: number): Promise<ChatMessage[]> => {
  try {
    // Short cache (10s) to reduce rapid calls when switching screens
    const messages = await cachedGet<ChatMessage[]>(
      `/api/ChatUserContent/chat-user-content/${matchId}`,
      {
        cacheDuration: 10 * 1000, // 10 seconds
        cacheKey: `chat-messages-${matchId}`,
        timeout: 30000,
        retryAttempts: 2,
      }
    );

    return messages;
  } catch (error: any) {
    // Return empty array if no messages found (404) - this is normal for new matches
    if (error.response?.status === 404) {
      return [];
    }

    // Only log error for non-404 cases



    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải tin nhắn');
  }
};

export interface SendMessageResponse {
  message: string;
  contentId: number;
  createdAt: string;
  filteredMessage?: string; // Message after bad word filter (if different from original)
}

/**
 * Send a message
 * POST /api/ChatUserContent/chat-user-content/{matchId}/{fromUserId}
 * 
 * Note: Backend expects raw string in body, not JSON object
 * Returns the saved message (may be filtered if contains bad words level 1)
 */
export const sendMessage = async (
  matchId: number,
  fromUserId: number,
  message: string
): Promise<SendMessageResponse> => {
  try {

    // Backend expects raw string, not JSON
    const response = await apiClient.post<SendMessageResponse>(
      `/api/ChatUserContent/chat-user-content/${matchId}/${fromUserId}`,
      `"${message}"`, // Send as raw string with quotes
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;

  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi tin nhắn');
  }
};

