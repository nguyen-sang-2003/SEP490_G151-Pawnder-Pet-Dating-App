import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { AuthContextType, User } from '../types';
import { STORAGE_KEYS, USER_ROLES } from '../constants';
// import authService from '../services/auth/authService';
// import { getRoleFromToken, getUserIdFromToken } from '../utils/jwtUtils';

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
      // Simulate API call for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock accounts for testing
      const mockAccounts = {
        'admin@pawnder.com': {
          password: 'admin123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@pawnder.com',
            firstName: 'Admin',
            lastName: 'Pawnder',
            role: USER_ROLES.ADMIN,
            status: 'active',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
        'expert@pawnder.com': {
          password: '123456',
          user: {
            id: 2,
            username: 'expert',
            email: 'expert@pawnder.com',
            firstName: 'Expert',
            lastName: 'Pawnder',
            role: USER_ROLES.EXPERT,
            status: 'active',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      };
      
      // Check credentials
      const account = mockAccounts[credentials.email];
      if (!account || account.password !== credentials.password) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      
      // Mock token
      const mockToken = 'mock-token-' + Date.now();
      const user = account.user;
      
      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, mockToken);
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
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
