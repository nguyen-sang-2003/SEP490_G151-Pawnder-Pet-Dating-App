import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { userService } from '../../shared/api';
import './styles/ExpertInfoModal.css';

const ExpertInfoModal = ({ isOpen, onClose, expertId, userData }) => {
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (expertId) {
        loadExpertInfo();
      } else if (userData) {
        // Fallback: Sử dụng userData từ context nếu không có expertId
        console.log('[ExpertInfoModal] Using userData from context:', userData);
        // Map userData từ AuthContext format sang API format
        const mappedUser = {
          UserId: userData.id || userData.UserId || userData.userId,
          userId: userData.id || userData.UserId || userData.userId,
          Email: userData.email || userData.Email,
          email: userData.email || userData.Email,
          FullName: userData.fullName || userData.FullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          fullName: userData.fullName || userData.FullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          Gender: userData.gender || userData.Gender,
          gender: userData.gender || userData.Gender,
          UserStatusId: userData.userStatusId || userData.UserStatusId || userData.statusId,
          userStatusId: userData.userStatusId || userData.UserStatusId || userData.statusId,
          RoleId: userData.roleId || userData.RoleId,
          roleId: userData.roleId || userData.RoleId,
          Role: userData.role ? { RoleName: userData.role } : null,
          role: userData.role ? { roleName: userData.role } : null,
          CreatedAt: userData.createdAt || userData.CreatedAt,
          createdAt: userData.createdAt || userData.CreatedAt,
          UpdatedAt: userData.updatedAt || userData.UpdatedAt,
          updatedAt: userData.updatedAt || userData.UpdatedAt,
          IsProfileComplete: userData.isProfileComplete || userData.IsProfileComplete,
          isProfileComplete: userData.isProfileComplete || userData.IsProfileComplete,
          IsDeleted: userData.isDeleted || userData.IsDeleted,
          isDeleted: userData.isDeleted || userData.IsDeleted,
          Address: userData.address || userData.Address,
          address: userData.address || userData.Address,
        };
        setExpert(mappedUser);
      } else {
        console.warn('[ExpertInfoModal] Modal opened but no expertId or userData');
        setError('Không tìm thấy thông tin Expert');
      }
    } else {
      // Reset state when modal closes
      setExpert(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, expertId, userData]);

  const loadExpertInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ExpertInfoModal] Loading expert info for ID:', expertId);
      
      if (!expertId) {
        throw new Error('Expert ID không hợp lệ');
      }
      
      const userData = await userService.getUserById(expertId);
      console.log('[ExpertInfoModal] User data received:', userData);
      
      if (!userData) {
        throw new Error('Không nhận được dữ liệu từ server');
      }
      
      setExpert(userData);
    } catch (err) {
      console.error('[ExpertInfoModal] Error loading expert info:', err);
      setError(err.message || 'Không thể tải thông tin Expert. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (statusId) => {
    switch (statusId) {
      case 1:
        return 'Bị khóa';
      case 2:
        return 'Bình thường';
      case 3:
        return 'VIP';
      default:
        return 'Không xác định';
    }
  };

  const getGenderLabel = (gender) => {
    if (!gender) return 'Không tiết lộ';
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return gender;
    }
  };

  return createPortal(
    <div className="expert-info-modal-overlay" onClick={onClose}>
      <div className="expert-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="expert-info-modal-header">
          <h2>Thông tin Expert</h2>
          <button className="expert-info-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="expert-info-modal-content">
          {loading ? (
            <div className="expert-info-loading">
              <div className="spinner"></div>
              <p>Đang tải thông tin...</p>
            </div>
          ) : error ? (
            <div className="expert-info-error">
              <p>{error}</p>
              <button onClick={loadExpertInfo} className="retry-btn">
                Thử lại
              </button>
            </div>
          ) : expert ? (
            <div className="expert-info-details">
              {/* Avatar và tên */}
              <div className="expert-info-avatar-section">
                <div className="expert-info-avatar">
                  {expert.avatar ? (
                    <img src={expert.avatar} alt={expert.FullName || expert.fullName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(expert.FullName || expert.fullName || 'E').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3>{expert.FullName || expert.fullName || 'N/A'}</h3>
                <p className="expert-role">Expert</p>
              </div>

              {/* Thông tin cơ bản */}
              <div className="expert-info-section">
                <h4>Thông tin cơ bản</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{expert.Email || expert.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Họ và tên:</span>
                    <span className="info-value">{expert.FullName || expert.fullName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Giới tính:</span>
                    <span className="info-value">{getGenderLabel(expert.Gender || expert.gender)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Vai trò:</span>
                    <span className="info-value">{expert.Role?.RoleName || expert.role?.roleName || 'Expert'}</span>
                  </div>
                </div>
              </div>


            </div>
          ) : null}
        </div>

        <div className="expert-info-modal-footer">
          <button onClick={onClose} className="close-btn">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpertInfoModal;

