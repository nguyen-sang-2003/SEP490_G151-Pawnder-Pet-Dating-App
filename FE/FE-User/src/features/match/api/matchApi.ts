import apiClient, { cachedGet } from '../../../api/axiosClient';

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
  fromPetId?: number; // Pet ID of sender
  toPetId?: number;   // Pet ID of receiver (for filtering)
  status: string;
  createdAt: string;
  isMatch: boolean;
  owner: OwnerInfo;
  pet: PetInfo;
  petPhotos: string[];
}

export interface BadgeCounts {
  unreadChats: number[]; // List of matchIds with unread messages
  favoriteBadge: number;
  notificationBadge: number;
}

/**
 * Get badge counts for user (unread messages + pending likes)
 * GET /api/match/badge-counts/{userId}?petId={petId}
 * 
 * Optimized with:
 * - 30s cache for frequent polling
 * - Longer timeout for Azure cold start
 * - Request deduplication
 */
export const getBadgeCounts = async (userId: number, petId?: number): Promise<BadgeCounts> => {
  try {
    const url = petId
      ? `/api/match/badge-counts/${userId}?petId=${petId}`
      : `/api/match/badge-counts/${userId}`;
    
    // Use cachedGet with short cache duration (30s) for badges
    // This prevents multiple simultaneous calls while still keeping data fresh
    const data = await cachedGet<BadgeCounts>(url, {
      cacheDuration: 30 * 1000, // 30 seconds cache
      cacheKey: `badge-counts-${userId}-${petId || 'all'}`,
      timeout: 30000, // 30s timeout for Azure
      retryAttempts: 2, // Reduced retries
    });

    return data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Send a like to another user
 * POST /api/match/like
 */
export const sendLike = async (request: LikeRequest): Promise<LikeResponse> => {
  try {

    const response = await apiClient.post('/api/match/like', request);

    return response.data;
  } catch (error: any) {
    // Don't log 429 limit errors (handled by UI modal)
    if (error.response?.status !== 429) {

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
    const response = await apiClient.get(url);

    return response.data;
  } catch (error: any) {

    throw error;
  }
};

/**
 * Respond to a like (match or pass)
 * PUT /api/match/respond
 */
export const respondToLike = async (request: RespondToLikeRequest): Promise<any> => {
  try {

    const response = await apiClient.put('/api/match/respond', request);

    return response.data;
  } catch (error: any) {

    throw error;
  }
};

