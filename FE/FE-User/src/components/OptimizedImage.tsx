import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, ImageStyle, Image, ImageResizeMode } from 'react-native';
import { colors } from '../theme';
import { getProxyImageUrl } from '../utils/imageOptimization';

// Try to import FastImage, fallback to regular Image if not available
let FastImage: any;
let FastImageProps: any;
let ResizeMode: any;

try {
  const FastImageModule = require('react-native-fast-image');
  FastImage = FastImageModule.default || FastImageModule;
  ResizeMode = FastImageModule.ResizeMode;
} catch (e) {
  console.warn('⚠️ FastImage not available, using regular Image component');
  FastImage = null;
}

// Global flag - once we know Cloudinary is blocked, use proxy for all
let cloudinaryBlocked = false;

// Timeout in milliseconds before switching to proxy (3 seconds)
const CLOUDINARY_TIMEOUT = 1500;

interface OptimizedImageProps {
  source: any; // Can be { uri: string } or require()
  style?: ImageStyle | ViewStyle;
  resizeMode?: ImageResizeMode | any;
  showLoader?: boolean;
  blurRadius?: number;
  imageSize?: 'thumbnail' | 'card' | 'full'; // Size optimization hint
}

/**
 * Optimized Image Component with Auto-Proxy Detection
 * Features:
 * - Auto-detect if Cloudinary is blocked (with 3s timeout)
 * - Automatically fallback to proxy when blocked
 * - Better caching (memory + disk)
 * - Loading indicator
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
  const [useProxy, setUseProxy] = useState(cloudinaryBlocked);
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);
  const maxRetries = 1;

  // Get the original URI from source
  const getOriginalUri = (): string | null => {
    if (!source) return null;
    if (typeof source === 'object' && source.uri) {
      return source.uri;
    }
    return null;
  };

  // Check if URL is from Cloudinary
  const isCloudinaryUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  };

  const originalUri = getOriginalUri();
  const isCloudinary = isCloudinaryUrl(originalUri);

  // Switch to proxy
  const switchToProxy = () => {
    if (!useProxy && retryCount.current < maxRetries && isCloudinary) {
      console.log('🔄 Switching to proxy (timeout/error):', originalUri?.substring(0, 50));
      cloudinaryBlocked = true;
      retryCount.current += 1;
      loadedRef.current = false;
      setUseProxy(true);
    } else if (!loadedRef.current) {
      setLoading(false);
      setError(true);
    }
  };

  // Get the image source (direct or proxied)
  const getImageSource = () => {
    if (!source) {
      return require('../assets/cat_avatar.png');
    }

    // If it's a Cloudinary URL and we need proxy
    if (originalUri && isCloudinary && useProxy) {
      const proxyUri = getProxyImageUrl(originalUri);
      return {
        uri: proxyUri,
        priority: FastImage?.priority?.normal,
        cache: FastImage?.cacheControl?.web,
      };
    }

    // Direct URL
    if (typeof source === 'object' && source.uri) {
      return {
        uri: source.uri,
        priority: FastImage?.priority?.normal,
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

    // Set timeout for Cloudinary URLs (only when not using proxy)
    if (isCloudinary && !useProxy) {
      timeoutRef.current = setTimeout(() => {
        if (!loadedRef.current) {
          console.log('⏱️ Cloudinary timeout, switching to proxy');
          switchToProxy();
        }
      }, CLOUDINARY_TIMEOUT);
    }
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

    switchToProxy();
  };

  // Reset when source changes
  useEffect(() => {
    retryCount.current = 0;
    loadedRef.current = false;
    setUseProxy(cloudinaryBlocked);
    setError(false);

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
