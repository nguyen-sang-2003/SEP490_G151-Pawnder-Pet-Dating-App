/**
 * useAuthCheck Hook
 * Provides authentication check utilities for protected actions
 * Requirements: 6.3, 6.4
 */

import { useCallback } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { isTokenExpired } from '../utils/jwtHelper';

interface AuthCheckResult {
  isAuthenticated: boolean;
  userId: number | null;
}

/**
 * Check if user is authenticated
 * Returns authentication status and userId if authenticated
 */
export const checkAuthStatus = async (): Promise<AuthCheckResult> => {
  try {
    // Check for valid token
    const credentials = await Keychain.getGenericPassword({
      service: 'pawnder.auth',
    });

    if (!credentials || !credentials.password) {
      return { isAuthenticated: false, userId: null };
    }

    // Check if token is expired
    if (isTokenExpired(credentials.password)) {
      return { isAuthenticated: false, userId: null };
    }

    // Get userId
    const userIdStr = await AsyncStorage.getItem('userId');
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;

    return { isAuthenticated: true, userId };
  } catch (error) {
    return { isAuthenticated: false, userId: null };
  }
};

/**
 * Hook for checking authentication before protected actions
 * Provides requireAuth function that checks auth and redirects to login if needed
 */
export const useAuthCheck = () => {
  const navigation = useNavigation();

  /**
   * Check if user is authenticated
   * If not, redirect to SignIn screen
   * @param returnScreen - Screen name to return to after login (optional)
   * @param returnParams - Params to pass when returning (optional)
   * @returns Promise<boolean> - true if authenticated, false if redirected to login
   */
  const requireAuth = useCallback(
    async (returnScreen?: string, returnParams?: any): Promise<boolean> => {
      const { isAuthenticated } = await checkAuthStatus();

      if (!isAuthenticated) {
        // Navigate to SignIn screen
        // The app will handle returning to the previous screen after login
        // based on the navigation state
        navigation.dispatch(
          CommonActions.navigate({
            name: 'SignIn',
          })
        );
        return false;
      }

      return true;
    },
    [navigation]
  );

  /**
   * Get current user ID if authenticated
   * @returns Promise<number | null>
   */
  const getUserId = useCallback(async (): Promise<number | null> => {
    const { userId } = await checkAuthStatus();
    return userId;
  }, []);

  /**
   * Check authentication status without redirecting
   * @returns Promise<boolean>
   */
  const isAuthenticated = useCallback(async (): Promise<boolean> => {
    const { isAuthenticated: authStatus } = await checkAuthStatus();
    return authStatus;
  }, []);

  return {
    requireAuth,
    getUserId,
    isAuthenticated,
  };
};

export default useAuthCheck;
