import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockReports } from '../../data/mockReports';
import { mockUsers } from '../../data/mockUsers';
import { addUserNotification } from '../../data/mockUserNotifications';
import './ReportDetail.css';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id);

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

  // Tìm report từ mockReports và enrich với user info từ mockUsers
  const baseReport = mockReports.find(r => r.id === reportId);
  
  // Đọc status từ localStorage nếu có (để giữ trạng thái đã xử lý)
  const getInitialReport = () => {
    if (!baseReport) return null;
    const savedStatus = localStorage.getItem(`report_status_${reportId}`);
    const savedResolution = localStorage.getItem(`report_resolution_${reportId}`);
    const savedUpdatedAt = localStorage.getItem(`report_updatedAt_${reportId}`);
    
    return {
      ...baseReport,
      reporter: getUserInfo(baseReport.reporterId),
      reportedUser: getUserInfo(baseReport.reportedUserId),
      reportedContent: {
        ...baseReport.reportedContent,
        timestamp: baseReport.reportedContent.timestamp || baseReport.createdAt
      },
      status: savedStatus || baseReport.status || 'Pending',
      resolution: savedResolution || baseReport.resolution || null,
      updatedAt: savedUpdatedAt || baseReport.updatedAt,
      attachments: [] // Có thể thêm từ API sau
    };
  };

  const [report, setReport] = useState(getInitialReport());

  if (!report) {
    return (
      <div className="report-detail-page">
        <div className="error-message">
          <h2>Không tìm thấy báo cáo</h2>
          <p>Báo cáo với ID {id} không tồn tại.</p>
          <button onClick={() => navigate('/reports')} className="back-btn">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
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

  const getReasonIcon = (reason) => {
    const reasonIcons = {
      'Inappropriate behavior': '🚫',
      'Spam messages': '📢',
      'Inappropriate content': '🖼️',
      'Harassment': '⚠️',
      'Fake information': '❌',
      'Community guidelines violation': '📜',
      'Scam': '💰',
      'Offensive language': '💬'
    };
    return reasonIcons[reason] || '📋';
  };

  const handleResolve = () => {
    const newStatus = 'Resolved';
    const newResolution = 'Báo cáo đã được xử lý thành công.';
    const newUpdatedAt = new Date().toISOString();
    
    // Lưu status vào localStorage
    localStorage.setItem(`report_status_${reportId}`, newStatus);
    localStorage.setItem(`report_resolution_${reportId}`, newResolution);
    localStorage.setItem(`report_updatedAt_${reportId}`, newUpdatedAt);
    
    // Gửi notification cho người báo cáo (reporter)
    if (report && report.reporterId) {
      const notification = {
        userId: report.reporterId, // Người báo cáo sẽ nhận notification
        type: 'report_resolved',
        title: 'Báo cáo của bạn đã được xử lý',
        message: `Báo cáo #${reportId} của bạn về "${report.reason}" đã được xử lý thành công. Người dùng bị báo cáo đã được xử lý theo quy định.`,
        data: {
          reportId: reportId,
          status: newStatus,
          resolution: newResolution
        }
      };
      addUserNotification(notification);
    }
    
    // Cập nhật state
    setReport(prev => prev ? {
      ...prev,
      status: newStatus,
      resolution: newResolution,
      updatedAt: newUpdatedAt
    } : null);
  };

  const handleReject = () => {
    const newStatus = 'Rejected';
    const newResolution = 'Báo cáo đã bị từ chối.';
    const newUpdatedAt = new Date().toISOString();
    
    // Lưu status vào localStorage
    localStorage.setItem(`report_status_${reportId}`, newStatus);
    localStorage.setItem(`report_resolution_${reportId}`, newResolution);
    localStorage.setItem(`report_updatedAt_${reportId}`, newUpdatedAt);
    
    // Gửi notification cho người báo cáo (reporter)
    if (report && report.reporterId) {
      const notification = {
        userId: report.reporterId, // Người báo cáo sẽ nhận notification
        type: 'report_rejected',
        title: 'Báo cáo của bạn đã được xem xét',
        message: `Báo cáo #${reportId} của bạn về "${report.reason}" đã được xem xét. Sau khi kiểm tra, chúng tôi không tìm thấy bằng chứng vi phạm. Người dùng bị báo cáo không sai và không bị xử lý.`,
        data: {
          reportId: reportId,
          status: newStatus,
          resolution: newResolution
        }
      };
      addUserNotification(notification);
    }
    
    // Cập nhật state
    setReport(prev => prev ? {
      ...prev,
      status: newStatus,
      resolution: newResolution,
      updatedAt: newUpdatedAt
    } : null);
  };

  return (
    <div className="report-detail-page">
      <div className="page-header">
        <button onClick={() => navigate('/reports')} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại danh sách
        </button>
        <h1>Chi tiết báo cáo #{report.id}</h1>
      </div>

      <div className="report-detail-content">
        {/* Report Header */}
        <div className="report-header">
          <div className="report-status-section">
            <div className="status-info">
              <span className="label">Trạng thái:</span>
              {getStatusBadge(report.status)}
            </div>
            <div className="report-id-display">
              <span className="label">ID:</span>
              <span className="value">#{report.id}</span>
            </div>
          </div>

          <div className="report-reason-section">
            <div className="reason-icon">{getReasonIcon(report.reason)}</div>
            <div className="reason-info">
              <h3>Lý do báo cáo</h3>
              <p className="reason-text">{report.reason}</p>
            </div>
          </div>
        </div>

        {/* Report Information */}
        <div className="report-info-grid">
          <div className="info-card">
            <h3>Người báo cáo</h3>
            <div className="user-card">
              <div className="user-avatar-large">
                {report.reporter.avatar ? (
                  <img src={report.reporter.avatar} alt={report.reporter.fullName} />
                ) : (
                  <span>{report.reporter.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="user-details-full">
                <h4>{report.reporter.fullName}</h4>
                <p className="user-username">@{report.reporter.username}</p>
                <p className="user-email">{report.reporter.email}</p>
                <p className="user-phone">{report.reporter.phone}</p>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Người bị báo cáo</h3>
            <div className="user-card">
              <div className="user-avatar-large reported">
                {report.reportedUser.avatar ? (
                  <img src={report.reportedUser.avatar} alt={report.reportedUser.fullName} />
                ) : (
                  <span>{report.reportedUser.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="user-details-full">
                <h4>{report.reportedUser.fullName}</h4>
                <p className="user-username">@{report.reportedUser.username}</p>
                <p className="user-email">{report.reportedUser.email}</p>
                <p className="user-phone">{report.reportedUser.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Description */}
        <div className="info-card">
          <h3>Mô tả chi tiết</h3>
          <p className="description-text">{report.description}</p>
        </div>

        {/* Reported Content */}
        <div className="info-card">
          <h3>Nội dung bị báo cáo</h3>
          <div className="content-info">
            <div className="content-type">
              <span className="type-badge">{report.reportedContent.type}</span>
            </div>
            <div className="content-message">
              <p>{report.reportedContent.message}</p>
            </div>
            <div className="content-timestamp">
              <span className="label">Thời gian:</span>
              <span className="value">{formatDateTime(report.reportedContent.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="info-card">
          <h3>Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon">📅</div>
              <div className="timeline-content">
                <h4>Báo cáo được tạo</h4>
                <p>{formatDateTime(report.createdAt)}</p>
              </div>
            </div>
            {report.updatedAt !== report.createdAt && (
              <div className="timeline-item">
                <div className="timeline-icon">🔄</div>
                <div className="timeline-content">
                  <h4>Cập nhật lần cuối</h4>
                  <p>{formatDateTime(report.updatedAt)}</p>
                </div>
              </div>
            )}
            {report.resolution && (
              <div className="timeline-item">
                <div className="timeline-icon">✅</div>
                <div className="timeline-content">
                  <h4>Kết quả xử lý</h4>
                  <p>{formatDateTime(report.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resolution */}
        {report.resolution && (
          <div className="info-card resolution-card">
            <h3>Kết quả xử lý</h3>
            <div className="resolution-content">
              <p>{report.resolution}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {report.status === 'Pending' && (
          <div className="action-section">
            <button 
              className="action-btn resolve-btn"
              onClick={handleResolve}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Xử lý báo cáo
            </button>
            <button 
              className="action-btn reject-btn"
              onClick={handleReject}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Từ chối báo cáo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;