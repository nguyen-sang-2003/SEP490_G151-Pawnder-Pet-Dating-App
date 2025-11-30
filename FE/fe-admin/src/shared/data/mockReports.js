// Mock data cho reports - shared data
// Chỉ lưu reporterId và reportedUserId, user info sẽ lấy từ mockUsers để đảm bảo đồng bộ
export const mockReports = [
  {
    id: 1,
    reporterId: 1, // Link với mockUsers - User 1 báo cáo
    reportedUserId: 2, // Link với mockUsers - User 2 bị báo cáo
    reportedContent: {
      contentId: 101,
      message: 'Nội dung không phù hợp trong tin nhắn',
      type: 'chat'
    },
    reason: 'Inappropriate behavior',
    description: 'Người dùng này đã gửi các tin nhắn với nội dung không phù hợp và có hành vi quấy rối qua ứng dụng.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: 2,
    reporterId: 3, // Link với mockUsers
    reportedUserId: 4, // Link với mockUsers
    reportedContent: {
      contentId: 102,
      message: 'Nội dung spam trong chat',
      type: 'chat'
    },
    reason: 'Spam messages',
    description: 'Người dùng này liên tục gửi tin nhắn spam và quảng cáo không mong muốn.',
    status: 'Resolved',
    resolution: 'Đã cảnh báo người dùng và xóa nội dung không phù hợp',
    createdAt: '2024-02-20T10:15:00Z',
    updatedAt: '2024-02-21T14:30:00Z'
  },
  {
    id: 3,
    reporterId: 2, // Link với mockUsers
    reportedUserId: 5, // Link với mockUsers
    reportedContent: {
      contentId: 103,
      message: 'Hình ảnh không phù hợp',
      type: 'photo'
    },
    reason: 'Inappropriate content',
    description: 'Hình ảnh được chia sẻ không phù hợp với quy tắc cộng đồng.',
    status: 'Rejected',
    resolution: 'Không có bằng chứng vi phạm',
    createdAt: '2024-03-10T09:20:00Z',
    updatedAt: '2024-03-12T11:45:00Z'
  },
  {
    id: 4,
    reporterId: 4, // Link với mockUsers
    reportedUserId: 1, // Link với mockUsers
    reportedContent: {
      contentId: 104,
      message: 'Quấy rối qua tin nhắn',
      type: 'chat'
    },
    reason: 'Harassment',
    description: 'Người dùng này có hành vi quấy rối qua tin nhắn.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-25T14:30:00Z',
    updatedAt: '2024-10-25T14:30:00Z'
  },
  {
    id: 5,
    reporterId: 5, // Link với mockUsers
    reportedUserId: 3, // Link với mockUsers
    reportedContent: {
      contentId: 105,
      message: 'Thông tin giả mạo',
      type: 'profile'
    },
    reason: 'Fake information',
    description: 'Thông tin trong profile không trung thực.',
    status: 'Resolved',
    resolution: 'Đã xác minh và cập nhật thông tin',
    createdAt: '2024-09-15T16:45:00Z',
    updatedAt: '2024-09-18T10:20:00Z'
  },
  {
    id: 6,
    reporterId: 1, // Link với mockUsers
    reportedUserId: 6, // Link với mockUsers
    reportedContent: {
      contentId: 106,
      message: 'Vi phạm quy tắc cộng đồng',
      type: 'chat'
    },
    reason: 'Community guidelines violation',
    description: 'Người dùng này vi phạm quy tắc cộng đồng.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-28T08:15:00Z',
    updatedAt: '2024-10-28T08:15:00Z'
  },
  {
    id: 7,
    reporterId: 2, // Link với mockUsers
    reportedUserId: 7, // Link với mockUsers
    reportedContent: {
      contentId: 107,
      message: 'Nội dung lừa đảo',
      type: 'chat'
    },
    reason: 'Scam',
    description: 'Người dùng này có hành vi lừa đảo qua tin nhắn.',
    status: 'Resolved',
    resolution: 'Đã khóa tài khoản và báo cáo cho cơ quan chức năng',
    createdAt: '2024-08-20T12:30:00Z',
    updatedAt: '2024-08-22T15:00:00Z'
  },
  {
    id: 8,
    reporterId: 3, // Link với mockUsers
    reportedUserId: 8, // Link với mockUsers
    reportedContent: {
      contentId: 108,
      message: 'Ngôn từ không phù hợp',
      type: 'chat'
    },
    reason: 'Offensive language',
    description: 'Người dùng này sử dụng ngôn từ không phù hợp.',
    status: 'Rejected',
    resolution: 'Không đủ bằng chứng',
    createdAt: '2024-07-10T11:20:00Z',
    updatedAt: '2024-07-12T13:45:00Z'
  },
  {
    id: 9,
    reporterId: 6, // Link với mockUsers
    reportedUserId: 3, // Link với mockUsers
    reportedContent: {
      contentId: 109,
      message: 'Hành vi không phù hợp trong cuộc trò chuyện',
      type: 'chat'
    },
    reason: 'Inappropriate behavior',
    description: 'Người dùng này đã có hành vi không phù hợp và gửi tin nhắn không mong muốn.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-29T10:20:00Z',
    updatedAt: '2024-10-29T10:20:00Z'
  },
  {
    id: 10,
    reporterId: 7, // Link với mockUsers
    reportedUserId: 2, // Link với mockUsers
    reportedContent: {
      contentId: 110,
      message: 'Quảng cáo và spam liên tục',
      type: 'chat'
    },
    reason: 'Spam messages',
    description: 'Người dùng này liên tục gửi tin nhắn quảng cáo và spam không liên quan đến ứng dụng.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-29T14:45:00Z',
    updatedAt: '2024-10-29T14:45:00Z'
  },
  {
    id: 11,
    reporterId: 8, // Link với mockUsers
    reportedUserId: 4, // Link với mockUsers
    reportedContent: {
      contentId: 111,
      message: 'Hình ảnh không phù hợp trong profile',
      type: 'profile'
    },
    reason: 'Inappropriate content',
    description: 'Người dùng này đã đăng hình ảnh không phù hợp trong profile thú cưng.',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-30T09:15:00Z',
    updatedAt: '2024-10-30T09:15:00Z'
  }
];

