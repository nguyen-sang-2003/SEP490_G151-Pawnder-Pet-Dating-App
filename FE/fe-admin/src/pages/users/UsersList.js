import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/api/userService';
import petService from '../../services/api/petService';
import { STORAGE_KEYS } from '../../constants';
import './UsersList.css';

const UsersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Users data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  
  // User stats (for summary cards)
  const [userStats, setUserStats] = useState({
    total: 0,
    normal: 0,
    premium: 0,
    verified: 0
  });
  
  // User pets count (cache to avoid multiple API calls)
  const userPetsCountRef = useRef({});
  
  // Ban user states
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState('1'); // 1 day, 3 days, 7 days, 1 month, 3 months, permanent
  const [banReason, setBanReason] = useState('');
  const [userBans, setUserBans] = useState({}); // { userId: { banExpiresAt: timestamp, reason: string } }
  
  // Timer for countdown
  const [timeRemaining, setTimeRemaining] = useState(null);
  const intervalRef = useRef(null);

  // Load ban data from localStorage
  useEffect(() => {
    const savedBans = localStorage.getItem(STORAGE_KEYS.USER_BANS);
    if (savedBans) {
      try {
        const bans = JSON.parse(savedBans);
        setUserBans(bans);
      } catch (error) {
        console.error('Error parsing user bans:', error);
      }
    }
  }, []);

  // Check and auto-unban users when ban expires
  useEffect(() => {
    const checkAndUnban = () => {
      const now = Date.now();
      const updatedBans = { ...userBans };
      let hasChanges = false;

      Object.keys(updatedBans).forEach(userId => {
        const ban = updatedBans[userId];
        // permanent ban has banExpiresAt === null
        if (ban.banExpiresAt && ban.banExpiresAt <= now) {
          delete updatedBans[userId];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setUserBans(updatedBans);
        localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
      }
    };

    // Check immediately
    checkAndUnban();

    // Check every minute
    intervalRef.current = setInterval(checkAndUnban, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userBans]);

  // Update countdown timer when modal is open
  useEffect(() => {
    if (showBanModal && selectedUser && userBans[selectedUser.id]) {
      const ban = userBans[selectedUser.id];
      if (ban.banExpiresAt) {
        const updateCountdown = () => {
          const now = Date.now();
          const remaining = ban.banExpiresAt - now;
          if (remaining > 0) {
            setTimeRemaining(remaining);
          } else {
            setTimeRemaining(0);
          }
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => clearInterval(countdownInterval);
      } else {
        setTimeRemaining(null); // Permanent ban
      }
    } else {
      setTimeRemaining(null);
    }
  }, [showBanModal, selectedUser, userBans]);

  // Helper function to check if user is banned
  const isUserBanned = (userId) => {
    return userBans[userId] !== undefined;
  };

  // Helper function to get ban info
  const getBanInfo = (userId) => {
    return userBans[userId] || null;
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (ms) => {
    if (ms === null) return 'Vĩnh viễn';
    if (ms <= 0) return 'Đã hết hạn';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days} ngày ${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút ${seconds} giây`;
    } else if (minutes > 0) {
      return `${minutes} phút ${seconds} giây`;
    } else {
      return `${seconds} giây`;
    }
  };

  // Handle open ban modal
  const handleOpenBanModal = (user) => {
    setSelectedUser(user);
    setBanDuration('1');
    setBanReason('');
    setShowBanModal(true);
    
    // If user is already banned, show current ban info
    if (userBans[user.id]) {
      const ban = userBans[user.id];
      if (ban.banExpiresAt) {
        const remaining = ban.banExpiresAt - Date.now();
        setTimeRemaining(remaining > 0 ? remaining : 0);
      } else {
        setTimeRemaining(null);
      }
    }
  };

  // Handle close ban modal
  const handleCloseBanModal = () => {
    setShowBanModal(false);
    setSelectedUser(null);
    setBanDuration('1');
    setBanReason('');
    setTimeRemaining(null);
  };

  // Handle ban user
  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      alert('Vui lòng nhập lý do ban!');
      return;
    }

    try {
      // Update user status to BANNED (UserStatusId = 1) in backend
      await userService.updateUserByAdmin(selectedUser.id, {
        userStatusId: USER_STATUS.BANNED
      });
      
      // Also save to localStorage for ban expiration tracking
      const now = Date.now();
      let banExpiresAt = null;

      // Calculate ban expiration time
      switch (banDuration) {
        case '1': // 1 day
          banExpiresAt = now + (1 * 24 * 60 * 60 * 1000);
          break;
        case '3': // 3 days
          banExpiresAt = now + (3 * 24 * 60 * 60 * 1000);
          break;
        case '7': // 7 days
          banExpiresAt = now + (7 * 24 * 60 * 60 * 1000);
          break;
        case '30': // 1 month
          banExpiresAt = now + (30 * 24 * 60 * 60 * 1000);
          break;
        case '90': // 3 months
          banExpiresAt = now + (90 * 24 * 60 * 60 * 1000);
          break;
        case 'permanent': // Permanent
          banExpiresAt = null;
          break;
        default:
          banExpiresAt = now + (1 * 24 * 60 * 60 * 1000);
      }

      const updatedBans = {
        ...userBans,
        [selectedUser.id]: {
          banExpiresAt,
          reason: banReason.trim(),
          bannedAt: now
        }
      };

      setUserBans(updatedBans);
      localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
      
      // Update user status in local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, status: 'BANNED', userStatusId: USER_STATUS.BANNED }
            : user
        )
      );
      
      alert('Đã ban người dùng thành công!');
      handleCloseBanModal();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Không thể ban người dùng. Vui lòng thử lại sau.');
    }
  };

  // Handle unban user
  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    try {
      // Update user status to NORMAL (UserStatusId = 2) in backend
      await userService.updateUserByAdmin(selectedUser.id, {
        userStatusId: USER_STATUS.NORMAL
      });
      
      // Remove from localStorage
      const updatedBans = { ...userBans };
      delete updatedBans[selectedUser.id];

      setUserBans(updatedBans);
      localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
      
      // Update user status in local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, status: 'NORMAL', userStatusId: USER_STATUS.NORMAL }
            : user
        )
      );
      
      alert('Đã gỡ ban người dùng thành công!');
      handleCloseBanModal();
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Không thể gỡ ban người dùng. Vui lòng thử lại sau.');
    }
  };

  // UserStatusId mapping
  // From database: 1 = "Bị khóa" (BANNED), 2 = "Tài khoản thường" (NORMAL), 3 = "Tài khoản VIP" (PREMIUM)
  const USER_STATUS = {
    BANNED: 1,
    NORMAL: 2,
    PREMIUM: 3
  };

  // Fetch pets count for users
  const fetchPetsCount = React.useCallback(async (usersList) => {
    try {
      // Fetch pets for each user (in parallel, but limit to avoid too many requests)
      const petPromises = usersList.slice(0, 20).map(user => {
        const userId = user.id;
        return petService.getPetsByUser(userId)
          .then(response => {
            return { userId, count: Array.isArray(response) ? response.length : 0 };
          })
          .catch(() => ({ userId, count: 0 }));
      });
      
      const petCounts = await Promise.all(petPromises);
      const petsCountMap = {};
      petCounts.forEach(({ userId, count }) => {
        petsCountMap[userId] = count;
      });
      
      // Update cache
      userPetsCountRef.current = { ...userPetsCountRef.current, ...petsCountMap };
      
      // Update users with pets count
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          totalPets: petsCountMap[user.id] || user.totalPets || 0
        }))
      );
    } catch (err) {
      console.error('Error fetching pets count:', err);
    }
  }, []);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare query parameters
        const params = {
          page: currentPage,
          pageSize: itemsPerPage,
          includeDeleted: false
        };
        
        // Add search if provided
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        
        // Add status filter
        // Backend uses statusId: 2 = NORMAL, 3 = PREMIUM
        if (filterStatus === 'NORMAL') {
          params.statusId = USER_STATUS.NORMAL;
        } else if (filterStatus === 'PREMIUM') {
          params.statusId = USER_STATUS.PREMIUM;
        }
        // filterStatus === 'all' means no statusId filter
        
        const response = await userService.getUsers(params);
        
        // Backend returns: { Items: UserResponse[], Total: number, Page: number, PageSize: number }
        const usersData = response.Items || response.items || [];
        const total = response.Total || response.total || 0;
        
        // Map backend UserResponse to frontend user format
        const mappedUsers = usersData.map(user => {
          // Map UserStatusId to status string
          let status = 'NORMAL';
          if (user.UserStatusId === USER_STATUS.PREMIUM) {
            status = 'PREMIUM';
          } else if (user.UserStatusId === USER_STATUS.BANNED) {
            status = 'BANNED';
          }
          
          // Split FullName into firstName and lastName
          const fullName = user.FullName || user.fullName || user.Email?.split('@')[0] || 'User';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return {
            id: user.UserId || user.userId,
            username: user.Email?.split('@')[0] || 'user',
            email: user.Email || user.email,
            firstName,
            lastName,
            fullName,
            status,
            roleId: user.RoleId || user.roleId,
            userStatusId: user.UserStatusId || user.userStatusId,
            gender: user.Gender || user.gender,
            isVerified: user.isProfileComplete || user.IsProfileComplete || false,
            avatar: null, // Backend doesn't have avatar
            phone: null, // Backend doesn't have phone
            address: null, // Backend doesn't have address (only AddressId)
            dateOfBirth: null, // Backend doesn't have dateOfBirth
            createdAt: user.CreatedAt || user.createdAt,
            updatedAt: user.UpdatedAt || user.updatedAt,
            lastLogin: null, // Backend doesn't have lastLogin
            totalPets: 0, // Will be updated after fetching pets count
            totalMatches: 0 // Backend doesn't have matches data
          };
        });
        
        setUsers(mappedUsers);
        setTotalPages(Math.ceil(total / itemsPerPage));
        
        // Fetch pets count for each user (in parallel, but limit concurrency)
        fetchPetsCount(mappedUsers);
        
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentPage, searchTerm, filterStatus, itemsPerPage, USER_STATUS.BANNED, USER_STATUS.NORMAL, USER_STATUS.PREMIUM, fetchPetsCount]);

  // Fetch user stats (total, normal, premium, verified)
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch all users without pagination to get stats
        const response = await userService.getUsers({
          page: 1,
          pageSize: 1000, // Get all users for stats
          includeDeleted: false
        });
        
        const allUsers = response.Items || response.items || [];
        
        const stats = {
          total: response.Total || response.total || 0,
          normal: allUsers.filter(u => (u.UserStatusId || u.userStatusId) === USER_STATUS.NORMAL).length,
          premium: allUsers.filter(u => (u.UserStatusId || u.userStatusId) === USER_STATUS.PREMIUM).length,
          verified: allUsers.filter(u => u.isProfileComplete || u.IsProfileComplete).length
        };
        
        setUserStats(stats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };
    
    fetchUserStats();
  }, [USER_STATUS.NORMAL, USER_STATUS.PREMIUM]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to page 1 when search or filter changes
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, currentPage]);

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (user) => {
    // Check if user is banned (from localStorage or userStatusId)
    const isBanned = isUserBanned(user.id) || user.userStatusId === USER_STATUS.BANNED;
    
    if (isBanned) {
      return (
        <span 
          className="status-badge banned" 
          style={{ backgroundColor: '#e74c3c' }}
        >
          BANNED
        </span>
      );
    }

    const statusConfig = {
      NORMAL: { color: '#3498db', text: 'NORMAL' },
      PREMIUM: { color: '#f39c12', text: 'PREMIUM' }
    };
    
    const config = statusConfig[user.status] || { color: '#95a5a6', text: 'NORMAL' };
    
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

  if (loading && users.length === 0) {
    return (
      <div className="users-page">
        <div className="page-header">
          <h1>Quản lý người dùng</h1>
          <p>Đang tải dữ liệu...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="page-header">
          <h1>Quản lý người dùng</h1>
          <p style={{ color: '#e74c3c' }}>{error}</p>
        </div>
      </div>
    );
  }

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
            <option value="NORMAL">NORMAL</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-number">{userStats.total}</span>
          <span className="stat-label">Tổng người dùng</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.normal}</span>
          <span className="stat-label">NORMAL</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.premium}</span>
          <span className="stat-label">PREMIUM</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.verified}</span>
          <span className="stat-label">Đã xác thực</span>
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
            {users.length > 0 ? (
              users.map((user) => (
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
                    {user.gender && (
                      <div className="user-details">
                        {user.gender}
                      </div>
                    )}
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
                    {user.phone && (
                      <div className="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {user.phone}
                      </div>
                    )}
                    {user.address && (
                      <div className="contact-item address">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {user.address}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {getStatusBadge(user)}
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
                  {user.createdAt ? (
                    <div className="date-info">
                      <div>{formatDate(user.createdAt)}</div>
                      <div className="time-info">{new Date(user.createdAt).toLocaleTimeString('vi-VN')}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>N/A</span>
                  )}
                </td>
                <td>
                  {user.lastLogin ? (
                    <div className="date-info">
                      <div>{formatDate(user.lastLogin)}</div>
                      <div className="time-info">{new Date(user.lastLogin).toLocaleTimeString('vi-VN')}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>Chưa đăng nhập</span>
                  )}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBanModal(user);
                      }}
                      title="Xử lý sai phạm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            )}
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

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseBanModal}>
          <div className="modal-content ban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xử lý sai phạm - {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button className="modal-close" onClick={handleCloseBanModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Current ban status */}
              {isUserBanned(selectedUser.id) && (
                <div className="ban-status-info">
                  <h3>Trạng thái ban hiện tại:</h3>
                  <div className="ban-info-item">
                    <span className="ban-label">Lý do ban:</span>
                    <span className="ban-value">{getBanInfo(selectedUser.id).reason}</span>
                  </div>
                  <div className="ban-info-item">
                    <span className="ban-label">Thời gian còn lại:</span>
                    <span className="ban-value time-remaining">
                      {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Vĩnh viễn'}
                    </span>
                  </div>
                  {getBanInfo(selectedUser.id).banExpiresAt && (
                    <div className="ban-info-item">
                      <span className="ban-label">Hết hạn vào:</span>
                      <span className="ban-value">
                        {new Date(getBanInfo(selectedUser.id).banExpiresAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Ban form */}
              <div className="ban-form">
                <h3>{isUserBanned(selectedUser.id) ? 'Cập nhật ban' : 'Ban người dùng'}</h3>
                
                <div className="form-group">
                  <label htmlFor="banDuration">Thời gian ban:</label>
                  <select
                    id="banDuration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="form-select"
                  >
                    <option value="1">1 ngày</option>
                    <option value="3">3 ngày</option>
                    <option value="7">7 ngày</option>
                    <option value="30">1 tháng</option>
                    <option value="90">3 tháng</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="banReason">Lý do ban: <span className="required">*</span></label>
                  <textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Nhập lý do ban người dùng..."
                    rows="4"
                    className="form-textarea"
                    required
                  />
                </div>

                {/* Preview ban expiration */}
                {banDuration !== 'permanent' && (
                  <div className="ban-preview">
                    <span className="ban-preview-label">Thời gian ban sẽ hết hạn vào:</span>
                    <span className="ban-preview-value">
                      {(() => {
                        const now = Date.now();
                        const days = parseInt(banDuration);
                        const expiresAt = now + (days * 24 * 60 * 60 * 1000);
                        return new Date(expiresAt).toLocaleString('vi-VN');
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseBanModal}>
                Hủy
              </button>
              {isUserBanned(selectedUser.id) && (
                <button className="btn btn-warning" onClick={handleUnbanUser}>
                  Gỡ ban
                </button>
              )}
              <button className="btn btn-primary" onClick={handleBanUser}>
                {isUserBanned(selectedUser.id) ? 'Cập nhật ban' : 'Xác nhận ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;