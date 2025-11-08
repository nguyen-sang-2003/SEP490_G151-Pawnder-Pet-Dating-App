import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import reportService from '../../services/api/reportService';
import userService from '../../services/api/userService';
import './ReportsList.css';

const ReportsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const reportsResponse = await reportService.getReports();
        
        // Backend returns: { success, message, data: ReportDto[] }
        // reportService.getReports() already unwraps response?.data || response
        const reportsData = Array.isArray(reportsResponse) ? reportsResponse : [];
        
        // Fetch user info for all unique user IDs in parallel
        const userIds = new Set();
        reportsData.forEach(report => {
          if (report.UserReport?.UserId) {
            userIds.add(report.UserReport.UserId);
          }
          // Note: Backend doesn't return Content/FromUserId in ReportDto
          // So we can't get reported user info from backend currently
        });
        
        // Fetch user details for all reporters
        const userPromises = Array.from(userIds).map(async (userId) => {
          try {
            const user = await userService.getUserById(userId);
            return { userId, user };
          } catch (err) {
            console.warn(`Error fetching user ${userId}:`, err);
            return { userId, user: null };
          }
        });
        
        const userResults = await Promise.all(userPromises);
        const userMap = new Map();
        userResults.forEach(({ userId, user }) => {
          if (user) {
            userMap.set(userId, user);
          }
        });
        
        // Map reports to frontend format
        const mappedReports = reportsData.map(report => {
          const reporterUserId = report.UserReport?.UserId || report.userReport?.userId;
          const reporterUser = userMap.get(reporterUserId);
          
          const fullName = reporterUser 
            ? (reporterUser.FullName || reporterUser.fullName || reporterUser.Email?.split('@')[0] || 'Unknown')
            : (report.UserReport?.FullName || report.userReport?.fullName || 'Unknown User');
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return {
            id: report.ReportId || report.reportId,
            reporterId: reporterUserId,
            reportedUserId: null, // Backend doesn't provide this in ReportDto
            reason: report.Reason || report.reason || 'N/A',
            status: report.Status || report.status || 'Pending',
            resolution: report.Resolution || report.resolution || null,
            createdAt: report.CreatedAt || report.createdAt,
            updatedAt: report.UpdatedAt || report.updatedAt,
            description: report.Reason || report.reason || 'N/A', // Use reason as description
            // Reporter info
            reporter: {
              userId: reporterUserId,
              fullName: fullName,
              firstName: firstName,
              lastName: lastName,
              email: report.UserReport?.Email || report.userReport?.email || reporterUser?.Email || reporterUser?.email || 'unknown@email.com',
              username: reporterUser?.Email?.split('@')[0] || report.UserReport?.Email?.split('@')[0] || 'unknown',
              phone: null, // Backend doesn't have phone
              avatar: null // Backend doesn't have avatar
            },
            // Reported user info (unknown since backend doesn't provide Content/FromUserId)
            reportedUser: {
              userId: null,
              fullName: 'Unknown User',
              firstName: 'Unknown',
              lastName: 'User',
              email: 'unknown@email.com',
              username: 'unknown',
              phone: null,
              avatar: null
            },
            // Reported content (not available from backend)
            reportedContent: {
              type: 'Message',
              message: 'N/A', // Backend doesn't return Content in ReportDto
              timestamp: report.CreatedAt || report.createdAt
            }
          };
        });
        
        setReports(mappedReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Không thể tải danh sách báo cáo. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [location.pathname]);

  // Memoize filtered reports to avoid recalculating on every render
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        (report.reporter?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reporter?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reporter?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reportedUser?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reportedUser?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toString().includes(searchTerm);

      const matchesStatus = filterStatus === 'all' || (report.status || '').toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  // Update current page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = useMemo(() => {
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, startIndex, itemsPerPage]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f39c12', text: 'Đang chờ', bg: '#fff3cd' },
      resolved: { color: '#27ae60', text: 'Đã xử lý', bg: '#d4edda' },
      rejected: { color: '#e74c3c', text: 'Từ chối', bg: '#f8d7da' }
    };
    
    const statusLower = (status || '').toLowerCase();
    const config = statusConfig[statusLower] || { 
      color: '#95a5a6', 
      text: status || 'Unknown', 
      bg: '#e9ecef' 
    };
    
    return (
      <span 
        className="status-badge" 
        style={{ 
          backgroundColor: config.bg,
          color: config.color,
          borderColor: config.color
        }}
      >
        {config.text}
      </span>
    );
  };

  const handleView = (reportId, e) => {
    e.stopPropagation();
    navigate(`/reports/${reportId}`);
  };

  const handleResolve = (reportId, e) => {
    e.stopPropagation();
    // Navigate đến ReportDetail để xem chi tiết và xử lý
    navigate(`/reports/${reportId}`);
  };

  const handleReject = (reportId, e) => {
    e.stopPropagation();
    // Navigate đến ReportDetail để xem chi tiết và từ chối
    navigate(`/reports/${reportId}`);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const resolved = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
    return { total, pending, resolved };
  }, [reports]);

  if (loading) {
    return (
      <div className="reports-list-page">
        <div className="page-header">
          <h1>Reports Management</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-list-page">
        <div className="page-header">
          <h1>Reports Management</h1>
        </div>
        <div className="error-message" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Lỗi</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-list-page">
      <div className="page-header">
        <h1>Reports Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Tổng báo cáo</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Đang chờ</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.resolved}</span>
            <span className="stat-label">Đã xử lý</span>
          </div>
        </div>
      </div>

      <div className="reports-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Tìm kiếm theo ID, người báo cáo, người bị báo cáo, lý do..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="resolved">Đã xử lý</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter</th>
              <th>Reported User/Pet</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map(report => (
                <tr key={report.id}>
                  <td className="report-id">#{report.id}</td>
                  <td className="reporter-cell">
                    <div className="user-info">
                      <div className="user-avatar-small">
                        {report.reporter.fullName.charAt(0)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{report.reporter.fullName}</div>
                        <div className="user-email">{report.reporter.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="reported-cell">
                    <div className="user-info">
                      <div className="user-avatar-small reported">
                        {report.reportedUser.fullName.charAt(0)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{report.reportedUser.fullName}</div>
                        <div className="user-email">{report.reportedUser.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="reason-cell">
                    <span className="reason-text">{report.reason}</span>
                  </td>
                  <td className="status-cell">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="date-cell">
                    {report.createdAt ? formatDate(report.createdAt) : 'N/A'}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={(e) => handleView(report.id, e)}
                        title="Xem chi tiết"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      {/* Chỉ hiển thị button Xử lý và Từ chối khi report chưa được xử lý (Pending) */}
                      {(report.status || '').toLowerCase() === 'pending' && (
                        <>
                          <button
                            className="action-btn resolve"
                            onClick={(e) => handleResolve(report.id, e)}
                            title="Xử lý"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={(e) => handleReject(report.id, e)}
                            title="Từ chối"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>Không tìm thấy báo cáo</h3>
                    <p>Không có báo cáo nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {currentPage} / {totalPages}
          </div>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsList;