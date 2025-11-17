/**
 * Navigation Configuration
 * 
 * Centralized configuration for navigation optimizations including:
 * - Native animations with useNativeDriver
 * - Gesture handling settings
 * - Screen transition animations
 */

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Default screen options with performance optimizations
 */
export const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  // Enable native animations with useNativeDriver for better performance
  animation: 'default',
  animationTypeForReplace: 'push',
  // Optimize gesture handling
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  // Use native stack for better performance
  animationDuration: 300,
};

/**
 * Modal screen options with slide from bottom animation
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  presentation: 'modal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
  fullScreenGestureEnabled: false, // Disable full screen gesture for modals
};

/**
 * Detail screen options with slide from right animation
 */
export const detailScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

/**
 * Fade animation options for subtle transitions
 */
export const fadeScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'fade',
  gestureEnabled: false,
};

/**
 * Navigation container theme with optimized settings
 */
export const navigationTheme = {
  dark: false,
  colors: {
    primary: '#FF6EA7',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
    notification: '#FF6EA7',
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as const,
    },
  },
};
