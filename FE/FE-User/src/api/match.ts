import client from './client';

export interface LikeRequest {
  fromUserId: number;
  toUserId: number;
}

export interface LikeResponse {
  matchId: number;
  fromUserId: number;
  toUserId: number;
  status: string;
  isMatch: boolean;
  message: string;
}

export interface RespondToLikeRequest {
  matchId: number;
  action: 'match' | 'pass';
}

export interface PetInfo {
  petId: number;
  name: string;
  breed?: string;
  gender: string;
  age?: number;
  description?: string;
}

export interface OwnerInfo {
  userId: number;
  fullName: string;
  gender?: string;
  address?: {
    city: string;
    district: string;
    ward?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface LikeReceivedItem {
  matchId: number;
  fromUserId: number;
  toUserId?: number;
  status: string;
  createdAt: string;
  isMatch: boolean;
  owner: OwnerInfo;
  pet: PetInfo;
  petPhotos: string[];
}

export interface MatchStats {
  matches: number;
  likes: number;
}

export interface BadgeCounts {
  chatBadge: number;
  favoriteBadge: number;
}

/**
 * Get user stats (matches and likes count)
 * GET /api/match/stats/{userId}
 */
export const getMatchStats = async (userId: number): Promise<MatchStats> => {
  try {
    console.log(`📊 Getting stats for userId: ${userId}`);
    const response = await client.get(`/api/match/stats/${userId}`);
    console.log('✅ Stats received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
};

/**
 * Get badge counts for user (unread messages + pending likes)
 * GET /api/match/badge-counts/{userId}
 */
export const getBadgeCounts = async (userId: number): Promise<BadgeCounts> => {
  try {
    console.log(`🔔 Getting badge counts for userId: ${userId}`);
    const response = await client.get(`/api/match/badge-counts/${userId}`);
    console.log('✅ Badge counts received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching badge counts:', error);
    throw error;
  }
};

/**
 * Send a like to another user
 * POST /api/match/like
 */
export const sendLike = async (request: LikeRequest): Promise<LikeResponse> => {
  try {
    console.log('📤 Sending like:', request);
    const response = await client.post('/api/match/like', request);
    console.log('✅ Like sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending like:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Get likes received (people who liked you)
 * GET /api/match/likes-received/{userId}
 */
export const getLikesReceived = async (userId: number): Promise<LikeReceivedItem[]> => {
  try {
    console.log(`📞 Calling: GET /api/match/likes-received/${userId}`);
    const response = await client.get(`/api/match/likes-received/${userId}`);
    console.log('✅ Likes received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching likes received:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Respond to a like (match or pass)
 * PUT /api/match/respond
 */
export const respondToLike = async (request: RespondToLikeRequest): Promise<any> => {
  try {
    console.log('📤 Responding to like:', request);
    const response = await client.put('/api/match/respond', request);
    console.log('✅ Response sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error responding to like:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

