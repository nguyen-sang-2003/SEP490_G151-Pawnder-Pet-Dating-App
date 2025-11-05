import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockReports } from '../../data/mockReports';
import { mockUsers } from '../../data/mockUsers';
import './ReportsList.css';

const ReportsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;

  // Helper function để lấy user info từ mockUsers
  const getUserInfo = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      return {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        username: user.username,
        phone: user.phone,
        avatar: user.avatar
      };
    }
    return {
      userId: userId,
      fullName: 'Unknown User',
      email: 'unknown@email.com',
      username: 'unknown',
      phone: 'N/A',
      avatar: null
    };
  };

  // Reload khi quay lại từ ReportDetail
  useEffect(() => {
    if (location.pathname === '/reports') {
      setRefreshKey(prev => prev + 1);
    }
  }, [location.pathname]);

  // Dữ liệu báo cáo từ mock data - enrich với user info từ mockUsers
  const initialReports = mockReports.map(report => ({
    ...report,
    reporter: getUserInfo(report.reporterId),
    reportedUser: getUserInfo(report.reportedUserId)
  }));

  // Merge reports với status từ localStorage (refresh khi có thay đổi)
  const getReports = () => {
    return initialReports.map(report => {
      const savedStatus = localStorage.getItem(`report_status_${report.id}`);
      const savedResolution = localStorage.getItem(`report_resolution_${report.id}`);
      const savedUpdatedAt = localStorage.getItem(`report_updatedAt_${report.id}`);
      
      if (savedStatus) {
        return {
          ...report,
          status: savedStatus,
          resolution: savedResolution || report.resolution,
          updatedAt: savedUpdatedAt || report.updatedAt
        };
      }
      return report;
    });
  };

  const [reports, setReports] = useState(getReports());
  
  // Reload reports khi quay lại từ ReportDetail
  useEffect(() => {
    if (location.pathname === '/reports') {
      setReports(getReports());
    }
  }, [location.pathname, refreshKey]);

  // Filter reports based on search and status
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toString().includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || report.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f39c12', text: 'Đang chờ', bg: '#fff3cd' },
      resolved: { color: '#27ae60', text: 'Đã xử lý', bg: '#d4edda' },
      rejected: { color: '#e74c3c', text: 'Từ chối', bg: '#f8d7da' }
    };
    
    const config = statusConfig[status.toLowerCase()] || { 
      color: '#95a5a6', 
      text: status, 
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

  return (
    <div className="reports-list-page">
      <div className="page-header">
        <h1>Reports Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{reports.length}</span>
            <span className="stat-label">Tổng báo cáo</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{reports.filter(r => r.status === 'Pending').length}</span>
            <span className="stat-label">Đang chờ</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{reports.filter(r => r.status === 'Resolved').length}</span>
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
                    {formatDate(report.createdAt)}
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
                      {report.status === 'Pending' && (
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