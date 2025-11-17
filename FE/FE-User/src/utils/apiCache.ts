/**
 * 🚀 API Response Cache Utility
 * Cache API responses to reduce redundant network calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
  tags?: string[]; // For grouped invalidation
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  pending: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get cached data or execute fetch function
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiresIn: number = 5 * 60 * 1000, // Default 5 minutes
    tags?: string[]
  ): Promise<T> {
    // Check if there's a pending request for this key (deduplication)
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      console.log('🔄 [ApiCache] Reusing pending request:', key);
      return pendingRequest;
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      if (age < cached.expiresIn) {
        this.stats.hits++;
        console.log('✅ [ApiCache] Cache hit:', key, `(${Math.round(age / 1000)}s old)`);
        return cached.data;
      } else {
        console.log('⏰ [ApiCache] Cache expired:', key);
        this.cache.delete(key);
      }
    }

    // Fetch new data
    this.stats.misses++;
    console.log('🌐 [ApiCache] Cache miss, fetching:', key);
    const promise = fetchFn();
    
    // Store pending request for deduplication
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresIn,
        tags,
      });
      
      console.log('💾 [ApiCache] Cached:', key);
      return data;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log('🗑️ [ApiCache] Invalidated:', key);
  }

  /**
   * Invalidate all cache keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log('🗑️ [ApiCache] Invalidated pattern:', pattern, `(${keysToDelete.length} keys)`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ [ApiCache] Cleared all cache');
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateTags(tags: string[]): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log('🗑️ [ApiCache] Invalidated tags:', tags, `(${keysToDelete.length} keys)`);
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      pending: this.pendingRequests.size,
    };
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('📊 [ApiCache] Stats reset');
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Helper function to create cache key
export const createCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}?${sortedParams}`;
};

// Cache duration constants
export const CACHE_DURATION = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 10 * 60 * 1000,      // 10 minutes
  VERY_LONG: 30 * 60 * 1000, // 30 minutes
};
