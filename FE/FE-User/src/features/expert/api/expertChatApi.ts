import { apiClient } from '../../../api/axiosClient';

// Types
export interface Expert {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  specialty?: string;
  isOnline?: boolean;
}

export interface ExpertChatResponse {
  chatExpertId: number;
  expertId: number;
  userId: number;
  createdAt: string;
}

export interface ExpertChatMessage {
  contentId: number;
  chatExpertId: number;
  fromId: number;
  message: string;
  expertId?: number | null;
  userId?: number | null;
  chatAiid?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SendExpertMessageRequest {
  message: string;
  expertId?: number | null;
  userId?: number | null;
  chatAiid?: number | null;
}

/**
 * Create or get existing chat with expert
 * POST /api/ChatExpert/{expertId}/{userId}
 */
export const createOrGetExpertChat = async (
  expertId: number,
  userId: number
): Promise<ExpertChatResponse> => {
  try {
    console.log(`🔄 Creating/getting expert chat: expertId=${expertId}, userId=${userId}`);
    const response = await apiClient.post<ExpertChatResponse>(
      `/api/ChatExpert/${expertId}/${userId}`
    );
    console.log('✅ Expert chat created/retrieved:', response.data);
    return response.data;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tạo chat với chuyên gia.');
  }
};

export interface ExpertChatListItem {
  id: string;
  chatExpertId: number;
  expertId: number;
  expertName: string;
  specialty: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
}

/**
 * Get all chats with experts for a user
 * GET /api/ChatExpert/user/{userId}
 */
export const getUserExpertChats = async (userId: number): Promise<ExpertChatListItem[]> => {
  try {
    console.log(`🔄 Getting expert chats for user: ${userId}`);
    const response = await apiClient.get(`/api/ChatExpert/user/${userId}`);
    console.log('✅ Expert chats retrieved (raw):', response.data);

    // Transform backend response to match interface
    const chats = (response.data || []).map((chat: any) => ({
      id: chat.id || chat.chatExpertId?.toString() || '',
      chatExpertId: chat.chatExpertId,
      expertId: chat.expertId,
      expertName: chat.expertName || 'Chuyên gia',
      specialty: chat.specialty || 'Chuyên gia thú y',
      lastMessage: chat.lastMessage || 'Chưa có tin nhắn',
      time: chat.time || chat.createdAt || new Date().toISOString(),
      unread: chat.unread || 0,
      isOnline: chat.isOnline || false,
    }));

    console.log('✅ Transformed chats:', chats);
    return chats;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chat với chuyên gia.');
  }
};

/**
 * Get messages for an expert chat
 * GET /api/ChatExpertContent/{chatExpertId}
 */
export const getExpertChatMessages = async (chatExpertId: number): Promise<ExpertChatMessage[]> => {
  try {
    console.log(`🔄 Loading messages for expert chat: ${chatExpertId}`);
    const response = await apiClient.get<ExpertChatMessage[]>(`/api/ChatExpertContent/${chatExpertId}`);
    console.log('✅ Expert chat messages loaded:', response.data.length, 'messages');
    return response.data || [];
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải tin nhắn.');
  }
};

/**
 * Send message in expert chat
 * POST /api/ChatExpertContent/{chatExpertId}/{fromId}
 */
export const sendExpertChatMessage = async (
  chatExpertId: number,
  fromId: number,
  request: SendExpertMessageRequest
): Promise<ExpertChatMessage> => {
  try {
    console.log(`🔄 Sending message to expert chat ${chatExpertId} from user ${fromId}:`, request.message);
    const response = await apiClient.post<ExpertChatMessage>(
      `/api/ChatExpertContent/${chatExpertId}/${fromId}`,
      request
    );
    console.log('✅ Message sent successfully:', response.data);
    return response.data;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi tin nhắn.');
  }
};

/**
 * Get all available experts (roleId = 2)
 * GET /user?roleId=2
 */
export const getAvailableExperts = async (): Promise<Expert[]> => {
  try {
    console.log('🔄 Getting available experts...');
    const response = await apiClient.get('/user', {
      params: {
        roleId: 2, // Expert role
        page: 1,
        pageSize: 50,
        includeDeleted: false
      }
    });
    
    console.log('📦 Raw response:', JSON.stringify(response.data));
    
    // Backend returns PagedResult with "items" property (not "data")
    const items = response.data?.items || response.data?.Items || response.data?.data || [];
    
    // Transform backend response to Expert interface
    const experts = items.map((user: any) => ({
      userId: user.userId || user.UserId,
      fullName: user.fullName || user.FullName || 'Chuyên gia',
      email: user.email || user.Email,
      phone: user.phone || user.Phone,
      avatarUrl: user.avatarUrl || user.AvatarUrl,
      address: user.address || user.Address,
      specialty: 'Chuyên gia thú y',
      isOnline: false,
    }));
    
    console.log('✅ Available experts:', experts.length);
    return experts;
  } catch (error: any) {
    console.error('❌ Error getting experts:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chuyên gia.');
  }
};

