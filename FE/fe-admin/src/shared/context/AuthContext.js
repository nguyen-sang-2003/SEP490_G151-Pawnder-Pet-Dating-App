import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { STORAGE_KEYS, USER_ROLES } from '../constants';
import { authService, userService } from '../api';
import { getRoleFromToken, getUserIdFromToken } from '../utils/jwtUtils';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const USER_STATUS = {
  BANNED: 1,
  NORMAL: 2,
  VIP: 3,
};

const ROLE_ID_MAP = {
  [USER_ROLES.ADMIN]: 1,
  [USER_ROLES.EXPERT]: 2,
  [USER_ROLES.USER]: 3,
};

const mapUserStatusToLabel = (statusId) => {
  switch (statusId) {
    case USER_STATUS.BANNED:
      return 'banned';
    case USER_STATUS.VIP:
      return 'vip';
    case USER_STATUS.NORMAL:
      return 'active';
    default:
      return 'inactive';
  }
};

// Create context
const AuthContext = createContext(undefined);

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    
    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      
      // Call backend API to login
      const loginResponse = await authService.login(credentials);
      
      console.log('✅ Login response received:', loginResponse);
      
      // Backend returns: { Message: string, AccessToken: string, RefreshToken: string, UserId: int, FullName: string, ... }
      // But JSON serializer may convert to camelCase: { message: string, accessToken: string, refreshToken: string, userId: int, fullName: string, ... }
      // Support both formats
      const token = loginResponse.AccessToken || loginResponse.accessToken || loginResponse.Token || loginResponse.token;
      const refreshToken = loginResponse.RefreshToken || loginResponse.refreshToken;
      const message = loginResponse.Message || loginResponse.message;
      
      if (!loginResponse || !token) {
        console.error('❌ Invalid login response:', loginResponse);
        throw new Error(message || 'Đăng nhập thất bại');
      }
      
      console.log('✅ Token extracted:', token ? 'Token exists' : 'Token missing');
      
      // Save refreshToken if available
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        console.log('✅ RefreshToken saved to localStorage');
      }
      
      // IMPORTANT: Save token to localStorage FIRST so apiClient interceptor can use it
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      console.log('✅ Token saved to localStorage');
      
      // Try to get userId from response first (more reliable), fallback to decoding token
      let userId = loginResponse.UserId || loginResponse.userId;
      let role = null;
      
      if (userId) {
        console.log('✅ UserId from response:', userId);
        // Decode JWT token to get role
        role = getRoleFromToken(token);
        console.log('✅ Role from token:', role);
      } else {
        // Fallback: Decode JWT token to get userId and role
        userId = getUserIdFromToken(token);
        role = getRoleFromToken(token);
        console.log('✅ Decoded JWT:', { userId, role });
      }
      
      if (!userId || !role) {
        // Clean up tokens if we can't get user info
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (refreshToken) {
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        }
        console.error('❌ Failed to get user info:', { userId, role });
        throw new Error('Không thể đọc thông tin từ token');
      }
      
      // Normalize role name (backend returns "Admin", "Expert", "User")
      const normalizedRole = role === 'Admin' ? USER_ROLES.ADMIN
        : role === 'Expert' ? USER_ROLES.EXPERT
        : role === 'User' ? USER_ROLES.USER
        : role;
      
      // Determine if current role is allowed to fetch full user profile from /user/{id}
      const canFetchUserDetails = normalizedRole === USER_ROLES.ADMIN || normalizedRole === USER_ROLES.USER;
      let userResponse = null;
      if (canFetchUserDetails) {
        try {
          console.log('🔍 Fetching user details for userId:', userId);
          userResponse = await userService.getUserById(userId);
          console.log('✅ User response received:', userResponse);
        } catch (fetchError) {
          if (fetchError?.response?.status === 403) {
            console.warn('⚠️ User details endpoint returned 403. Falling back to login response data.');
          } else {
            throw fetchError;
          }
        }
      } else {
        console.log('ℹ️ Current role cannot access /user/{id}. Using login payload instead.');
      }

      if (!userResponse) {
        userResponse = {
          UserId: userId,
          Email: loginResponse.Email || loginResponse.email || credentials.email,
          FullName: loginResponse.FullName || loginResponse.fullName || credentials.email?.split('@')[0],
          RoleId: loginResponse.RoleId || loginResponse.roleId || ROLE_ID_MAP[normalizedRole],
          UserStatusId: loginResponse.UserStatusId || loginResponse.userStatusId || USER_STATUS.NORMAL,
          Gender: loginResponse.Gender || loginResponse.gender,
          CreatedAt: loginResponse.CreatedAt || loginResponse.createdAt,
          UpdatedAt: loginResponse.UpdatedAt || loginResponse.updatedAt,
        };
      }
      
      // Map backend UserResponse to frontend user format
      // Backend UserResponse: { UserId, RoleId, FullName, Email, Gender, ... } or { userId, roleId, fullName, email, ... }
      // Support both PascalCase and camelCase
      const userIdFromResponse = userResponse.UserId || userResponse.userId;
      const email = userResponse.Email || userResponse.email;
      const fullName = userResponse.FullName || userResponse.fullName || email?.split('@')[0] || 'User';
      const roleId = userResponse.RoleId || userResponse.roleId;
      const userStatusId = userResponse.UserStatusId || userResponse.userStatusId;
      const gender = userResponse.Gender || userResponse.gender;
      const createdAt = userResponse.CreatedAt || userResponse.createdAt;
      const updatedAt = userResponse.UpdatedAt || userResponse.updatedAt;
      
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';
      const user = {
        id: userIdFromResponse,
        username: email?.split('@')[0] || 'user',
        email: email,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        role: normalizedRole,
        roleId: roleId || ROLE_ID_MAP[normalizedRole],
        status: mapUserStatusToLabel(userStatusId),
        gender: gender,
        avatar: null,
        createdAt: createdAt,
        updatedAt: updatedAt,
      };
      
      console.log('✅ User object created:', user);
      
      // Store user info in localStorage (token already saved above)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      // Parse error message from backend
      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      
      // Clean up token if login failed
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      // Detailed error logging
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error keys:', Object.keys(error));
      
      if (error.response) {
        // Backend error response (401, 500, etc.)
        const status = error.response.status;
        const errorData = error.response.data;
        
        console.error('❌ Backend error status:', status);
        console.error('❌ Backend error data:', errorData);
        console.error('❌ Backend error data type:', typeof errorData);
        
        // Backend might return string directly or object with message
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object') {
          // Try different possible message fields
          errorMessage = errorData.message 
            || errorData.Message 
            || errorData.error
            || errorData.Error
            || errorData.title // ASP.NET Core default error format
            || JSON.stringify(errorData) // Fallback: show full error object
            || `Lỗi server (${status})`;
        }
        
        // Special handling for 500 errors (usually database/SQL errors)
        if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng liên hệ quản trị viên hoặc thử lại sau.';
          console.error('❌ Server error details:', errorData);
        }
      } else if (error.request) {
        // Network error (no response received)
        errorMessage = 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.';
        console.error('❌ Network error - No response received:', error.request);
        console.error('❌ Request URL:', error.config?.url);
        console.error('❌ Request method:', error.config?.method);
      } else if (error.message) {
        // Other errors (from our code)
        errorMessage = error.message;
        console.error('❌ Application error:', error.message);
      }
      
      console.error('❌ Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Call backend API to logout (clear token on server)
      await authService.logout();
    } catch (error) {
      // Even if logout API fails, clear local storage
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateUser = (user) => {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
  };

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    if (!state.user) return false;
    return state.user.role === role;
  };
  
  // Helper function to check if user is admin
  const isAdmin = () => hasRole(USER_ROLES.ADMIN);
  
  // Helper function to check if user is expert
  const isExpert = () => hasRole(USER_ROLES.EXPERT);
  
  // Helper function to check if user is admin or expert
  const isAdminOrExpert = () => isAdmin() || isExpert();

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isExpert,
    isAdminOrExpert,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
