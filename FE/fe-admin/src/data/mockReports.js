// Mock data cho reports - shared data
export const mockReports = [
  {
    id: 1,
    reporter: {
      userId: 1,
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      username: 'john_doe'
    },
    reportedContent: {
      contentId: 101,
      message: 'Nội dung không phù hợp trong tin nhắn',
      type: 'chat'
    },
    reportedUser: {
      userId: 2,
      fullName: 'Alice Wonder',
      email: 'alice.wonder@email.com',
      username: 'alice_wonder'
    },
    reason: 'Inappropriate behavior',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: 2,
    reporter: {
      userId: 3,
      fullName: 'Bob Smith',
      email: 'bob.smith@email.com',
      username: 'bob_smith'
    },
    reportedContent: {
      contentId: 102,
      message: 'Nội dung spam trong chat',
      type: 'chat'
    },
    reportedUser: {
      userId: 4,
      fullName: 'Sarah Jones',
      email: 'sarah.jones@email.com',
      username: 'sarah_jones'
    },
    reason: 'Spam messages',
    status: 'Resolved',
    resolution: 'Đã cảnh báo người dùng và xóa nội dung không phù hợp',
    createdAt: '2024-02-20T10:15:00Z',
    updatedAt: '2024-02-21T14:30:00Z'
  },
  {
    id: 3,
    reporter: {
      userId: 2,
      fullName: 'Alice Wonder',
      email: 'alice.wonder@email.com',
      username: 'alice_wonder'
    },
    reportedContent: {
      contentId: 103,
      message: 'Hình ảnh không phù hợp',
      type: 'photo'
    },
    reportedUser: {
      userId: 5,
      fullName: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      username: 'mike_wilson'
    },
    reason: 'Inappropriate content',
    status: 'Rejected',
    resolution: 'Không có bằng chứng vi phạm',
    createdAt: '2024-03-10T09:20:00Z',
    updatedAt: '2024-03-12T11:45:00Z'
  },
  {
    id: 4,
    reporter: {
      userId: 4,
      fullName: 'Sarah Jones',
      email: 'sarah.jones@email.com',
      username: 'sarah_jones'
    },
    reportedContent: {
      contentId: 104,
      message: 'Quấy rối qua tin nhắn',
      type: 'chat'
    },
    reportedUser: {
      userId: 1,
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      username: 'john_doe'
    },
    reason: 'Harassment',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-25T14:30:00Z',
    updatedAt: '2024-10-25T14:30:00Z'
  },
  {
    id: 5,
    reporter: {
      userId: 5,
      fullName: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      username: 'mike_wilson'
    },
    reportedContent: {
      contentId: 105,
      message: 'Thông tin giả mạo',
      type: 'profile'
    },
    reportedUser: {
      userId: 3,
      fullName: 'Bob Smith',
      email: 'bob.smith@email.com',
      username: 'bob_smith'
    },
    reason: 'Fake information',
    status: 'Resolved',
    resolution: 'Đã xác minh và cập nhật thông tin',
    createdAt: '2024-09-15T16:45:00Z',
    updatedAt: '2024-09-18T10:20:00Z'
  },
  {
    id: 6,
    reporter: {
      userId: 1,
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      username: 'john_doe'
    },
    reportedContent: {
      contentId: 106,
      message: 'Vi phạm quy tắc cộng đồng',
      type: 'chat'
    },
    reportedUser: {
      userId: 6,
      fullName: 'Emma Brown',
      email: 'emma.brown@email.com',
      username: 'emma_brown'
    },
    reason: 'Community guidelines violation',
    status: 'Pending',
    resolution: null,
    createdAt: '2024-10-28T08:15:00Z',
    updatedAt: '2024-10-28T08:15:00Z'
  },
  {
    id: 7,
    reporter: {
      userId: 2,
      fullName: 'Alice Wonder',
      email: 'alice.wonder@email.com',
      username: 'alice_wonder'
    },
    reportedContent: {
      contentId: 107,
      message: 'Nội dung lừa đảo',
      type: 'chat'
    },
    reportedUser: {
      userId: 7,
      fullName: 'David Lee',
      email: 'david.lee@email.com',
      username: 'david_lee'
    },
    reason: 'Scam',
    status: 'Resolved',
    resolution: 'Đã khóa tài khoản và báo cáo cho cơ quan chức năng',
    createdAt: '2024-08-20T12:30:00Z',
    updatedAt: '2024-08-22T15:00:00Z'
  },
  {
    id: 8,
    reporter: {
      userId: 3,
      fullName: 'Bob Smith',
      email: 'bob.smith@email.com',
      username: 'bob_smith'
    },
    reportedContent: {
      contentId: 108,
      message: 'Ngôn từ không phù hợp',
      type: 'chat'
    },
    reportedUser: {
      userId: 8,
      fullName: 'Lisa Chen',
      email: 'lisa.chen@email.com',
      username: 'lisa_chen'
    },
    reason: 'Offensive language',
    status: 'Rejected',
    resolution: 'Không đủ bằng chứng',
    createdAt: '2024-07-10T11:20:00Z',
    updatedAt: '2024-07-12T13:45:00Z'
  }
];

