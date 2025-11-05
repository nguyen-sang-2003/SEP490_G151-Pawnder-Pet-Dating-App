import client from './client';

/**
 * Chat API endpoints
 */

// =============== Types ===============
export interface ChatUser {
  matchId: number;
  fromUserId: number;
  toUserId: number;
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
export const getChats = async (userId: number): Promise<ChatUser[]> => {
  try {
    console.log('📞 Getting chats for user:', userId);
    const response = await client.get<ChatUser[]>(`/api/ChatUser/chat/${userId}`);
    console.log('✅ Got chats:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error getting chats:', error);
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
    console.log('🗑️ Deleting chat:', matchId);
    const response = await client.delete(`/api/ChatUser/chat/${matchId}`);
    console.log('✅ Chat deleted:', response.data);
  } catch (error: any) {
    console.error('❌ Error deleting chat:', error);
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
    console.log('📞 Getting messages for match:', matchId);
    const response = await client.get<ChatMessage[]>(
      `/api/ChatUserContent/chat-user-content/${matchId}`
    );
    console.log('✅ Got messages:', response.data.length);
    return response.data;
  } catch (error: any) {
    // Return empty array if no messages found (404) - this is normal for new matches
    if (error.response?.status === 404) {
      console.log('ℹ️ No messages found yet, returning empty array');
      return [];
    }
    
    // Only log error for non-404 cases
    console.error('❌ Error getting messages:', error);
    
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
    console.log('📤 Sending message:', { matchId, fromUserId, message });
    
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
    
    console.log('✅ Message sent:', response.data);
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi tin nhắn');
  }
};

