import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { useTheme } from '../../shared/context/ThemeContext';
import ExpertInfoModal from './ExpertInfoModal';
import { USER_ROLES } from '../../shared/constants';
import './styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showExpertInfoModal, setShowExpertInfoModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    // Nếu là Expert, hiển thị modal thông tin
    const userRole = user?.Role || user?.role;
    const isExpert = userRole === USER_ROLES.EXPERT || userRole === 'Expert' || (user?.RoleId || user?.roleId) === 2;
    
    if (isExpert) {
      setShowExpertInfoModal(true);
    } else {
      // Nếu không phải Expert, điều hướng đến trang profile (nếu có)
      navigate('/profile');
    }
  };

  const getExpertId = () => {
    const expertId = user?.UserId || user?.userId;
    console.log('[Header] Getting Expert ID:', expertId, 'User object:', user);
    return expertId;
  };


  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">Pawnder Admin</span>
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
            </div>
          </div>
          
          <div className="user-dropdown">
            <button className="dropdown-toggle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            <div className="dropdown-menu">
              <button onClick={handleProfileClick} className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Thông tin cá nhân
              </button>
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

      {/* Expert Info Modal */}
      {showExpertInfoModal && (
        <ExpertInfoModal
          isOpen={showExpertInfoModal}
          onClose={() => setShowExpertInfoModal(false)}
          expertId={getExpertId()}
          userData={user}
        />
      )}
    </header>
  );
};

export default Header;
