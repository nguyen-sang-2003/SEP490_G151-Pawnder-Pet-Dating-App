import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

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
      // Suppress 404 errors for /api/pet/user/ endpoints (user has no pets is normal)
      const url = error.config?.url || '';
      const isPetUserEndpoint = url.includes('/api/pet/user/') || url.includes('/api/Pet/user/');
      const shouldSuppress404 = status === 404 && isPetUserEndpoint;
      
      if (status !== 401 && !shouldSuppress404) {
        console.error('API Error Response:', {
          status,
          url: error.config?.url,
          method: error.config?.method,
          data: errorData
        });
      }
      
      if (status === 401) {
        // Token expired or invalid
        const currentPath = window.location.pathname;
        
        // If on login page, extract error message from backend for better UX
        if (currentPath.includes('/login')) {
          const message = errorData?.message || errorData?.Message || errorData || 'Đăng nhập thất bại';
          const customError = new Error(typeof message === 'string' ? message : 'Đăng nhập thất bại');
          customError.response = error.response;
          return Promise.reject(customError);
        }
        
        // Otherwise, redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        window.location.href = '/login';
      }
      // For other status codes, extract error message from backend
      const message = errorData?.message || errorData?.Message || errorData || 'Có lỗi xảy ra';
      const customError = new Error(typeof message === 'string' ? message : 'Có lỗi xảy ra');
      customError.response = error.response;
      customError.status = status;
      return Promise.reject(customError);
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error - No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      return Promise.reject(new Error('Không thể kết nối đến máy chủ'));
    } else {
      // Error setting up the request
      console.error('Request Setup Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default apiClient;
