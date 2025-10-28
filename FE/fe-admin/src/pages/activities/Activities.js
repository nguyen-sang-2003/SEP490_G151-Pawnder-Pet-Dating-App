import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Activities.css';

const Activities = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dữ liệu thông báo mở rộng
  const allActivities = [
    {
      id: 1,
      type: 'user',
      message: 'Người dùng mới đăng ký: john_doe',
      time: '5 phút trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 2,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Buddy',
      time: '15 phút trước',
      avatar: '🐕',
      color: '#764ba2'
    },
    {
      id: 3,
      type: 'report',
      message: 'Báo cáo mới từ user123',
      time: '30 phút trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 4,
      type: 'match',
      message: 'Ghép đôi thành công: Luna & Max',
      time: '1 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 5,
      type: 'user',
      message: 'Người dùng mới đăng ký: alice_wonder',
      time: '2 giờ trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 6,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Whiskers',
      time: '3 giờ trước',
      avatar: '🐱',
      color: '#764ba2'
    },
    {
      id: 7,
      type: 'report',
      message: 'Báo cáo mới từ petlover456',
      time: '4 giờ trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 8,
      type: 'match',
      message: 'Ghép đôi thành công: Charlie & Bella',
      time: '5 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 9,
      type: 'user',
      message: 'Người dùng mới đăng ký: bob_smith',
      time: '6 giờ trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 10,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Rex',
      time: '7 giờ trước',
      avatar: '🐕',
      color: '#764ba2'
    },
    {
      id: 11,
      type: 'report',
      message: 'Báo cáo mới từ animalfriend789',
      time: '8 giờ trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 12,
      type: 'match',
      message: 'Ghép đôi thành công: Daisy & Rocky',
      time: '9 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 13,
      type: 'user',
      message: 'Người dùng mới đăng ký: sarah_jones',
      time: '10 giờ trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 14,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Fluffy',
      time: '11 giờ trước',
      avatar: '🐱',
      color: '#764ba2'
    },
    {
      id: 15,
      type: 'report',
      message: 'Báo cáo mới từ petcare123',
      time: '12 giờ trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 16,
      type: 'match',
      message: 'Ghép đôi thành công: Milo & Luna',
      time: '13 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 17,
      type: 'user',
      message: 'Người dùng mới đăng ký: mike_wilson',
      time: '14 giờ trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 18,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Shadow',
      time: '15 giờ trước',
      avatar: '🐕',
      color: '#764ba2'
    },
    {
      id: 19,
      type: 'report',
      message: 'Báo cáo mới từ doglover456',
      time: '16 giờ trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 20,
      type: 'match',
      message: 'Ghép đôi thành công: Max & Ruby',
      time: '17 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 21,
      type: 'user',
      message: 'Người dùng mới đăng ký: emma_brown',
      time: '18 giờ trước',
      avatar: '👤',
      color: '#667eea'
    },
    {
      id: 22,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Coco',
      time: '19 giờ trước',
      avatar: '🐱',
      color: '#764ba2'
    },
    {
      id: 23,
      type: 'report',
      message: 'Báo cáo mới từ catlover789',
      time: '20 giờ trước',
      avatar: '⚠️',
      color: '#e74c3c'
    },
    {
      id: 24,
      type: 'match',
      message: 'Ghép đôi thành công: Oliver & Sophie',
      time: '21 giờ trước',
      avatar: '💕',
      color: '#27ae60'
    },
    {
      id: 25,
      type: 'user',
      message: 'Người dùng mới đăng ký: david_lee',
      time: '22 giờ trước',
      avatar: '👤',
      color: '#667eea'
    }
  ];

  // Tính toán phân trang
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = allActivities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="activities-page">
      <div className="activities-header">
        <button onClick={handleBackToDashboard} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại Dashboard
        </button>
        <h1>Hoạt động gần đây</h1>
        <p>Tất cả thông báo và hoạt động trong hệ thống</p>
      </div>

      <div className="activities-stats">
        <div className="stat-item">
          <span className="stat-number">{allActivities.length}</span>
          <span className="stat-label">Tổng hoạt động</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{allActivities.filter(a => a.type === 'user').length}</span>
          <span className="stat-label">Người dùng mới</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{allActivities.filter(a => a.type === 'pet').length}</span>
          <span className="stat-label">Thú cưng mới</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{allActivities.filter(a => a.type === 'match').length}</span>
          <span className="stat-label">Ghép đôi thành công</span>
        </div>
      </div>

      <div className="activities-list">
        {currentActivities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-avatar" style={{ backgroundColor: activity.color }}>
              {activity.avatar}
            </div>
            <div className="activity-content">
              <p className="activity-message">{activity.message}</p>
              <span className="activity-time">{activity.time}</span>
            </div>
            <div className="activity-type">
              <span className={`type-badge ${activity.type}`}>
                {activity.type === 'user' && 'Người dùng'}
                {activity.type === 'pet' && 'Thú cưng'}
                {activity.type === 'report' && 'Báo cáo'}
                {activity.type === 'match' && 'Ghép đôi'}
              </span>
            </div>
          </div>
        ))}
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

export default Activities;
