import apiClient, { cachedGet } from '../../../api/axiosClient';

export interface Notification {
  notificationId: number;
  userId?: number | null;
  title?: string | null;
  message?: string | null;
  type?: string | null; // 'system', 'expert', 'expert_confirmation', etc.
  isRead?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  expertId?: number | null; // For expert confirmations
  chatId?: number | null; // For expert confirmations (chatAiId)
}

/**
 * Get all notifications for current user
 */
export const getNotifications = async (userId: number): Promise<Notification[]> => {
  try {
    const response = await apiClient.get(`/api/notification/user/${userId}`);
    const notifications = response.data as Notification[];

    // Ensure type is set (fallback to auto-detect if not provided by backend)
    return notifications.map(n => ({
      ...n,
      type: n.type || detectNotificationType(n.title, n.message),
    }));
  } catch (error) {

    throw error;
  }
};

/**
 * Detect notification type from title/message
 */
const detectNotificationType = (title?: string | null, message?: string | null): 'match' | 'like' | 'message' | 'system' | 'expert' => {
  const text = `${title} ${message}`.toLowerCase();

  if (text.includes('match') || text.includes('ghép đôi')) return 'match';
  if (text.includes('like') || text.includes('thích')) return 'like';
  if (text.includes('message') || text.includes('tin nhắn')) return 'message';
  if (text.includes('expert') || text.includes('chuyên gia')) return 'expert';

  return 'system';
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.put(`/api/notification/${notificationId}/read`);
  } catch (error) {

    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
  try {
    await apiClient.put(`/api/notification/user/${userId}/read-all`);
  } catch (error) {

    throw error;
  }
};

/**
 * Get unread notification count
 * Optimized with 30s cache and timeout handling
 */
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  try {
    const data = await cachedGet<{ count: number }>(`/api/notification/user/${userId}/unread-count`, {
      cacheDuration: 30 * 1000, // 30 seconds cache
      cacheKey: `notification-count-${userId}`,
      timeout: 30000, // 30s timeout
      retryAttempts: 2,
    });
    return data.count || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/notification/${notificationId}`);
  } catch (error) {
    throw error;
  }
};


