import client from './client';

export interface LikeRequest {
  fromUserId: number;
  toUserId: number;
  fromPetId: number; // Pet that is sending the like
  toPetId: number; // Pet that is receiving the like
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
  unreadChats: number[]; // List of matchIds with unread messages
  favoriteBadge: number;
}

/**
 * Get user stats (matches and likes count)
 * GET /api/match/stats/{userId}
 */
export const getMatchStats = async (userId: number): Promise<MatchStats> => {
  try {

    const response = await client.get(`/api/match/stats/${userId}`);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
};

/**
 * Get badge counts for user (unread messages + pending likes)
 * GET /api/match/badge-counts/{userId}?petId={petId}
 */
export const getBadgeCounts = async (userId: number, petId?: number): Promise<BadgeCounts> => {
  try {

    const url = petId 
      ? `/api/match/badge-counts/${userId}?petId=${petId}`
      : `/api/match/badge-counts/${userId}`;
    const response = await client.get(url);

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

    const response = await client.post('/api/match/like', request);

    return response.data;
  } catch (error: any) {
    // Don't log 429 limit errors (handled by UI modal)
    if (error.response?.status !== 429) {
      console.error('❌ Error sending like:', error);
      console.error('Error response:', error.response?.data);
    }
    throw error;
  }
};

/**
 * Get likes received (people who liked you)
 * GET /api/match/likes-received/{userId}
 */
export const getLikesReceived = async (userId: number, petId?: number): Promise<LikeReceivedItem[]> => {
  try {

    const url = petId 
      ? `/api/match/likes-received/${userId}?petId=${petId}`
      : `/api/match/likes-received/${userId}`;
    const response = await client.get(url);

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

    const response = await client.put('/api/match/respond', request);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error responding to like:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

