import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class AuthService {
  async login(credentials) {
    // Add platform field for role validation
    const loginData = {
      ...credentials,
      Platform: 'admin', // FE Admin is for web (Admin/Expert roles only)
    };
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
    return response;
  }

  async logout() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response;
  }

  async refreshToken() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
    return response;
  }

  async forgotPassword(email) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return response;
  }

  async resetPassword(token, newPassword) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password: newPassword,
    });
    return response;
  }
}

export default new AuthService();
