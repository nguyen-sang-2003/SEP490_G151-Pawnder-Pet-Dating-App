/**
 * Simple memory cache utility with TTL (Time To Live)
 * Prevents unnecessary API calls when data is still fresh
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if still valid
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const maxAge = ttl ?? this.defaultTTL;
    const age = Date.now() - entry.timestamp;

    if (age > maxAge) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string, ttl?: number): boolean {
    return this.get(key, ttl) !== null;
  }

  /**
   * Get or fetch pattern - common use case
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key, ttl);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data);
    return data;
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// Cache keys constants
export const CACHE_KEYS = {
  CHATS: (userId: number, petId?: number) => 
    `chats_${userId}${petId ? `_pet_${petId}` : ''}`,
  LIKES: (userId: number, petId?: number) => 
    `likes_${userId}${petId ? `_pet_${petId}` : ''}`,
  PETS_FOR_MATCHING: (userId: number) => `pets_matching_${userId}`,
  USER_PETS: (userId: number) => `user_pets_${userId}`,
  VIP_STATUS: (userId: number) => `vip_${userId}`,
  PET_AVATAR: (petId: number) => `pet_avatar_${petId}`,
  USER_AVATAR: (userId: number) => `user_avatar_${userId}`,
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
  LONG: 15 * 60 * 1000,      // 15 minutes - for stable data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for rarely changing data
};

/**
 * Invalidate related caches when data changes
 */
export const invalidateCache = {
  chats: (userId: number) => {
    cache.clear(CACHE_KEYS.CHATS(userId));
    // Also clear with pet-specific keys if needed
  },
  likes: (userId: number) => {
    cache.clear(CACHE_KEYS.LIKES(userId));
  },
  pets: (userId: number) => {
    cache.clear(CACHE_KEYS.PETS_FOR_MATCHING(userId));
    cache.clear(CACHE_KEYS.USER_PETS(userId));
  },
  all: () => {
    cache.clearAll();
  },
};
