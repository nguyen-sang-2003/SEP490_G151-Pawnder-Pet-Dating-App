/**
 * API Cancellation Utility
 */

import axios, { CancelTokenSource } from 'axios';

class ApiCancellation {
  private tokens: Map<string, CancelTokenSource> = new Map();

  /**
   * Create a new cancel token
   */
  createToken(key?: string): CancelTokenSource {
    const source = axios.CancelToken.source();
    
    if (key) {
      this.cancel(key, 'Superseded by new request');
      this.tokens.set(key, source);
    }
    
    return source;
  }

  /**
   * Cancel a specific request by key
   */
  cancel(key: string, message?: string): void {
    const token = this.tokens.get(key);
    if (token) {
      token.cancel(message || 'Request cancelled');
      this.tokens.delete(key);
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAll(message?: string): void {
    const count = this.tokens.size;
    this.tokens.forEach((token, key) => {
      token.cancel(message || 'All requests cancelled');
    });
    this.tokens.clear();
  }

  /**
   * Clean up a token after request completes
   */
  cleanup(key: string): void {
    this.tokens.delete(key);
  }

  /**
   * Check if an error is a cancellation error
   */
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  /**
   * Get active request count
   */
  getActiveCount(): number {
    return this.tokens.size;
  }

  /**
   * Get all active request keys
   */
  getActiveKeys(): string[] {
    return Array.from(this.tokens.keys());
  }
}

// Export singleton instance
export const apiCancel = new ApiCancellation();

// Export axios.isCancel for convenience
export const isCancel = axios.isCancel;
