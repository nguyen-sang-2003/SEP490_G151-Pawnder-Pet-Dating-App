import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../shared/api';
import './styles/EventList.css';

/**
 * EventList Component
 * Displays all events with filters, search, and pagination
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'active', label: 'Đang diễn ra' },
  { value: 'submission_closed', label: 'Hết hạn nộp' },
  { value: 'voting_ended', label: 'Hết hạn vote' },
  { value: 'completed', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_BADGES = {
  upcoming: { label: 'Sắp diễn ra', className: 'upcoming' },
  active: { label: 'Đang diễn ra', className: 'active' },
  submission_closed: { label: 'Hết hạn nộp', className: 'submission-closed' },
  voting_ended: { label: 'Hết hạn vote', className: 'voting-ended' },
  completed: { label: 'Đã kết thúc', className: 'completed' },
  cancelled: { label: 'Đã hủy', className: 'cancelled' },
};

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setFeedback({ type: 'error', message: 'Không thể tải danh sách sự kiện.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Filter & Search
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // Sort by createdAt descending
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [filteredEvents]);

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(start, start + itemsPerPage);
  }, [sortedEvents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badge = STATUS_BADGES[status] || { label: status, className: 'default' };
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  return (
    <div className="event-list-page">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Sự kiện</h1>
        <button className="btn-primary" onClick={() => navigate('/events/create')}>
          + Tạo sự kiện
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sự kiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : sortedEvents.length === 0 ? (
        <div className="empty">Không có sự kiện nào.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên sự kiện</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Bài dự thi</th>
                  <th>Lượt vote</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((event) => (
                  <tr key={event.eventId}>
                    <td>
                      <div className="cell-main">{event.title}</div>
                      {event.description && (
                        <div className="cell-sub">{event.description.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td>{getStatusBadge(event.status)}</td>
                    <td>
                      <div className="timeline-cell">
                        <div>{formatDateTime(event.startTime)}</div>
                        <div className="timeline-separator">→</div>
                        <div>{formatDateTime(event.endTime)}</div>
                      </div>
                    </td>
                    <td className="text-center">{event.submissionCount || 0}</td>
                    <td className="text-center">{event.totalVotes || 0}</td>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/events/${event.eventId}`)}
                        >
                          👁
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹ Trước
              </button>
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Sau ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventList;
