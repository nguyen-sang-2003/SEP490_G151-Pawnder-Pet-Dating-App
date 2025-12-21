import { apiClient, storeTokens } from '../../../api/axiosClient';
import * as Keychain from 'react-native-keychain';

// Types based on backend DTOs
export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  Message?: string;
  message?: string;
  AccessToken?: string;
  accessToken?: string;
  RefreshToken?: string;
  refreshToken?: string;
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
    if (!token || token.trim() === '') {
      return;
    }
    
    await Keychain.setGenericPassword('authToken', token, {
      service: 'pawnder.auth',
    });
  } catch (error) {
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

  }
};

/**
 * Store user ID securely
 */
export const storeUserId = async (userId: number): Promise<void> => {
  try {
    if (!userId || userId <= 0) {
      return;
    }
    
    await Keychain.setGenericPassword('userId', userId.toString(), {
      service: 'pawnder.userId',
    });
  } catch (error) {
    // Silent fail
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



    const response = await apiClient.post<LoginResponse>('/api/login', {
      Email: email,
      Password: password,
      Platform: 'user', // FE-User is for mobile app (User role only)
    });

    // Store both access token and refresh token (handle both PascalCase and camelCase)
    const accessToken = response.data.AccessToken || response.data.accessToken;
    const refreshToken = response.data.RefreshToken || response.data.refreshToken;

    if (accessToken && refreshToken) {
      await storeTokens(accessToken, refreshToken);
    }

    // Store userId for badge notifications
    const userId = response.data.userId || response.data.UserId;
    if (userId) {
      await storeUserId(userId);
    }

    return response.data;
  } catch (error: any) {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      // Extract error message from response
      let errorMessage = 'Đăng nhập thất bại';

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.Message) {
        errorMessage = data.Message;
      }

      // Specific error messages based on status code
      if (status === 401) {
        // Prioritize backend error message for custom role validation messages
        throw new Error(errorMessage || 'Email hoặc mật khẩu không đúng');
      } else if (status === 404) {
        throw new Error('Tài khoản không tồn tại');
      } else if (status === 400) {
        throw new Error(errorMessage || 'Thông tin đăng nhập không hợp lệ');
      } else {
        throw new Error(errorMessage);
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<UserResponse> => {
  try {
    const response = await apiClient.post<UserResponse>('/user', {
      FullName: data.FullName,
      Gender: data.Gender,
      Email: data.Email,
      Password: data.Password,
      RoleId: data.RoleId || 3, // Default role: 3 = User
      UserStatusId: data.UserStatusId || 2, // Default status: 2 = Active (Tài khoản thường)
      ProviderLogin: data.ProviderLogin || 'local',
    });


    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw new Error('Không thể đăng ký. Vui lòng thử lại.');
  }
};

/**
 * Logout user
 * Calls server logout endpoint to invalidate tokens, then clears local storage
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/logout');
  } catch (error) {
    // Server logout failed, clearing local tokens anyway
  } finally {
    await removeAuthToken();
    await Keychain.resetGenericPassword({ service: 'pawnder.refresh' });
    await removeUserId();
  }
};

/**
 * Mark user profile as complete
 * PATCH /user/{id}/complete-profile
 */
export const completeUserProfile = async (userId: number): Promise<void> => {
  try {
    await apiClient.patch(`/user/${userId}/complete-profile`);
  } catch (error: any) {
    throw new Error('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
  }
};

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
}

export interface ChangePasswordResponse {
  Message?: string;
  message?: string;
}

/**
 * Change user password
 * PUT /api/change-password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> => {
  try {
    const response = await apiClient.put<ChangePasswordResponse>('/api/change-password', {
      CurrentPassword: currentPassword,
      NewPassword: newPassword,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let errorMessage = 'Đổi mật khẩu thất bại';

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.Message) {
        errorMessage = data.Message;
      }

      if (status === 401) {
        throw new Error(errorMessage || 'Mật khẩu hiện tại không đúng');
      } else if (status === 400) {
        throw new Error(errorMessage || 'Thông tin không hợp lệ');
      } else {
        throw new Error(errorMessage);
      }
    } else if (error.request) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }
};

