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
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[JWT] Invalid JWT format - expected 3 parts, got:', parts.length);
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Decode base64
    const jsonPayload = atob(paddedBase64);
    
    // Parse JSON
    const decoded = JSON.parse(jsonPayload);
    console.log('[JWT] Token payload:', decoded);
    return decoded;
  } catch (error) {
    console.error('[JWT] Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract user ID from JWT token
 */
export const getUserIdFromToken = (token: string): number | null => {
  const payload = decodeJWT(token);
  if (!payload) {
    console.log('[JWT] No payload decoded');
    return null;
  }

  // Try different possible claim names (.NET Identity uses different claim types)
  const userIdStr = payload.nameid || // ClaimTypes.NameIdentifier
                    payload.sub ||    // Standard JWT subject
                    payload.userId || 
                    payload.UserId ||
                    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']; // Full .NET claim URI
  
  console.log('[JWT] Searching for userId in claims. Found:', userIdStr);
  console.log('[JWT] Available claims:', Object.keys(payload));
  
  if (userIdStr) {
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      console.error('[JWT] UserId is not a valid number:', userIdStr);
      return null;
    }
    console.log('[JWT] Successfully extracted userId:', userId);
    return userId;
  }

  console.error('[JWT] UserId not found in any expected claim');
  return null;
};

