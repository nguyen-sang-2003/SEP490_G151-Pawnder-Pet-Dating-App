// Mock data cho user notifications - notifications gửi về app của người dùng
// Chỉ lưu userId, notification info sẽ được lấy từ đây
export const mockUserNotifications = [
  // Notifications sẽ được thêm động khi admin xử lý report
];

// Helper function để lấy notifications của một user
export const getUserNotifications = (userId) => {
  return mockUserNotifications.filter(n => n.userId === userId);
};

// Helper function để thêm notification mới
export const addUserNotification = (notification) => {
  const newNotification = {
    id: mockUserNotifications.length + 1,
    ...notification,
    createdAt: new Date().toISOString(),
    isRead: false
  };
  mockUserNotifications.push(newNotification);
  return newNotification;
};

