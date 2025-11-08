import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

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

  // Ban/Unban được xử lý qua updateUserByAdmin với userStatusId
  // async banUser(id, reason) {
  //   // Cần xác định userStatusId nào là "banned" từ backend
  //   const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE_BY_ADMIN(id), {
  //     userStatusId: BANNED_STATUS_ID
  //   });
  //   return response;
  // }

  // async unbanUser(id) {
  //   // Cần xác định userStatusId nào là "normal" từ backend
  //   const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE_BY_ADMIN(id), {
  //     userStatusId: NORMAL_STATUS_ID
  //   });
  //   return response;
  // }
}

export default new UserService();
