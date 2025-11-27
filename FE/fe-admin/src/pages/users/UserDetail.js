import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userService from '../../services/api/userService';
import petService from '../../services/api/petService';
import { STORAGE_KEYS } from '../../constants';
import './UserDetail.css';

// UserStatusId mapping (from database: 1 = "Bị khóa", 2 = "Tài khoản thường", 3 = "Tài khoản VIP")
const USER_STATUS = {
  BANNED: 1,
  NORMAL: 2,
  PREMIUM: 3
};

const ROLE_ID = {
  ADMIN: 1,
  EXPERT: 2,
  USER: 3
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // User data state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userId = parseInt(id);
        if (isNaN(userId)) {
          setError('ID người dùng không hợp lệ');
          setLoading(false);
          return;
        }
        
        // Fetch user and pets in parallel
        const [userResponse, petsResponse] = await Promise.all([
          userService.getUserById(userId).catch(err => {
            console.error('Error fetching user:', err);
            return null;
          }),
          petService.getPetsByUser(userId).catch(err => {
            console.warn('Error fetching pets:', err);
            return [];
          })
        ]);
        
        if (!userResponse) {
          setError('Không tìm thấy người dùng');
          setLoading(false);
          return;
        }
        
        // Map UserResponse to frontend format
        const fullName = userResponse.FullName || userResponse.fullName || userResponse.Email?.split('@')[0] || 'User';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || fullName;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Map UserStatusId to status string
        let status = 'NORMAL';
        const userStatusId = userResponse.UserStatusId || userResponse.userStatusId;
        if (userStatusId === USER_STATUS.PREMIUM) {
          status = 'PREMIUM';
        } else if (userStatusId === USER_STATUS.BANNED) {
          status = 'BANNED';
        }
        
        // Check if user is banned (from localStorage)
        const savedBans = localStorage.getItem(STORAGE_KEYS.USER_BANS);
        let isBannedFromStorage = false;
        if (savedBans) {
          try {
            const bans = JSON.parse(savedBans);
            isBannedFromStorage = bans[userId] !== undefined;
            if (isBannedFromStorage) {
              status = 'BANNED';
            }
          } catch (err) {
            console.error('Error parsing user bans:', err);
          }
        }
        
        // Map pets
        const pets = Array.isArray(petsResponse) ? petsResponse.map(pet => ({
          id: pet.PetId || pet.petId,
          name: pet.Name || pet.name || 'Unknown',
          breed: pet.Breed || pet.breed || 'Unknown',
          species: 'Cat', // App chỉ có mèo
          gender: pet.Gender || pet.gender,
          age: pet.Age || pet.age,
          description: pet.Description || pet.description,
          isActive: pet.IsActive || pet.isActive,
          photo: pet.UrlImageAvatar || pet.urlImageAvatar
        })) : [];
        
        // Map user data
        const mappedUser = {
          id: userResponse.UserId || userResponse.userId,
          username: userResponse.Email?.split('@')[0] || 'user',
          email: userResponse.Email || userResponse.email,
          firstName,
          lastName,
          fullName,
          status,
          roleId: userResponse.RoleId || userResponse.roleId,
          userStatusId: userStatusId,
          gender: userResponse.Gender || userResponse.gender || 'Unknown',
          isVerified: userResponse.isProfileComplete || userResponse.IsProfileComplete || false,
          avatar: null, // Backend doesn't have avatar
          phone: null, // Backend doesn't have phone
          address: null, // Backend doesn't have address (only AddressId)
          dateOfBirth: null, // Backend doesn't have dateOfBirth
          createdAt: userResponse.CreatedAt || userResponse.createdAt,
          updatedAt: userResponse.UpdatedAt || userResponse.updatedAt,
          lastLogin: null, // Backend doesn't have lastLogin
          totalPets: pets.length,
          totalMatches: 0, // Backend doesn't have matches data
          // Additional data not in backend
          bio: 'Chưa có thông tin giới thiệu.',
          preferences: {
            petSpecies: ['Cat'],
            petAge: 'Any',
            location: 'TP.HCM',
            activityLevel: 'Moderate'
          },
          pets: pets,
          matches: [] // Backend doesn't have matches data
        };
        
        // Get role name (need to map from roleId)
        // RoleId 1 = Admin, 2 = Expert, 3 = User (from database)
        const roleId = userResponse.RoleId || userResponse.roleId;
        if (roleId === 1) {
          mappedUser.role = 'Admin';
        } else if (roleId === 2) {
          mappedUser.role = 'Expert';
        } else {
          mappedUser.role = 'User';
        }
        
        setUser(mappedUser);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [id]);

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'pets', label: 'Thú cưng', icon: '🐕' },
    { id: 'matches', label: 'Ghép đôi', icon: '💕' },
    { id: 'activity', label: 'Hoạt động', icon: '📊' }
  ];

  const isExpert = user?.roleId === ROLE_ID.EXPERT;

  useEffect(() => {
    if (isExpert && activeTab !== 'profile' && activeTab !== 'activity') {
      setActiveTab('profile');
    }
  }, [isExpert, activeTab]);

  const filteredTabs = isExpert
    ? tabs.filter(tab => tab.id === 'profile' || tab.id === 'activity')
    : tabs;

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/users')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại danh sách
          </button>
          <h1>Chi tiết người dùng</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/users')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại danh sách
          </button>
          <h1>Chi tiết người dùng</h1>
        </div>
        <div className="error-message">
          <h2>{error || 'Không tìm thấy người dùng'}</h2>
          <p>Người dùng với ID {id} không tồn tại.</p>
          <button onClick={() => navigate('/users')} className="back-btn">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    // Xử lý cả status từ mockUsers (NORMAL/PREMIUM) và status cũ (active/inactive)
    const statusConfig = {
      NORMAL: { color: '#3498db', text: 'NORMAL' },
      PREMIUM: { color: '#f39c12', text: 'PREMIUM' },
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

  const getGenderIcon = (gender) => {
    return gender === 'Male' ? '👨' : '👩';
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <div className="user-detail-page">
      <div className="page-header">
        <button onClick={() => navigate('/users')} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại danh sách
        </button>
        <h1>Chi tiết người dùng</h1>
      </div>

      <div className="user-detail-content">
        {/* User Profile Header */}
        <div className="user-profile-header">
          <div className="user-avatar-section">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              ) : (
                <div className="avatar-placeholder">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              )}
            </div>
            <div className="user-status">
              {getStatusBadge(user.status)}
              {getVerificationBadge(user.isVerified)}
            </div>
          </div>
          
          <div className="user-basic-info">
            <h2>
              {getGenderIcon(user.gender)} {user.firstName} {user.lastName}
            </h2>
            <p className="user-username">@{user.username}</p>
            <p className="user-age">
              {user.dateOfBirth ? `${getAge(user.dateOfBirth)} tuổi` : 'N/A'} • {user.gender || 'N/A'}
            </p>
            {user.address && (
              <p className="user-location">📍 {user.address}</p>
            )}
          </div>

          <div className="user-stats">
            {!isExpert && (
              <>
                <div className="stat-item">
                  <span className="stat-number">{user.totalPets}</span>
                  <span className="stat-label">Thú cưng</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{user.totalMatches}</span>
                  <span className="stat-label">Ghép đôi</span>
                </div>
              </>
            )}
            <div className="stat-item">
              <span className="stat-number">{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
              <span className="stat-label">Tham gia</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="info-grid">
                <div className="info-card">
                  <h3>Thông tin liên hệ</h3>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{user.phone || 'N/A'}</span>
                  </div>
                  {user.address && (
                    <div className="info-item">
                      <span className="label">Địa chỉ:</span>
                      <span className="value">{user.address}</span>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h3>Thông tin cá nhân</h3>
                  {user.dateOfBirth && (
                    <div className="info-item">
                      <span className="label">Ngày sinh:</span>
                      <span className="value">{formatDate(user.dateOfBirth)}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Giới tính:</span>
                    <span className="value">{user.gender || 'N/A'}</span>
                  </div>
                  {user.dateOfBirth && (
                    <div className="info-item">
                      <span className="label">Tuổi:</span>
                      <span className="value">{getAge(user.dateOfBirth)} tuổi</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Vai trò:</span>
                    <span className="value">{user.role || 'User'}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Trạng thái tài khoản</h3>
                  <div className="info-item">
                    <span className="label">Trạng thái:</span>
                    <span className="value">{getStatusBadge(user.status)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Xác thực:</span>
                    <span className="value">{getVerificationBadge(user.isVerified)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Đăng nhập cuối:</span>
                    <span className="value">{user.lastLogin ? formatDateTime(user.lastLogin) : 'Chưa đăng nhập'}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Thời gian</h3>
                  {user.createdAt && (
                    <div className="info-item">
                      <span className="label">Ngày tạo:</span>
                      <span className="value">{formatDateTime(user.createdAt)}</span>
                    </div>
                  )}
                  {user.updatedAt && (
                    <div className="info-item">
                      <span className="label">Cập nhật cuối:</span>
                      <span className="value">{formatDateTime(user.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bio-card">
                <h3>Giới thiệu</h3>
                <p>{user.bio}</p>
              </div>

              <div className="preferences-card">
                <h3>Sở thích</h3>
                <div className="preferences-grid">
                  <div className="preference-item">
                    <span className="label">Loài thú cưng:</span>
                    <span className="value">{user.preferences.petSpecies.join(', ')}</span>
                  </div>
                  <div className="preference-item">
                    <span className="label">Độ tuổi:</span>
                    <span className="value">{user.preferences.petAge}</span>
                  </div>
                  <div className="preference-item">
                    <span className="label">Khu vực:</span>
                    <span className="value">{user.preferences.location}</span>
                  </div>
                  <div className="preference-item">
                    <span className="label">Mức độ hoạt động:</span>
                    <span className="value">{user.preferences.activityLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isExpert && activeTab === 'pets' && (
            <div className="pets-tab">
              <div className="pets-header">
                <h3>Thú cưng của {user.firstName}</h3>
                <span className="pets-count">{user.totalPets} thú cưng</span>
              </div>
              
              {user.pets.length > 0 ? (
                <div className="pets-grid">
                  {user.pets.map(pet => (
                    <div key={pet.id} className="pet-card">
                      <div className="pet-icon">
                        🐱 {/* Chỉ có mèo */}
                      </div>
                      <div className="pet-info">
                        <h4>{pet.name}</h4>
                        <p>{pet.breed}</p>
                        <span className="pet-species">{pet.species}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🐾</div>
                  <h4>Chưa có thú cưng</h4>
                  <p>{user.firstName} chưa đăng ký thú cưng nào.</p>
                </div>
              )}
            </div>
          )}

          {!isExpert && activeTab === 'matches' && (
            <div className="matches-tab">
              <div className="matches-header">
                <h3>Lịch sử ghép đôi</h3>
                <span className="matches-count">{user.totalMatches} ghép đôi</span>
              </div>
              
              {user.matches.length > 0 ? (
                <div className="matches-list">
                  {user.matches.map(match => (
                    <div key={match.id} className="match-card">
                      <div className="match-icon">💕</div>
                      <div className="match-info">
                        <h4>Ghép đôi với {match.petName}</h4>
                        <p>Chủ sở hữu: {match.ownerName}</p>
                        <span className="match-date">{formatDateTime(match.matchedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💔</div>
                  <h4>Chưa có ghép đôi</h4>
                  <p>{user.firstName} chưa có ghép đôi nào.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-header">
                <h3>Hoạt động gần đây</h3>
              </div>
              
              <div className="activity-timeline">
                {user.lastLogin && (
                  <div className="timeline-item">
                    <div className="timeline-icon">👤</div>
                    <div className="timeline-content">
                      <h4>Đăng nhập lần cuối</h4>
                      <p>{formatDateTime(user.lastLogin)}</p>
                    </div>
                  </div>
                )}
                
                {user.updatedAt && (
                  <div className="timeline-item">
                    <div className="timeline-icon">📝</div>
                    <div className="timeline-content">
                      <h4>Cập nhật thông tin</h4>
                      <p>{formatDateTime(user.updatedAt)}</p>
                    </div>
                  </div>
                )}
                
                {user.createdAt && (
                  <div className="timeline-item">
                    <div className="timeline-icon">🎉</div>
                    <div className="timeline-content">
                      <h4>Tham gia Pawnder</h4>
                      <p>{formatDateTime(user.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;