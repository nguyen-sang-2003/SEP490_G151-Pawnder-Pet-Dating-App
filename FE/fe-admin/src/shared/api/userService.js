import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class UserService {
  /**
   * Get users with pagination and filters
   * Backend: GET /user?search=&roleId=&statusId=&page=1&pageSize=20&includeDeleted=false
   * Response: PagedResult<UserResponse> { Items: UserResponse[], Total: number, Page: number, PageSize: number }
   */
  async getUsers(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params });
    return response;
  }

  /**
   * Get user by id
   * Backend: GET /user/{userId}
   * Response: UserResponse (single user object)
   */
  async getUserById(id) {
    if (id === undefined || id === null) {
      console.warn('userService.getUserById called without a valid id');
      return null;
    }
    const response = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
    return response;
  }

  /**
   * Create user
   * Backend: POST /user
   * Body: User data
   * Response: UserResponse (created user object)
   */
  async createUser(userData) {
    const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, userData);
    return response;
  }

  /**
   * Update user
   * Backend: PUT /user/{userId}
   * Body: User data
   * Response: UserResponse (updated user object)
   */
  async updateUser(id, userData) {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData);
    return response;
  }

  /**
   * Delete user (soft delete)
   * Backend: DELETE /user/{userId}
   * Response: Success message
   */
  async deleteUser(id) {
    const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
    return response;
  }

  /**
   * Update user by admin
   * Backend: PUT /admin/users/{id}
   * Body: { isDelete?: boolean, userStatusId?: number }
   * Response: UserResponse (updated user object)
   */
  async updateUserByAdmin(id, userData) {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE_BY_ADMIN(id), userData);
    return response;
  }

  /**
   * Create user by admin
   * Backend: POST /admin/users
   * Body: User data
   * Response: UserResponse (created user object)
   */
  async createUserByAdmin(userData) {
    const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE_BY_ADMIN, userData);
    return response;
  }

  /**
   * Reset user password by email (admin use)
   * Backend: PUT /user/reset-password
   * Body: { email, newPassword }
   */
  async resetPasswordByEmail(email, newPassword) {
    const response = await apiClient.put(API_ENDPOINTS.USERS.RESET_PASSWORD, {
      email,
      newPassword,
    });
    return response;
  }

  /**
   * Ban user (admin use)
   * Backend: POST /admin/users/{id}/ban
   * Body: { DurationDays?: number, IsPermanent?: boolean, Reason: string }
   */
  async banUser(id, banData) {
    const response = await apiClient.post(API_ENDPOINTS.USERS.BAN(id), banData);
    return response;
  }

  /**
   * Unban user (admin use)
   * Backend: POST /admin/users/{id}/unban
   * Body: { Reason?: string } (optional)
   */
  async unbanUser(id, reason = null) {
    const response = await apiClient.post(API_ENDPOINTS.USERS.UNBAN(id), reason ? { Reason: reason } : {});
    return response;
  }
}

export default new UserService();
