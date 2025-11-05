import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pendingCount, pendingNotifications } = useNotification();
  const navigate = useNavigate();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleNotificationClick = () => {
    if (user?.role === 'Expert') {
      setShowNotificationDropdown(!showNotificationDropdown);
    }
  };

  const handleNotificationItemClick = (notificationId) => {
    setShowNotificationDropdown(false);
    navigate('/expert/notifications');
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">Pawnder Admin</span>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="search-input"
          />
          <button className="search-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Chuyển sang ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>
        
        <div className="notifications" ref={notificationRef}>
          <button 
            className="notification-button"
            onClick={handleNotificationClick}
            title={pendingCount > 0 ? `${pendingCount} thông báo chờ xử lý` : 'Không có thông báo mới'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {pendingCount > 0 && (
              <span className="notification-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>
            )}
          </button>

          {showNotificationDropdown && pendingNotifications.length > 0 && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h3>Thông báo chờ xử lý ({pendingCount})</h3>
                <button 
                  className="view-all-notifications"
                  onClick={() => {
                    setShowNotificationDropdown(false);
                    navigate('/expert/notifications');
                  }}
                >
                  Xem tất cả
                </button>
              </div>
              <div className="notification-list">
                {pendingNotifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id}
                    className="notification-item"
                    onClick={() => handleNotificationItemClick(notification.id)}
                  >
                    <div className="notification-item-header">
                      <span className="notification-user">{notification.userName}</span>
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-pet">
                        {notification.petName && (
                          <span className="pet-tag">
                            {notification.petName} ({notification.petType})
                          </span>
                        )}
                      </div>
                      <div className="notification-question">
                        {notification.aiQuestion && notification.aiQuestion.length > 60
                          ? `${notification.aiQuestion.substring(0, 60)}...`
                          : notification.aiQuestion || notification.title}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingNotifications.length > 5 && (
                  <div className="notification-more">
                    + {pendingNotifications.length - 5} thông báo khác
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.firstName} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="user-role">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>
          </div>
          
          <div className="user-dropdown">
            <button className="dropdown-toggle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            <div className="dropdown-menu">
              <a href="/profile" className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Thông tin cá nhân
              </a>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
