// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    DETAIL: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  PETS: {
    LIST: '/pets',
    CREATE: '/pets',
    DETAIL: (id) => `/pets/${id}`,
    UPDATE: (id) => `/pets/${id}`,
    DELETE: (id) => `/pets/${id}`,
  },
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    DETAIL: (id) => `/reports/${id}`,
    UPDATE: (id) => `/reports/${id}`,
    DELETE: (id) => `/reports/${id}`,
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
};

// Pet Status
export const PET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

// Report Status
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Language
export const LANGUAGE = {
  VI: 'vi',
  EN: 'en',
};
