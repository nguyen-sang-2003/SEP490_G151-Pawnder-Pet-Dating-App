import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, ImageStyle, Image, ImageResizeMode } from 'react-native';
import { colors } from '../theme';

// Try to import FastImage, fallback to regular Image if not available
let FastImage: any;
let FastImageProps: any;
let ResizeMode: any;

try {
  const FastImageModule = require('react-native-fast-image');
  FastImage = FastImageModule.default || FastImageModule;
  ResizeMode = FastImageModule.ResizeMode;
} catch (e) {
  FastImage = null;
}

// Proxy disabled - load directly from Cloudinary
let cloudinaryBlocked = false;

const CLOUDINARY_TIMEOUT = 5000;

// Preload images using FastImage
export const preloadImages = (urls: string[]) => {
  if (!FastImage || !urls || urls.length === 0) return;
  
  try {
    const sources = urls
      .filter(url => url && typeof url === 'string')
      .slice(0, 5)
      .map(url => ({
        uri: url,
        priority: FastImage.priority?.high,
        cache: FastImage.cacheControl?.immutable,
      }));
    
    if (sources.length > 0) {
      FastImage.preload(sources);
    }
  } catch (e) {
    // Silent fail
  }
};

interface OptimizedImageProps {
  source: any; // Can be { uri: string } or require()
  style?: ImageStyle | ViewStyle;
  resizeMode?: ImageResizeMode | any;
  showLoader?: boolean;
  blurRadius?: number;
  imageSize?: 'thumbnail' | 'card' | 'full'; // Size optimization hint
}

/**
 * Optimized Image Component
 * - Better caching (memory + disk)
 * - Loading indicator
 * - Error fallback
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  showLoader = true,
  blurRadius,
  imageSize = 'card',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);
  const maxRetries = 2; // Allow 2 retries before showing error

  // Get the original URI from source
  const getOriginalUri = (): string | null => {
    if (!source) return null;
    if (typeof source === 'object' && source.uri) {
      return source.uri;
    }
    return null;
  };

  const originalUri = getOriginalUri();

  // Handle load failure - show error state (proxy disabled)
  const handleLoadFailure = () => {
    retryCount.current += 1;
    if (retryCount.current >= maxRetries) {
      setLoading(false);
      setError(true);
    }
  };

  // Get the image source (direct loading, no proxy)
  const getImageSource = () => {
    if (!source) {
      return require('../assets/cat_avatar.png');
    }

    // Direct URL - use high priority and aggressive caching
    if (typeof source === 'object' && source.uri) {
      // Check if uri is valid (not null, undefined, or empty string)
      if (!source.uri || source.uri.trim() === '') {
        return require('../assets/cat_avatar.png');
      }
      return {
        uri: source.uri,
        priority: FastImage?.priority?.high,
        cache: FastImage?.cacheControl?.immutable,
      };
    }

    // Local asset (require())
    return source;
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    loadedRef.current = false;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        // Timeout - let it continue loading
      }
    }, CLOUDINARY_TIMEOUT);
  };

  const handleLoadEnd = () => {
    loadedRef.current = true;
    setLoading(false);
    
    // Clear timeout on successful load
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleError = () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    handleLoadFailure();
  };

  // Reset when source changes
  useEffect(() => {
    retryCount.current = 0;
    loadedRef.current = false;
    setError(false);
    setLoading(true);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [source?.uri]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const ImageComponent = FastImage || Image;

  return (
    <View style={[styles.container, style]}>
      <ImageComponent
        source={getImageSource()}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      
      {/* Loading indicator */}
      {loading && showLoader && (
        <View style={styles.loadingOverlay}>
          <View style={styles.blurPlaceholder}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Error fallback */}
      {error && (
        <ImageComponent
          source={require('../assets/cat_avatar.png')}
          style={[StyleSheet.absoluteFill, style]}
          resizeMode={resizeMode}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },
  blurPlaceholder: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default OptimizedImage;
