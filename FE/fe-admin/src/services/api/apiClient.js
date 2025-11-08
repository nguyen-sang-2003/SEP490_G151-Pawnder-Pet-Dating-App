import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../../constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Return response data for successful requests
    return response.data;
  },
  (error) => {
    // Only handle response errors (network errors won't have error.response)
    if (error.response) {
      // Backend returned an error response
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Log error for debugging (only for non-401 errors to avoid spam)
      if (status !== 401) {
        console.error('API Error Response:', {
          status,
          url: error.config?.url,
          method: error.config?.method,
          data: errorData
        });
      }
      
      if (status === 401) {
        // Token expired or invalid
        // Only redirect if not already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_INFO);
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error - No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    } else {
      // Error setting up the request
      console.error('Request Setup Error:', error.message);
    }
    
    // Always reject to allow error handling in components
    return Promise.reject(error);
  }
);

export default apiClient;
