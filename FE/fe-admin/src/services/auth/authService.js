import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../../constants';

class AuthService {
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
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
