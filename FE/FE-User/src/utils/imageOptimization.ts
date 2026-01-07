import { API_BASE_URL } from '../config/api.config';

/**
 * Image Optimization Utilities with Auto-Proxy Support
 * 
 * Provides helper functions for optimizing image loading:
 * - Add resize parameters to image URLs
 * - Generate thumbnail URLs
 * - Optimize image quality
 * - Auto-proxy for blocked Cloudinary (used by OptimizedImage component)
 */

/**
 * Simple base64 encode for React Native (without external dependencies)
 */
const base64Encode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  
  // Convert string to UTF-8 bytes
  const utf8Bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6));
      utf8Bytes.push(0x80 | (charCode & 0x3f));
    } else {
      utf8Bytes.push(0xe0 | (charCode >> 12));
      utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      utf8Bytes.push(0x80 | (charCode & 0x3f));
    }
  }
  
  // Encode to base64
  for (let i = 0; i < utf8Bytes.length; i += 3) {
    const byte1 = utf8Bytes[i];
    const byte2 = utf8Bytes[i + 1];
    const byte3 = utf8Bytes[i + 2];
    
    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = byte2 !== undefined ? ((byte2 & 15) << 2) | (byte3 >> 6) : 64;
    const enc4 = byte3 !== undefined ? byte3 & 63 : 64;
    
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  
  return output;
};

/**
 * Convert Cloudinary URL to proxy URL through backend
 * Used when direct access to Cloudinary is blocked
 */
export const getProxyImageUrl = (imageUrl: string): string => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // Only proxy Cloudinary URLs
  if (!imageUrl.includes('cloudinary.com') && !imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }

  // Don't proxy local assets
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  try {
    // Encode URL to base64 for safe transmission
    const encodedUrl = base64Encode(imageUrl);
    return `${API_BASE_URL}/api/petphoto/proxy?url=${encodeURIComponent(encodedUrl)}`;
  } catch (error) {
    return imageUrl;
  }
};

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'jpg' | 'png' | 'webp';
}

/**
 * Add resize parameters to image URL
 * Note: This assumes the backend/CDN supports query parameters for image resizing
 * Common formats: ?w=300&h=300&q=80 or ?width=300&height=300&quality=80
 * 
 * If your backend doesn't support this, the parameters will be ignored
 * but won't break the image loading.
 */
export const addImageResizeParams = (
  imageUrl: string,
  options: ImageResizeOptions
): string => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // Don't modify local assets (require() paths)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    
    // Add resize parameters
    if (options.width) {
      url.searchParams.set('w', options.width.toString());
    }
    if (options.height) {
      url.searchParams.set('h', options.height.toString());
    }
    if (options.quality) {
      url.searchParams.set('q', options.quality.toString());
    }
    if (options.format) {
      url.searchParams.set('f', options.format);
    }

    return url.toString();
  } catch (error) {
    return imageUrl;
  }
};

/**
 * Generate thumbnail URL for list views
 * Optimized for small previews (300x300, quality 70)
 */
export const getThumbnailUrl = (imageUrl: string): string => {
  return addImageResizeParams(imageUrl, {
    width: 300,
    height: 300,
    quality: 70,
  });
};

/**
 * Generate medium-sized image URL for cards
 * Optimized for card views (600x600, quality 80)
 */
export const getCardImageUrl = (imageUrl: string): string => {
  return addImageResizeParams(imageUrl, {
    width: 600,
    height: 600,
    quality: 80,
  });
};

/**
 * Generate full-size image URL for detail views
 * Optimized for full screen (1200x1200, quality 85)
 */
export const getFullImageUrl = (imageUrl: string): string => {
  return addImageResizeParams(imageUrl, {
    width: 1200,
    height: 1200,
    quality: 85,
  });
};

/**
 * Optimize image source for FastImage
 * Converts image source to optimized format with resize parameters
 */
export const optimizeImageSource = (
  source: any,
  size: 'thumbnail' | 'card' | 'full' = 'card'
): any => {
  if (!source) {
    return source;
  }

  // If it's a URI object
  if (typeof source === 'object' && source.uri) {
    let optimizedUri = source.uri;
    
    // Apply size-specific optimization
    switch (size) {
      case 'thumbnail':
        optimizedUri = getThumbnailUrl(source.uri);
        break;
      case 'card':
        optimizedUri = getCardImageUrl(source.uri);
        break;
      case 'full':
        optimizedUri = getFullImageUrl(source.uri);
        break;
    }

    return { ...source, uri: optimizedUri };
  }

  // If it's a local asset (require()), return as-is
  return source;
};

/**
 * Preload images for better UX
 * Useful for preloading next images in a carousel
 */
export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  // FastImage handles preloading with its cache
};
