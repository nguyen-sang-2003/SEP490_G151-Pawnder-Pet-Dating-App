/**
 * JWT Helper to decode token and extract user info
 */

interface JWTPayload {
  nameid?: string; // User ID
  unique_name?: string; // Username/Email
  role?: string; // Role
  exp?: number; // Expiration
  [key: string]: any;
}

/**
 * Decode JWT token (Base64)
 * Note: This does NOT validate the token, only decodes the payload
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const jsonPayload = atob(paddedBase64);
    const decoded = JSON.parse(jsonPayload);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  return currentTime >= expirationTime;
};

/**
 * Extract user ID from JWT token
 */
export const getUserIdFromToken = (token: string): number | null => {
  if (isTokenExpired(token)) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  const userIdStr = payload.nameid ||
    payload.sub ||
    payload.userId ||
    payload.UserId ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

  if (userIdStr) {
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      return null;
    }
    return userId;
  }

  return null;
};

