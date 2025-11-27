import client from './client';

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
    const response = await client.get<ChatUser[]>(url);

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

    const response = await client.delete(`/api/ChatUser/chat/${matchId}`);

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
 */
export const getChatMessages = async (matchId: number): Promise<ChatMessage[]> => {
  try {

    const response = await client.get<ChatMessage[]>(
      `/api/ChatUserContent/chat-user-content/${matchId}`
    );

    return response.data;
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

/**
 * Send a message
 * POST /api/ChatUserContent/chat-user-content/{matchId}/{fromUserId}
 * 
 * Note: Backend expects raw string in body, not JSON object
 */
export const sendMessage = async (
  matchId: number,
  fromUserId: number,
  message: string
): Promise<void> => {
  try {


    // Backend expects raw string, not JSON
    const response = await client.post(
      `/api/ChatUserContent/chat-user-content/${matchId}/${fromUserId}`,
      `"${message}"`, // Send as raw string with quotes
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );


  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi tin nhắn');
  }
};

