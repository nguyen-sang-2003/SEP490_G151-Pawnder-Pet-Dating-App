import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UsersList.css';

const UsersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dữ liệu người dùng mẫu với đầy đủ trường database
  const users = [
    {
      id: 1,
      username: 'john_doe',
      email: 'john.doe@email.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+84 123 456 789',
      dateOfBirth: '1995-03-15',
      gender: 'Male',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      avatar: null,
      status: 'active',
      role: 'user',
      isVerified: true,
      createdAt: '2024-01-15T08:30:00Z',
      updatedAt: '2024-10-28T14:20:00Z',
      lastLogin: '2024-10-28T10:15:00Z',
      totalPets: 2,
      totalMatches: 5
    },
    {
      id: 2,
      username: 'alice_wonder',
      email: 'alice.wonder@email.com',
      firstName: 'Alice',
      lastName: 'Wonder',
      phone: '+84 987 654 321',
      dateOfBirth: '1992-07-22',
      gender: 'Female',
      address: '456 Lê Lợi, Q3, TP.HCM',
      avatar: 'https://via.placeholder.com/150',
      status: 'active',
      role: 'user',
      isVerified: true,
      createdAt: '2024-02-10T09:15:00Z',
      updatedAt: '2024-10-27T16:45:00Z',
      lastLogin: '2024-10-27T14:30:00Z',
      totalPets: 1,
      totalMatches: 3
    },
    {
      id: 3,
      username: 'bob_smith',
      email: 'bob.smith@email.com',
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '+84 555 123 456',
      dateOfBirth: '1988-11-08',
      gender: 'Male',
      address: '789 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
      avatar: null,
      status: 'inactive',
      role: 'user',
      isVerified: false,
      createdAt: '2024-03-05T11:20:00Z',
      updatedAt: '2024-10-20T09:10:00Z',
      lastLogin: '2024-10-20T08:45:00Z',
      totalPets: 0,
      totalMatches: 0
    },
    {
      id: 4,
      username: 'sarah_jones',
      email: 'sarah.jones@email.com',
      firstName: 'Sarah',
      lastName: 'Jones',
      phone: '+84 777 888 999',
      dateOfBirth: '1990-05-12',
      gender: 'Female',
      address: '321 Cách Mạng Tháng 8, Q10, TP.HCM',
      avatar: 'https://via.placeholder.com/150',
      status: 'active',
      role: 'user',
      isVerified: true,
      createdAt: '2024-04-12T14:30:00Z',
      updatedAt: '2024-10-28T12:15:00Z',
      lastLogin: '2024-10-28T11:20:00Z',
      totalPets: 3,
      totalMatches: 8
    },
    {
      id: 5,
      username: 'mike_wilson',
      email: 'mike.wilson@email.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      phone: '+84 333 444 555',
      dateOfBirth: '1993-09-18',
      gender: 'Male',
      address: '654 Võ Văn Tần, Q3, TP.HCM',
      avatar: null,
      status: 'banned',
      role: 'user',
      isVerified: true,
      createdAt: '2024-05-20T16:45:00Z',
      updatedAt: '2024-10-25T10:30:00Z',
      lastLogin: '2024-10-25T09:15:00Z',
      totalPets: 1,
      totalMatches: 2
    },
    {
      id: 6,
      username: 'emma_brown',
      email: 'emma.brown@email.com',
      firstName: 'Emma',
      lastName: 'Brown',
      phone: '+84 666 777 888',
      dateOfBirth: '1991-12-03',
      gender: 'Female',
      address: '987 Nguyễn Thị Minh Khai, Q1, TP.HCM',
      avatar: 'https://via.placeholder.com/150',
      status: 'active',
      role: 'user',
      isVerified: true,
      createdAt: '2024-06-08T13:20:00Z',
      updatedAt: '2024-10-28T15:45:00Z',
      lastLogin: '2024-10-28T13:30:00Z',
      totalPets: 2,
      totalMatches: 6
    },
    {
      id: 7,
      username: 'david_lee',
      email: 'david.lee@email.com',
      firstName: 'David',
      lastName: 'Lee',
      phone: '+84 111 222 333',
      dateOfBirth: '1989-04-25',
      gender: 'Male',
      address: '147 Pasteur, Q3, TP.HCM',
      avatar: null,
      status: 'active',
      role: 'user',
      isVerified: false,
      createdAt: '2024-07-15T10:10:00Z',
      updatedAt: '2024-10-28T08:20:00Z',
      lastLogin: '2024-10-28T07:45:00Z',
      totalPets: 1,
      totalMatches: 4
    },
    {
      id: 8,
      username: 'lisa_garcia',
      email: 'lisa.garcia@email.com',
      firstName: 'Lisa',
      lastName: 'Garcia',
      phone: '+84 444 555 666',
      dateOfBirth: '1994-08-14',
      gender: 'Female',
      address: '258 Đinh Tiên Hoàng, Q1, TP.HCM',
      avatar: 'https://via.placeholder.com/150',
      status: 'inactive',
      role: 'user',
      isVerified: true,
      createdAt: '2024-08-22T15:30:00Z',
      updatedAt: '2024-10-15T12:40:00Z',
      lastLogin: '2024-10-15T11:20:00Z',
      totalPets: 0,
      totalMatches: 1
    }
  ];

  // Lọc và tìm kiếm
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#27ae60', text: 'Hoạt động' },
      inactive: { color: '#f39c12', text: 'Không hoạt động' },
      banned: { color: '#e74c3c', text: 'Bị cấm' }
    };
    
    const config = statusConfig[status] || { color: '#95a5a6', text: 'Không xác định' };
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  const getVerificationBadge = (isVerified) => {
    return isVerified ? (
      <span className="verified-badge">✓ Đã xác thực</span>
    ) : (
      <span className="unverified-badge">✗ Chưa xác thực</span>
    );
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Danh sách tất cả người dùng trong hệ thống</p>
      </div>

      <div className="users-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Tổng người dùng</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.status === 'active').length}</span>
          <span className="stat-label">Đang hoạt động</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.isVerified).length}</span>
          <span className="stat-label">Đã xác thực</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.status === 'banned').length}</span>
          <span className="stat-label">Bị cấm</span>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Thông tin cá nhân</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th>Xác thực</th>
              <th>Thống kê</th>
              <th>Ngày tạo</th>
              <th>Đăng nhập cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.firstName} {user.lastName}</div>
                    <div className="user-username">@{user.username}</div>
                    <div className="user-details">
                      {user.gender} • {new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()} tuổi
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      {user.email}
                    </div>
                    <div className="contact-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      {user.phone}
                    </div>
                    <div className="contact-item address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {user.address}
                    </div>
                  </div>
                </td>
                <td>
                  {getStatusBadge(user.status)}
                </td>
                <td>
                  {getVerificationBadge(user.isVerified)}
                </td>
                <td>
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="stat-label">Thú cưng:</span>
                      <span className="stat-value">{user.totalPets}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Ghép đôi:</span>
                      <span className="stat-value">{user.totalMatches}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(user.createdAt)}</div>
                    <div className="time-info">{new Date(user.createdAt).toLocaleTimeString('vi-VN')}</div>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(user.lastLogin)}</div>
                    <div className="time-info">{new Date(user.lastLogin).toLocaleTimeString('vi-VN')}</div>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user.id);
                      }}
                      title="Xem chi tiết người dùng"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn prev"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Trước
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn next"
          >
            Sau
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersList;