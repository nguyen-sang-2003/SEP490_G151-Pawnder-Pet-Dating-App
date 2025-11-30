import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService, userService } from '../../shared/api';
import { addUserNotification } from '../../shared/data/mockUserNotifications';
import './styles/ReportDetail.css';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id);
  
  // Report data state
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [formError, setFormError] = useState('');

  const extractReportedUserFromReason = (reason = '') => {
    const reportedUserRegex = /\[ReportedUser=([^\]]+)\]/i;
    const match = reason.match(reportedUserRegex);
    const cleanReason = reason.replace(reportedUserRegex, '').trim();
    if (match) {
      const reportedName = match[1].trim();
      const nameParts = reportedName.split(' ');
      return {
        cleanReason: cleanReason || 'N/A',
        reportedUser: {
          userId: null,
          fullName: reportedName,
          firstName: nameParts[0] || reportedName,
          lastName: nameParts.slice(1).join(' ') || '',
          email: 'unknown@email.com',
          username: reportedName.replace(/\s+/g, '').toLowerCase(),
          phone: null,
          avatar: null
        }
      };
    }

    return {
      cleanReason: reason || 'N/A',
      reportedUser: {
        userId: null,
        fullName: 'Unknown User',
        firstName: 'Unknown',
        lastName: 'User',
        email: 'unknown@email.com',
        username: 'unknown',
        phone: null,
        avatar: null
      }
    };
  };

  // Fetch report data from API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isNaN(reportId)) {
          setError('ID báo cáo không hợp lệ');
          setLoading(false);
          return;
        }
        
        const reportResponse = await reportService.getReportById(reportId);
        
        // Backend returns: { success, message, data: ReportDto }
        // reportService.getReportById() already unwraps response?.data || response
        if (!reportResponse) {
          setError('Không tìm thấy báo cáo');
          setLoading(false);
          return;
        }
        
        // Fetch reporter user info
        const reporterUserId = reportResponse.UserReport?.UserId || reportResponse.userReport?.userId;
        let reporterUser = null;
        if (reporterUserId) {
          try {
            reporterUser = await userService.getUserById(reporterUserId);
          } catch (err) {
            console.warn('Error fetching reporter user:', err);
          }
        }
        
        const reporterFullName = reporterUser
          ? (reporterUser.FullName || reporterUser.fullName || reporterUser.Email?.split('@')[0] || 'Unknown')
          : (reportResponse.UserReport?.FullName || reportResponse.userReport?.fullName || 'Unknown User');
        const reporterNameParts = reporterFullName.split(' ');
        const reporterFirstName = reporterNameParts[0] || reporterFullName;
        const reporterLastName = reporterNameParts.slice(1).join(' ') || '';
        
        // Map report to frontend format
        const { cleanReason, reportedUser } = extractReportedUserFromReason(reportResponse.Reason || reportResponse.reason || 'N/A');

        const mappedReport = {
          id: reportResponse.ReportId || reportResponse.reportId,
          reporterId: reporterUserId,
          reportedUserId: null,
          reason: cleanReason,
          status: reportResponse.Status || reportResponse.status || 'Pending',
          resolution: reportResponse.Resolution || reportResponse.resolution || null,
          createdAt: reportResponse.CreatedAt || reportResponse.createdAt,
          updatedAt: reportResponse.UpdatedAt || reportResponse.updatedAt,
          description: cleanReason,
          // Reporter info
          reporter: {
            userId: reporterUserId,
            fullName: reporterFullName,
            firstName: reporterFirstName,
            lastName: reporterLastName,
            email: reportResponse.UserReport?.Email || reportResponse.userReport?.email || reporterUser?.Email || reporterUser?.email || 'unknown@email.com',
            username: reporterUser?.Email?.split('@')[0] || reportResponse.UserReport?.Email?.split('@')[0] || 'unknown',
            phone: null, // Backend doesn't have phone
            avatar: null // Backend doesn't have avatar
          },
          reportedUser,
          // Reported content (not available from backend)
          reportedContent: {
            type: 'Message',
            message: 'N/A', // Backend doesn't return Content in ReportDto
            timestamp: reportResponse.CreatedAt || reportResponse.createdAt
          }
        };
        
        setReport(mappedReport);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Không thể tải thông tin báo cáo. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="report-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/reports')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại danh sách
          </button>
          <h1>Chi tiết báo cáo #{id}</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/reports')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại danh sách
          </button>
          <h1>Chi tiết báo cáo #{id}</h1>
        </div>
        <div className="error-message">
          <h2>{error || 'Không tìm thấy báo cáo'}</h2>
          <p>Báo cáo với ID {id} không tồn tại.</p>
          <button onClick={() => navigate('/reports')} className="back-btn">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
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

  const openActionModal = (type) => {
    setActionType(type);
    setAdminResponse('');
    setFormError('');
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActionType(null);
    setAdminResponse('');
    setFormError('');
  };

  const handleSubmitAction = async () => {
    if (!actionType) return;
    if (!adminResponse.trim()) {
      setFormError('Vui lòng nhập nội dung phản hồi.');
      return;
    }

    const newStatus = actionType === 'resolve' ? 'Resolved' : 'Rejected';
    const newResolution = adminResponse.trim();

    try {
      const updatedReport = await reportService.updateReport(reportId, {
        Status: newStatus,
        Resolution: newResolution
      });

      const newUpdatedAt = updatedReport?.UpdatedAt || updatedReport?.updatedAt || new Date().toISOString();

      setReport(prev => prev ? {
        ...prev,
        status: newStatus,
        resolution: newResolution,
        updatedAt: newUpdatedAt
      } : null);

      if (report && report.reporterId) {
        const notification = {
          userId: report.reporterId,
          type: actionType === 'resolve' ? 'report_resolved' : 'report_rejected',
          title: actionType === 'resolve' ? 'Báo cáo của bạn đã được xử lý' : 'Báo cáo của bạn đã được xem xét',
          message: `Báo cáo #${reportId} của bạn về "${report.reason}" đã được ${actionType === 'resolve' ? 'xử lý' : 'xem xét'}. ${newResolution}`,
          data: {
            reportId: reportId,
            status: newStatus,
            resolution: newResolution
          }
        };
        addUserNotification(notification);
      }

      closeActionModal();
    } catch (err) {
      console.error('Error updating report:', err);
      setFormError('Không thể lưu phản hồi. Vui lòng thử lại.');
    }
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
          {report.resolution && (
            <div className="admin-response">
              <span className="response-label">Phản hồi từ admin:</span>
              <p>{report.resolution}</p>
            </div>
          )}
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
            {report.updatedAt && report.createdAt && report.updatedAt !== report.createdAt && (
              <div className="timeline-item">
                <div className="timeline-icon">🔄</div>
                <div className="timeline-content">
                  <h4>Cập nhật lần cuối</h4>
                  <p>{formatDateTime(report.updatedAt)}</p>
                </div>
              </div>
            )}
            {report.resolution && report.updatedAt && (
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

        {/* Actions */}
        {(report.status || '').toLowerCase() === 'pending' && (
          <div className="action-section">
            <button 
              className="action-btn resolve-btn"
              onClick={() => openActionModal('resolve')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Xử lý báo cáo
            </button>
            <button 
              className="action-btn reject-btn"
              onClick={() => openActionModal('reject')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Từ chối báo cáo
            </button>
          </div>
        )}
      </div>
      {isActionModalOpen && (
        <div className="action-modal-overlay">
          <div className="action-modal">
            <h3>{actionType === 'resolve' ? 'Nhập phản hồi xử lý' : 'Nhập lý do từ chối'}</h3>
            <p>Phản hồi này sẽ được lưu vào hệ thống và gửi đến người báo cáo.</p>
            <textarea
              rows={5}
              value={adminResponse}
              onChange={(e) => {
                setAdminResponse(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Ví dụ: Chúng tôi đã khóa tài khoản vi phạm trong 24 giờ..."
            />
            {formError && <div className="form-error">{formError}</div>}
            <div className="modal-actions">
              <button className="secondary-btn" onClick={closeActionModal}>Hủy</button>
              <button className="primary-btn" onClick={handleSubmitAction}>Lưu phản hồi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;