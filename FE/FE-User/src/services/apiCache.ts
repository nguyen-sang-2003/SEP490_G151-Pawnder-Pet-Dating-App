/**
 * API Response Cache Utility
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
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      if (age < cached.expiresIn) {
        this.stats.hits++;
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }

    this.stats.misses++;
    const promise = fetchFn();
    
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresIn,
        tags,
      });
      
      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
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
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
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
