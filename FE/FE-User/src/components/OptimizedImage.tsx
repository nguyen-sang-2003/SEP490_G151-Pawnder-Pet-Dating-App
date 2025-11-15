import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, ImageStyle, Image, ImageResizeMode } from 'react-native';
import { colors } from '../theme';
import { optimizeImageSource } from '../utils/imageOptimization';

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

interface OptimizedImageProps {
  source: any; // Can be { uri: string } or require()
  style?: ImageStyle | ViewStyle;
  resizeMode?: ImageResizeMode | any;
  showLoader?: boolean;
  blurRadius?: number;
  imageSize?: 'thumbnail' | 'card' | 'full'; // Size optimization hint
}

/**
 * Optimized Image Component using react-native-fast-image
 * Features:
 * - Better caching (memory + disk)
 * - Blur placeholder while loading
 * - Loading indicator
 * - Automatic resize optimization
 * - Image URL optimization with resize parameters
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

  // Convert source to FastImage format with optimization
  const getFastImageSource = () => {
    if (!source) {
      return require('../assets/cat_avatar.png');
    }

    // Optimize image source with resize parameters
    const optimizedSource = optimizeImageSource(source, imageSize);

    // If it's a URI object
    if (typeof optimizedSource === 'object' && optimizedSource.uri) {
      return {
        uri: optimizedSource.uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      };
    }

    // If it's a require() (local asset)
    return optimizedSource;
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, style]}>
      <FastImage
        source={getFastImageSource()}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      
      {/* Loading indicator with blur effect */}
      {loading && showLoader && (
        <View style={styles.loadingOverlay}>
          <View style={styles.blurPlaceholder}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Error fallback */}
      {error && (
        <FastImage
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
