import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class UserService {
  async getUsers(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params });
    return response;
  }

  async getUserById(id) {
    const response = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
    return response;
  }

  async createUser(userData) {
    const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, userData);
    return response;
  }

  async updateUser(id, userData) {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData);
    return response;
  }

  async deleteUser(id) {
    const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
    return response;
  }

  async banUser(id, reason) {
    const response = await apiClient.post(`/users/${id}/ban`, { reason });
    return response;
  }

  async unbanUser(id) {
    const response = await apiClient.post(`/users/${id}/unban`);
    return response;
  }
}

export default new UserService();
