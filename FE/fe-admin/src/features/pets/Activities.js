import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, reportService } from '../../shared/api';
import './styles/Activities.css';

const Activities = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;
  const [allActivitiesRaw, setAllActivitiesRaw] = useState([]);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Vừa xong';
    } else if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recent users and reports in parallel
        const [usersResponse, reportsResponse] = await Promise.all([
          userService.getUsers({
            page: 1,
            pageSize: 50, // Get more users to have enough data
            includeDeleted: false
          }).catch(err => {
            console.error('Error fetching users:', err);
            return { Items: [], Total: 0 };
          }),
          reportService.getReports({
            page: 1,
            pageSize: 50 // Get more reports to have enough data
          }).catch(err => {
            console.error('Error fetching reports:', err);
            return { Items: [], Total: 0 };
          })
        ]);

        const users = usersResponse.Items || usersResponse.items || [];
        const reports = reportsResponse.Items || reportsResponse.items || [];

        // Map users to activities
        const userActivities = users
          .sort((a, b) => {
            const dateA = new Date(a.CreatedAt || a.createdAt || 0);
            const dateB = new Date(b.CreatedAt || b.createdAt || 0);
            return dateB - dateA; // Sort descending (newest first)
          })
          .slice(0, 20) // Limit to 20 most recent
          .map((user, index) => {
            const fullName = user.FullName || user.fullName || user.Email?.split('@')[0] || 'user';
            const createdAt = user.CreatedAt || user.createdAt;
            const timeAgo = createdAt ? getTimeAgo(new Date(createdAt)) : 'Không xác định';

            return {
              id: `user-${user.UserId || user.userId || index}`,
              type: 'user',
              message: `Người dùng mới đăng ký: ${fullName}`,
              time: timeAgo,
              avatar: '👤',
              color: '#667eea',
              createdAt: createdAt
            };
          });

        // Map reports to activities
        const reportActivities = reports
          .sort((a, b) => {
            const dateA = new Date(a.CreatedAt || a.createdAt || 0);
            const dateB = new Date(b.CreatedAt || b.createdAt || 0);
            return dateB - dateA; // Sort descending (newest first)
          })
          .slice(0, 20) // Limit to 20 most recent
          .map((report, index) => {
            // Extract reported user from reason if available
            const reason = report.Reason || report.reason || '';
            const reportedUserMatch = reason.match(/\[ReportedUser=([^\]]+)\]/i);
            const reportedUser = reportedUserMatch ? reportedUserMatch[1] : 'người dùng';
            
            const createdAt = report.CreatedAt || report.createdAt;
            const timeAgo = createdAt ? getTimeAgo(new Date(createdAt)) : 'Không xác định';

            return {
              id: `report-${report.ReportId || report.reportId || index}`,
              type: 'report',
              message: `Báo cáo mới từ ${reportedUser}`,
              time: timeAgo,
              avatar: '⚠️',
              color: '#e74c3c',
              createdAt: createdAt
            };
          });

        // Combine and sort all activities by createdAt (newest first)
        const allActivities = [...userActivities, ...reportActivities]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA; // Sort descending (newest first)
          });

        setAllActivitiesRaw(allActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Không thể tải hoạt động. Vui lòng thử lại sau.');
        // Fallback to empty array
        setAllActivitiesRaw([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Lọc chỉ lấy user và report
  const allActivities = allActivitiesRaw.filter(a => a.type === 'user' || a.type === 'report');

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

  if (loading) {
    return (
      <div className="activities-page">
        <div className="activities-header">
          <button onClick={handleBackToDashboard} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại Bảng điều khiển
          </button>
          <h1>Hoạt động gần đây</h1>
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
      <div className="activities-page">
        <div className="activities-header">
          <button onClick={handleBackToDashboard} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại Bảng điều khiển
          </button>
          <h1>Hoạt động gần đây</h1>
          <p style={{ color: '#e74c3c' }}>{error}</p>
        </div>
      </div>
    );
  }

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
          <span className="stat-number">{allActivities.filter(a => a.type === 'report').length}</span>
          <span className="stat-label">Báo cáo mới</span>
        </div>
      </div>

      {allActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <>
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
                    {activity.type === 'report' && 'Báo cáo'}
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
        </>
      )}
    </div>
  );
};

export default Activities;
