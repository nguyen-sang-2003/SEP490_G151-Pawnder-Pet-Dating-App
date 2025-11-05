import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockUsers } from '../../data/mockUsers';
import { mockPets } from '../../data/mockPets';
import './UserDetail.css';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Tìm user từ mockUsers
  const baseUser = mockUsers.find(u => u.id === parseInt(id));
  
  // Lấy pets từ mockPets dựa trên ownerId
  const getUserPets = (userId) => {
    return mockPets.filter(pet => pet.ownerId === userId).map(pet => ({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed
    }));
  };

  // Mock data bổ sung cho các field không có trong mockUsers
  // (Trong thực tế sẽ fetch từ API hoặc thêm vào mockUsers)
  const getAdditionalUserData = (userId) => {
    const userPets = getUserPets(userId); // Lấy pets từ mockPets
    
    const additionalData = {
      1: {
        bio: 'Tôi là một người yêu thích động vật và muốn tìm bạn đồng hành cho những chú thú cưng của mình. Tôi có kinh nghiệm chăm sóc mèo trong nhiều năm.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '1-5 years',
          location: 'TP.HCM',
          activityLevel: 'Moderate'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Luna', ownerName: 'Alice Wonder', matchedAt: '2024-10-25T14:30:00Z' },
          { id: 2, petName: 'Whiskers', ownerName: 'Sarah Jones', matchedAt: '2024-10-20T09:15:00Z' },
          { id: 3, petName: 'Simba', ownerName: 'Emma Brown', matchedAt: '2024-10-18T16:45:00Z' }
        ]
      },
      2: {
        bio: 'Tôi là một người yêu mèo và có kinh nghiệm chăm sóc mèo Persian. Tôi thích tạo ra một môi trường yên tĩnh và thoải mái cho thú cưng.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '2-4 years',
          location: 'TP.HCM',
          activityLevel: 'Low'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Buddy', ownerName: 'John Doe', matchedAt: '2024-10-25T14:30:00Z' },
          { id: 2, petName: 'Whiskers', ownerName: 'Sarah Jones', matchedAt: '2024-10-22T11:20:00Z' }
        ]
      },
      3: {
        bio: 'Tôi đang tìm hiểu về việc nuôi thú cưng và muốn học hỏi kinh nghiệm từ những người có kinh nghiệm.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: 'Any',
          location: 'TP.HCM',
          activityLevel: 'High'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: []
      },
      4: {
        bio: 'Tôi là người yêu thích mèo và có kinh nghiệm nuôi nhiều loại mèo khác nhau. Tôi thích hoạt động ngoài trời cùng thú cưng.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '2-6 years',
          location: 'TP.HCM',
          activityLevel: 'High'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Buddy', ownerName: 'John Doe', matchedAt: '2024-10-26T10:00:00Z' },
          { id: 2, petName: 'Luna', ownerName: 'Alice Wonder', matchedAt: '2024-10-24T15:30:00Z' }
        ]
      },
      5: {
        bio: 'Tôi là người mới bắt đầu nuôi thú cưng và đang học hỏi cách chăm sóc tốt nhất.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '1-3 years',
          location: 'TP.HCM',
          activityLevel: 'Moderate'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Luna', ownerName: 'Alice Wonder', matchedAt: '2024-10-23T12:00:00Z' }
        ]
      },
      6: {
        bio: 'Tôi yêu mèo, có kinh nghiệm chăm sóc mèo. Tôi thích tạo môi trường vui vẻ và năng động cho thú cưng.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '1-4 years',
          location: 'TP.HCM',
          activityLevel: 'Moderate'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Buddy', ownerName: 'John Doe', matchedAt: '2024-10-27T14:00:00Z' },
          { id: 2, petName: 'Whiskers', ownerName: 'Sarah Jones', matchedAt: '2024-10-25T11:00:00Z' }
        ]
      },
      7: {
        bio: 'Tôi là người yêu thích mèo và có kinh nghiệm nuôi mèo trong nhiều năm.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: '2-5 years',
          location: 'TP.HCM',
          activityLevel: 'Low'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Luna', ownerName: 'Alice Wonder', matchedAt: '2024-10-22T16:00:00Z' }
        ]
      },
      8: {
        bio: 'Tôi đang tìm hiểu về việc nuôi thú cưng và chuẩn bị đón nhận một thành viên mới trong gia đình.',
        preferences: {
          petSpecies: ['Cat'],
          petAge: 'Any',
          location: 'TP.HCM',
          activityLevel: 'Moderate'
        },
        pets: userPets, // Sử dụng pets từ mockPets
        matches: [
          { id: 1, petName: 'Buddy', ownerName: 'John Doe', matchedAt: '2024-10-21T10:00:00Z' }
        ]
      }
    };
    
    return additionalData[userId] || {
      bio: 'Chưa có thông tin giới thiệu.',
      preferences: {
        petSpecies: ['Cat'],
        petAge: 'Any',
        location: 'TP.HCM',
        activityLevel: 'Moderate'
      },
      pets: userPets, // Sử dụng pets từ mockPets
      matches: []
    };
  };

  // Kết hợp baseUser với additional data
  const user = baseUser ? {
    ...baseUser,
    ...getAdditionalUserData(baseUser.id)
    // Giữ nguyên status từ mockUsers (NORMAL/PREMIUM)
  } : null;

  if (!user) {
    return (
      <div className="user-detail-page">
        <div className="error-message">
          <h2>Không tìm thấy người dùng</h2>
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
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'pets', label: 'Thú cưng', icon: '🐕' },
    { id: 'matches', label: 'Ghép đôi', icon: '💕' },
    { id: 'activity', label: 'Hoạt động', icon: '📊' }
  ];

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
            <p className="user-age">{getAge(user.dateOfBirth)} tuổi • {user.gender}</p>
            <p className="user-location">📍 {user.address}</p>
          </div>

          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-number">{user.totalPets}</span>
              <span className="stat-label">Thú cưng</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{user.totalMatches}</span>
              <span className="stat-label">Ghép đôi</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{formatDate(user.createdAt)}</span>
              <span className="stat-label">Tham gia</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          {tabs.map(tab => (
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
                    <span className="value">{user.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Địa chỉ:</span>
                    <span className="value">{user.address}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Thông tin cá nhân</h3>
                  <div className="info-item">
                    <span className="label">Ngày sinh:</span>
                    <span className="value">{formatDate(user.dateOfBirth)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Giới tính:</span>
                    <span className="value">{user.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Tuổi:</span>
                    <span className="value">{getAge(user.dateOfBirth)} tuổi</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Vai trò:</span>
                    <span className="value">{user.role}</span>
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
                    <span className="value">{formatDateTime(user.lastLogin)}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Thời gian</h3>
                  <div className="info-item">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">{formatDateTime(user.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Cập nhật cuối:</span>
                    <span className="value">{formatDateTime(user.updatedAt)}</span>
                  </div>
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

          {activeTab === 'pets' && (
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

          {activeTab === 'matches' && (
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
                <div className="timeline-item">
                  <div className="timeline-icon">👤</div>
                  <div className="timeline-content">
                    <h4>Đăng nhập lần cuối</h4>
                    <p>{formatDateTime(user.lastLogin)}</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-icon">📝</div>
                  <div className="timeline-content">
                    <h4>Cập nhật thông tin</h4>
                    <p>{formatDateTime(user.updatedAt)}</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-icon">🎉</div>
                  <div className="timeline-content">
                    <h4>Tham gia Pawnder</h4>
                    <p>{formatDateTime(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;