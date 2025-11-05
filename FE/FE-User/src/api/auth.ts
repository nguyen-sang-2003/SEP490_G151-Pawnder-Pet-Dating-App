import { apiClient } from './client';
import * as Keychain from 'react-native-keychain';

// Types based on backend DTOs
export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  Message?: string;
  message?: string;
  Token?: string;
  token?: string;
  UserId?: number;
  userId?: number;
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  IsProfileComplete?: boolean;
  isProfileComplete?: boolean; // Support camelCase from BE
}

export interface RegisterRequest {
  FullName: string;
  Gender?: string;
  Email: string;
  Password: string;
  RoleId?: number;
  UserStatusId?: number;
  ProviderLogin?: string;
}

export interface UserResponse {
  userId?: number;        // Backend trả về lowercase
  UserId?: number;        // Fallback uppercase (for compatibility)
  roleId?: number;
  RoleId?: number;
  userStatusId?: number;
  UserStatusId?: number;
  addressId?: number;
  AddressId?: number;
  fullName?: string;
  FullName?: string;
  gender?: string;
  Gender?: string;
  email?: string;
  Email?: string;
  providerLogin?: string;
  ProviderLogin?: string;
  isProfileComplete?: boolean;
  isDeleted?: boolean;
  IsDeleted?: boolean;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
}

/**
 * Store authentication token securely
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await Keychain.setGenericPassword('authToken', token, {
      service: 'pawnder.auth',
    });
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

/**
 * Retrieve stored authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'pawnder.auth',
    });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Remove stored authentication token
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({
      service: 'pawnder.auth',
    });
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Store user ID securely
 */
export const storeUserId = async (userId: number): Promise<void> => {
  try {
    await Keychain.setGenericPassword('userId', userId.toString(), {
      service: 'pawnder.userId',
    });
  } catch (error) {
    console.error('Error storing user ID:', error);
  }
};

/**
 * Retrieve stored user ID
 */
export const getUserId = async (): Promise<number | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'pawnder.userId',
    });
    if (credentials) {
      return parseInt(credentials.password, 10);
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Remove stored user ID
 */
export const removeUserId = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: 'pawnder.userId' });
  } catch (error) {
    console.error('Error removing user ID:', error);
  }
};

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    console.log('Login request:', { Email: email });
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.post<LoginResponse>('/api/login', {
      Email: email,
      Password: password,
    });
    
    console.log('Login success:', response.data);
    
    // Store token securely (handle both PascalCase and camelCase)
    const token = response.data.Token || (response.data as any).token;
    if (token) {
      console.log('💾 Storing token...');
      await storeAuthToken(token);
      console.log('✅ Token stored successfully');
    } else {
      console.warn('⚠️ No token received from backend');
    }
    
    // Store userId for badge notifications
    const userId = response.data.userId || response.data.UserId;
    if (userId) {
      console.log('💾 Storing userId:', userId);
      await storeUserId(userId);
      console.log('✅ UserId stored successfully');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Full URL:', error.config?.url);
    
    if (error.response?.data) {
      throw new Error(error.response.data);
    }
    throw error;
  }
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<UserResponse> => {
  try {
    console.log('Register request data:', {
      FullName: data.FullName,
      Gender: data.Gender,
      Email: data.Email,
      RoleId: data.RoleId || 3,
      UserStatusId: data.UserStatusId || 2,
      ProviderLogin: data.ProviderLogin || 'local',
    });

    const response = await apiClient.post<UserResponse>('/user', {
      FullName: data.FullName,
      Gender: data.Gender,
      Email: data.Email,
      Password: data.Password,
      RoleId: data.RoleId || 3, // Default role: 3 = User
      UserStatusId: data.UserStatusId || 2, // Default status: 2 = Active (Tài khoản thường)
      ProviderLogin: data.ProviderLogin || 'local',
    });
    
    console.log('Register response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Register error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/logout');
    await removeAuthToken();
    await removeUserId();
  } catch (error) {
    // Even if API call fails, remove local token and userId
    await removeAuthToken();
    await removeUserId();
    throw error;
  }
};

/**
 * Mark user profile as complete
 * PATCH /user/{id}/complete-profile
 */
export const completeUserProfile = async (userId: number): Promise<void> => {
  try {
    console.log(`Calling: PATCH /user/${userId}/complete-profile`);
    const response = await apiClient.patch(`/user/${userId}/complete-profile`);
    console.log('✅ User profile marked as complete:', response.data);
  } catch (error: any) {
    console.error('Error completing profile:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

