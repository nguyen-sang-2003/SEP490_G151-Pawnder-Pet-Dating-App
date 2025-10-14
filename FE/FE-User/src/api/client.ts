import axios from 'axios';

// Base API URL - update this with your actual backend URL
const BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    // Add auth token from storage here if needed
    // const token = await getStoredToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      console.log('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  },
);

export default apiClient;

