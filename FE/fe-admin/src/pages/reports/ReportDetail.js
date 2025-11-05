import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportDetail.css';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id);

  // Dữ liệu báo cáo mẫu (trong thực tế sẽ fetch từ API)
  const reports = [
    {
      id: 1,
      reporter: {
        userId: 1,
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        username: 'john_doe',
        phone: '+84 123 456 789',
        avatar: null
      },
      reportedContent: {
        contentId: 101,
        message: 'Nội dung không phù hợp trong tin nhắn',
        type: 'chat',
        timestamp: '2024-01-14T20:30:00Z'
      },
      reportedUser: {
        userId: 2,
        fullName: 'Alice Wonder',
        email: 'alice.wonder@email.com',
        username: 'alice_wonder',
        phone: '+84 987 654 321',
        avatar: null
      },
      reason: 'Inappropriate behavior',
      description: 'Người dùng này đã gửi các tin nhắn với nội dung không phù hợp và có hành vi quấy rối qua ứng dụng.',
      status: 'Pending',
      resolution: null,
      createdAt: '2024-01-15T08:30:00Z',
      updatedAt: '2024-01-15T08:30:00Z',
      attachments: []
    },
    {
      id: 2,
      reporter: {
        userId: 3,
        fullName: 'Bob Smith',
        email: 'bob.smith@email.com',
        username: 'bob_smith',
        phone: '+84 555 123 456',
        avatar: null
      },
      reportedContent: {
        contentId: 102,
        message: 'Nội dung spam trong chat',
        type: 'chat',
        timestamp: '2024-02-19T15:20:00Z'
      },
      reportedUser: {
        userId: 4,
        fullName: 'Sarah Jones',
        email: 'sarah.jones@email.com',
        username: 'sarah_jones',
        phone: '+84 777 888 999',
        avatar: null
      },
      reason: 'Spam messages',
      description: 'Người dùng này liên tục gửi tin nhắn spam và quảng cáo không mong muốn.',
      status: 'Resolved',
      resolution: 'Đã cảnh báo người dùng và xóa nội dung không phù hợp. Tài khoản đã được đánh dấu để theo dõi.',
      createdAt: '2024-02-20T10:15:00Z',
      updatedAt: '2024-02-21T14:30:00Z',
      attachments: []
    },
    {
      id: 3,
      reporter: {
        userId: 2,
        fullName: 'Alice Wonder',
        email: 'alice.wonder@email.com',
        username: 'alice_wonder',
        phone: '+84 987 654 321',
        avatar: null
      },
      reportedContent: {
        contentId: 103,
        message: 'Hình ảnh không phù hợp',
        type: 'photo',
        timestamp: '2024-03-09T12:10:00Z'
      },
      reportedUser: {
        userId: 5,
        fullName: 'Mike Wilson',
        email: 'mike.wilson@email.com',
        username: 'mike_wilson',
        phone: '+84 333 444 555',
        avatar: null
      },
      reason: 'Inappropriate content',
      description: 'Người dùng đã chia sẻ hình ảnh không phù hợp trong hồ sơ thú cưng.',
      status: 'Rejected',
      resolution: 'Sau khi xem xét, không có bằng chứng vi phạm. Hình ảnh đã được kiểm tra và phù hợp với quy định cộng đồng.',
      createdAt: '2024-03-10T09:20:00Z',
      updatedAt: '2024-03-12T11:45:00Z',
      attachments: []
    },
    {
      id: 4,
      reporter: {
        userId: 4,
        fullName: 'Sarah Jones',
        email: 'sarah.jones@email.com',
        username: 'sarah_jones',
        phone: '+84 777 888 999',
        avatar: null
      },
      reportedContent: {
        contentId: 104,
        message: 'Quấy rối qua tin nhắn',
        type: 'chat',
        timestamp: '2024-10-24T18:45:00Z'
      },
      reportedUser: {
        userId: 1,
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        username: 'john_doe',
        phone: '+84 123 456 789',
        avatar: null
      },
      reason: 'Harassment',
      description: 'Người dùng này đã gửi nhiều tin nhắn quấy rối và có hành vi không phù hợp sau khi tôi từ chối kết nối.',
      status: 'Pending',
      resolution: null,
      createdAt: '2024-10-25T14:30:00Z',
      updatedAt: '2024-10-25T14:30:00Z',
      attachments: []
    },
    {
      id: 5,
      reporter: {
        userId: 5,
        fullName: 'Mike Wilson',
        email: 'mike.wilson@email.com',
        username: 'mike_wilson',
        phone: '+84 333 444 555',
        avatar: null
      },
      reportedContent: {
        contentId: 105,
        message: 'Thông tin giả mạo',
        type: 'profile',
        timestamp: '2024-09-14T10:20:00Z'
      },
      reportedUser: {
        userId: 3,
        fullName: 'Bob Smith',
        email: 'bob.smith@email.com',
        username: 'bob_smith',
        phone: '+84 555 123 456',
        avatar: null
      },
      reason: 'Fake information',
      description: 'Người dùng này đã cung cấp thông tin giả mạo về bản thân và thú cưng trong hồ sơ.',
      status: 'Resolved',
      resolution: 'Đã xác minh và cập nhật thông tin. Người dùng đã được yêu cầu cung cấp bằng chứng xác thực.',
      createdAt: '2024-09-15T16:45:00Z',
      updatedAt: '2024-09-18T10:20:00Z',
      attachments: []
    },
    {
      id: 6,
      reporter: {
        userId: 1,
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        username: 'john_doe',
        phone: '+84 123 456 789',
        avatar: null
      },
      reportedContent: {
        contentId: 106,
        message: 'Vi phạm quy tắc cộng đồng',
        type: 'chat',
        timestamp: '2024-10-27T16:30:00Z'
      },
      reportedUser: {
        userId: 6,
        fullName: 'Emma Brown',
        email: 'emma.brown@email.com',
        username: 'emma_brown',
        phone: '+84 111 222 333',
        avatar: null
      },
      reason: 'Community guidelines violation',
      description: 'Người dùng này đã vi phạm quy tắc cộng đồng bằng cách sử dụng ngôn từ không phù hợp và có hành vi gây rối.',
      status: 'Pending',
      resolution: null,
      createdAt: '2024-10-28T08:15:00Z',
      updatedAt: '2024-10-28T08:15:00Z',
      attachments: []
    },
    {
      id: 7,
      reporter: {
        userId: 2,
        fullName: 'Alice Wonder',
        email: 'alice.wonder@email.com',
        username: 'alice_wonder',
        phone: '+84 987 654 321',
        avatar: null
      },
      reportedContent: {
        contentId: 107,
        message: 'Nội dung lừa đảo',
        type: 'chat',
        timestamp: '2024-08-19T14:15:00Z'
      },
      reportedUser: {
        userId: 7,
        fullName: 'David Lee',
        email: 'david.lee@email.com',
        username: 'david_lee',
        phone: '+84 444 555 666',
        avatar: null
      },
      reason: 'Scam',
      description: 'Người dùng này đã cố gắng lừa đảo bằng cách yêu cầu thanh toán trước khi gặp mặt và không cung cấp thông tin thực.',
      status: 'Resolved',
      resolution: 'Đã khóa tài khoản và báo cáo cho cơ quan chức năng. Tất cả thông tin liên quan đã được lưu trữ.',
      createdAt: '2024-08-20T12:30:00Z',
      updatedAt: '2024-08-22T15:00:00Z',
      attachments: []
    },
    {
      id: 8,
      reporter: {
        userId: 3,
        fullName: 'Bob Smith',
        email: 'bob.smith@email.com',
        username: 'bob_smith',
        phone: '+84 555 123 456',
        avatar: null
      },
      reportedContent: {
        contentId: 108,
        message: 'Ngôn từ không phù hợp',
        type: 'chat',
        timestamp: '2024-07-09T11:45:00Z'
      },
      reportedUser: {
        userId: 8,
        fullName: 'Lisa Chen',
        email: 'lisa.chen@email.com',
        username: 'lisa_chen',
        phone: '+84 999 888 777',
        avatar: null
      },
      reason: 'Offensive language',
      description: 'Người dùng này đã sử dụng ngôn từ không phù hợp và có tính xúc phạm trong các tin nhắn.',
      status: 'Rejected',
      resolution: 'Sau khi xem xét, không đủ bằng chứng về vi phạm. Ngôn từ được sử dụng trong ngữ cảnh phù hợp.',
      createdAt: '2024-07-10T11:20:00Z',
      updatedAt: '2024-07-12T13:45:00Z',
      attachments: []
    }
  ];

  // Lấy report từ danh sách
  const initialReport = reports.find(r => r.id === reportId);
  
  // Đọc status từ localStorage nếu có
  const getReportStatus = () => {
    const savedStatus = localStorage.getItem(`report_status_${reportId}`);
    if (savedStatus) {
      return savedStatus;
    }
    return initialReport ? initialReport.status : 'Pending';
  };

  const [reportStatus, setReportStatus] = useState(getReportStatus());
  const [report, setReport] = useState(initialReport ? {
    ...initialReport,
    status: reportStatus
  } : null);

  // Cập nhật report khi status thay đổi
  useEffect(() => {
    if (report) {
      setReport({
        ...report,
        status: reportStatus
      });
    }
  }, [reportStatus]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

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
    
    // Lưu status vào localStorage
    localStorage.setItem(`report_status_${reportId}`, newStatus);
    localStorage.setItem(`report_resolution_${reportId}`, newResolution);
    localStorage.setItem(`report_updatedAt_${reportId}`, new Date().toISOString());
    
    // Cập nhật state
    setReportStatus(newStatus);
    setReport({
      ...report,
      status: newStatus,
      resolution: newResolution,
      updatedAt: new Date().toISOString()
    });
  };

  const handleReject = () => {
    const newStatus = 'Rejected';
    const newResolution = 'Báo cáo đã bị từ chối.';
    
    // Lưu status vào localStorage
    localStorage.setItem(`report_status_${reportId}`, newStatus);
    localStorage.setItem(`report_resolution_${reportId}`, newResolution);
    localStorage.setItem(`report_updatedAt_${reportId}`, new Date().toISOString());
    
    // Cập nhật state
    setReportStatus(newStatus);
    setReport({
      ...report,
      status: newStatus,
      resolution: newResolution,
      updatedAt: new Date().toISOString()
    });
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