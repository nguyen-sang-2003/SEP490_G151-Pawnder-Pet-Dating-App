import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../../shared/api';
import './styles/EventDetail.css';

/**
 * EventDetail Component
 * Displays event details, submissions, and leaderboard
 * Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5
 */

const STATUS_BADGES = {
  upcoming: { label: 'Sắp diễn ra', className: 'upcoming' },
  active: { label: 'Đang diễn ra', className: 'active' },
  submission_closed: { label: 'Hết hạn nộp', className: 'submission-closed' },
  voting_ended: { label: 'Hết hạn vote', className: 'voting-ended' },
  completed: { label: 'Đã kết thúc', className: 'completed' },
  cancelled: { label: 'Đã hủy', className: 'cancelled' },
};

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch event data
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(id);
      setEvent(data);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể tải thông tin sự kiện.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const data = await eventService.getLeaderboard(id);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Format date
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badge = STATUS_BADGES[status] || { label: status, className: 'default' };
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  // Handle cancel event
  const handleCancel = async () => {
    try {
      setCancelling(true);
      await eventService.cancelEvent(id, cancelReason.trim() || null);
      setFeedback({ type: 'success', message: 'Đã hủy sự kiện thành công!' });
      setShowCancelModal(false);
      setCancelReason('');
      fetchEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể hủy sự kiện.' });
    } finally {
      setCancelling(false);
    }
  };

  // Check if can cancel
  const canCancel = event && !['completed', 'cancelled'].includes(event.status);

  // Get submissions sorted by vote count
  const sortedSubmissions = useMemo(() => {
    if (!event?.submissions) return [];
    return [...event.submissions].sort((a, b) => b.voteCount - a.voteCount);
  }, [event?.submissions]);

  // Get winners (top 3)
  const winners = useMemo(() => {
    if (!event?.winners) return sortedSubmissions.slice(0, 3);
    return event.winners;
  }, [event?.winners, sortedSubmissions]);

  if (loading) {
    return <div className="event-detail-page"><div className="loading">Đang tải...</div></div>;
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <div className="error-state">
          <p>Không tìm thấy sự kiện</p>
          <button className="btn-primary" onClick={() => navigate('/events')}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/events')}>
          ← Quay lại
        </button>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate(`/events/${id}/edit`)}>
            ✏️ Chỉnh sửa
          </button>
          {canCancel && (
            <button className="btn-danger" onClick={() => setShowCancelModal(true)}>
              🚫 Hủy sự kiện
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Event Info */}
      <div className="event-info-card">
        <div className="event-header">
          {event.coverImageUrl && (
            <div className="cover-image">
              <img src={event.coverImageUrl} alt={event.title} />
            </div>
          )}
          <div className="event-meta">
            <div className="title-row">
              <h1>{event.title}</h1>
              {getStatusBadge(event.status)}
            </div>
            {event.description && <p className="description">{event.description}</p>}
          </div>
        </div>

        <div className="event-details">
          <div className="detail-row">
            <span className="label">📅 Bắt đầu:</span>
            <span className="value">{formatDateTime(event.startTime)}</span>
          </div>
          <div className="detail-row">
            <span className="label">⏰ Hạn nộp:</span>
            <span className="value">{formatDateTime(event.submissionDeadline)}</span>
          </div>
          <div className="detail-row">
            <span className="label">🏁 Kết thúc:</span>
            <span className="value">{formatDateTime(event.endTime)}</span>
          </div>
          {(event.prizeDescription || event.prizePoints > 0) && (
            <div className="detail-row">
              <span className="label">🏆 Giải thưởng:</span>
              <span className="value">
                {event.prizeDescription || `${event.prizePoints} điểm`}
              </span>
            </div>
          )}
        </div>

        <div className="event-stats">
          <div className="stat-item">
            <span className="stat-value">{event.submissionCount || 0}</span>
            <span className="stat-label">Bài dự thi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{event.totalVotes || 0}</span>
            <span className="stat-label">Lượt vote</span>
          </div>
        </div>
      </div>

      {/* Winners Section (for completed events) */}
      {event.status === 'completed' && winners.length > 0 && (
        <div className="winners-section">
          <h2>🏆 Top 3 Người thắng cuộc</h2>
          <div className="winners-grid">
            {winners.slice(0, 3).map((submission, index) => (
              <div key={submission.submissionId} className={`winner-card rank-${index + 1}`}>
                <div className="rank-badge">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="winner-image">
                  <img src={submission.thumbnailUrl || submission.mediaUrl} alt={submission.petName} />
                </div>
                <div className="winner-info">
                  <div className="pet-name">{submission.petName || 'Pet'}</div>
                  <div className="owner-name">{submission.userName || 'User'}</div>
                  <div className="vote-count">❤️ {submission.voteCount} votes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Bài dự thi ({event.submissionCount || 0})
        </button>
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Bảng xếp hạng
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'submissions' ? (
          sortedSubmissions.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ảnh</th>
                    <th>Pet</th>
                    <th>Chủ nhân</th>
                    <th>Votes</th>
                    <th>Ngày nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubmissions.map((sub, index) => (
                    <tr key={sub.submissionId} className={index < 3 && event.status === 'completed' ? 'top-3' : ''}>
                      <td>{index + 1}</td>
                      <td>
                        <div 
                          className="thumbnail clickable" 
                          onClick={() => setSelectedSubmission(sub)}
                          title="Nhấn để xem chi tiết"
                        >
                          <img src={sub.thumbnailUrl || sub.mediaUrl} alt={sub.petName} />
                          {sub.mediaType === 'video' && <span className="video-badge">▶</span>}
                        </div>
                      </td>
                      <td>
                        <div className="cell-main">{sub.petName || 'Pet'}</div>
                      </td>
                      <td>{sub.userName || 'User'}</td>
                      <td className="text-center">{sub.voteCount}</td>
                      <td>{formatDateTime(sub.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Chưa có bài dự thi nào.</div>
          )
        ) : (
          leaderboard.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Ảnh</th>
                    <th>Pet</th>
                    <th>Chủ nhân</th>
                    <th>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.submission.submissionId} className={item.rank <= 3 ? 'top-3' : ''}>
                      <td>
                        <span className={`rank rank-${item.rank}`}>
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                        </span>
                      </td>
                      <td>
                        <div 
                          className="thumbnail clickable"
                          onClick={() => setSelectedSubmission(item.submission)}
                          title="Nhấn để xem chi tiết"
                        >
                          <img src={item.submission.thumbnailUrl || item.submission.mediaUrl} alt={item.submission.petName} />
                        </div>
                      </td>
                      <td>{item.submission.petName || 'Pet'}</td>
                      <td>{item.submission.userName || 'User'}</td>
                      <td className="text-center">{item.submission.voteCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Chưa có dữ liệu xếp hạng.</div>
          )
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hủy sự kiện</h2>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn hủy sự kiện "<strong>{event.title}</strong>"?</p>
              <p className="warning-text">Hành động này không thể hoàn tác.</p>
              <div className="form-group">
                <label>Lý do hủy (tùy chọn)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy sự kiện..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Không
              </button>
              <button className="btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal submission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết bài dự thi</h2>
              <button className="modal-close" onClick={() => setSelectedSubmission(null)}>✕</button>
            </div>
            <div className="modal-body submission-detail">
              <div className="submission-media">
                {selectedSubmission.mediaType === 'video' ? (
                  <video 
                    src={selectedSubmission.mediaUrl} 
                    controls 
                    autoPlay
                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                  />
                ) : (
                  <img 
                    src={selectedSubmission.mediaUrl} 
                    alt={selectedSubmission.petName}
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                  />
                )}
              </div>
              <div className="submission-info">
                <div className="info-row">
                  <div className="pet-avatar">
                    {selectedSubmission.petPhotoUrl ? (
                      <img src={selectedSubmission.petPhotoUrl} alt={selectedSubmission.petName} />
                    ) : (
                      <span className="avatar-placeholder">🐾</span>
                    )}
                  </div>
                  <div className="pet-details">
                    <div className="pet-name">{selectedSubmission.petName || 'Pet'}</div>
                    <div className="owner-name">👤 {selectedSubmission.userName || 'User'}</div>
                  </div>
                  <div className="vote-badge">
                    ❤️ {selectedSubmission.voteCount} votes
                  </div>
                </div>
                {selectedSubmission.caption && (
                  <div className="caption">
                    <strong>Mô tả:</strong> {selectedSubmission.caption}
                  </div>
                )}
                <div className="meta">
                  <span>📅 Ngày nộp: {formatDateTime(selectedSubmission.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
