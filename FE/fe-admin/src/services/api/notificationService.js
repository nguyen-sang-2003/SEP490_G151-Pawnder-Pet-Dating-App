import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class NotificationService {
  /**
   * Get all notifications (Admin only)
   * Backend: GET /api/notification
   * Response: NotificationDto[] (array of notifications)
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
    return response;
  }

  /**
   * Get notification by id
   * Backend: GET /api/notification/{notificationId}
   * Response: NotificationDto (single notification object)
   */
  async getNotificationById(id) {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.DETAIL(id));
    return response;
  }

  /**
   * Get notifications by user
   * Backend: GET /api/notification/user/{userId}
   * Response: Notification[] (array of notifications)
   */
  async getNotificationsByUser(userId) {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST_BY_USER(userId));
    return response;
  }

  /**
   * Create notification
   * Backend: POST /api/notification
   * Body: { UserId, Title, Message }
   * Response: Notification (created notification object)
   */
  async createNotification(notificationData) {
    const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.CREATE, notificationData);
    return response;
  }

  /**
   * Delete notification
   * Backend: DELETE /api/notification/{notificationId}
   * Response: { Message: string }
   */
  async deleteNotification(id) {
    const response = await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return response;
  }
}

const notificationServiceInstance = new NotificationService();
export default notificationServiceInstance;

