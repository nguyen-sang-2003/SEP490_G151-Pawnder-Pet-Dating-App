import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { AuthContextType, User } from '../types';
import { STORAGE_KEYS } from '../constants';

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
      
      // Fixed admin account for testing
      const adminAccount = {
        email: 'admin@pawnder.com',
        password: 'admin123'
      };
      
      // Check credentials
      if (credentials.email === adminAccount.email && credentials.password === adminAccount.password) {
        // Mock admin user data
        const mockUser = {
          id: 1,
          username: 'admin',
          email: adminAccount.email,
          firstName: 'Admin',
          lastName: 'Pawnder',
          role: 'admin',
          status: 'active',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Mock token
        const mockToken = 'mock-admin-token-' + Date.now();
        
        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, mockToken);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(mockUser));
        
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: mockUser });
      } else {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
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

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    updateUser,
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
