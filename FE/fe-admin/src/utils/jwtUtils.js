// Utility functions to decode JWT token (without verification)
// Note: This is for client-side only. In production, verify token on backend.

/**
 * Decode JWT token payload (without verification)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (second part)
    const payload = parts[1];
    
    // Base64 decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user role from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - User role or null
 */
export const getRoleFromToken = (token) => {
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  // Backend might store role in different claims
  // Common: 'role', 'Role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  return payload.role || payload.Role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
};

/**
 * Get user ID from JWT token
 * @param {string} token - JWT token
 * @returns {number|null} - User ID or null
 */
export const getUserIdFromToken = (token) => {
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  // Common: 'sub', 'nameid', 'userId', 'UserId'
  const userId = payload.sub || payload.nameid || payload.userId || payload.UserId;
  return userId ? parseInt(userId) : null;
};

