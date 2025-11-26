/**
 * Image Optimization Utilities
 * 
 * Provides helper functions for optimizing image loading:
 * - Add resize parameters to image URLs
 * - Generate thumbnail URLs
 * - Optimize image quality
 */

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
    // If URL parsing fails, return original
    console.warn('Failed to parse image URL:', imageUrl);
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
  // FastImage will handle preloading automatically with its cache
  // This is a placeholder for future enhancements
  console.log('Preloading images:', imageUrls.length);
};
