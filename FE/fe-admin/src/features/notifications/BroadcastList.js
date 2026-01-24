import React, { useEffect, useState, useMemo } from 'react';
import { notificationService } from '../../shared/api';
import './styles/BroadcastList.css';

const BroadcastList = () => {
  const [drafts, setDrafts] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('drafts');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'admin_broadcast' });
  const [sending, setSending] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [draftsData, sentData] = await Promise.all([
        notificationService.getBroadcastDrafts(),
        notificationService.getSentBroadcasts(),
      ]);
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
      setSentList(Array.isArray(sentData) ? sentData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setFeedback({ type: 'error', message: 'Không thể tải dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const currentList = activeTab === 'drafts' ? drafts : sentList;
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return currentList.slice(start, start + itemsPerPage);
  }, [currentList, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }
    try {
      await notificationService.createBroadcastDraft({
        Title: formData.title.trim(),
        Message: formData.message.trim(),
        Type: formData.type || 'admin_broadcast',
      });
      setFeedback({ type: 'success', message: 'Tạo bản nháp thành công!' });
      closeModal();
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tạo bản nháp.' });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }
    try {
      await notificationService.updateBroadcastDraft(editingItem.notificationId, {
        Title: formData.title.trim(),
        Message: formData.message.trim(),
        Type: formData.type || 'admin_broadcast',
      });
      setFeedback({ type: 'success', message: 'Cập nhật thành công!' });
      closeModal();
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể cập nhật.' });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa bản nháp "${item.title}"?`)) return;
    try {
      await notificationService.deleteBroadcastDraft(item.notificationId);
      setFeedback({ type: 'success', message: 'Đã xóa bản nháp!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể xóa.' });
    }
  };

  const handleSend = async (item) => {
    if (!window.confirm(`Gửi thông báo "${item.title}" đến tất cả người dùng?`)) return;
    try {
      setSending(true);
      const result = await notificationService.sendBroadcast(item.notificationId);
      setFeedback({ 
        type: 'success', 
        message: result.message || `Đã gửi thông báo đến ${result.sentCount} người dùng!` 
      });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể gửi thông báo.' });
    } finally {
      setSending(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ title: '', message: '', type: 'admin_broadcast' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      message: item.message || '',
      type: item.type || 'admin_broadcast',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ title: '', message: '', type: 'admin_broadcast' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <div className="broadcast-page">
      {/* Header */}
      <div className="broadcast-header">
        <div>
          <h1>Thông báo hệ thống</h1>
          <p className="subtitle">Quản lý và gửi thông báo đến người dùng</p>
        </div>
        <button className="btn-create" onClick={openCreateModal}>
          Tạo thông báo
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          Bản nháp <span className="count">{drafts.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Đã gửi <span className="count">{sentList.length}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <p>{activeTab === 'drafts' ? 'Chưa có bản nháp nào' : 'Chưa có thông báo nào được gửi'}</p>
          {activeTab === 'drafts' && (
            <button className="btn-create-empty" onClick={openCreateModal}>
              Tạo thông báo đầu tiên
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Nội dung</th>
                  <th>Người tạo</th>
                  <th>{activeTab === 'drafts' ? 'Ngày tạo' : 'Ngày gửi'}</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((item) => (
                  <tr key={item.notificationId}>
                    <td>
                      <span className="title-text">{item.title}</span>
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status === 'DRAFT' ? 'Nháp' : 'Đã gửi'}
                      </span>
                    </td>
                    <td>
                      <span className="message-text">
                        {item.message?.length > 80 
                          ? item.message.substring(0, 80) + '...' 
                          : item.message}
                      </span>
                    </td>
                    <td>{item.createdByUserName || '-'}</td>
                    <td>{formatDate(activeTab === 'drafts' ? item.createdAt : item.sentAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {activeTab === 'drafts' ? (
                          <>
                            <button
                              className="btn-action btn-send"
                              onClick={() => handleSend(item)}
                              disabled={sending}
                            >
                              Gửi
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => openEditModal(item)}
                            >
                              Sửa
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(item)}
                            >
                              Xóa
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn-action btn-view" 
                            onClick={() => openEditModal(item)}
                          >
                            Xem
                          </button>
                        )}
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
                Trước
              </button>
              <span>Trang {currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingItem 
                  ? (activeTab === 'sent' ? 'Chi tiết thông báo' : 'Chỉnh sửa thông báo') 
                  : 'Tạo thông báo mới'}
              </h2>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={editingItem && activeTab !== 'sent' ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo"
                  disabled={activeTab === 'sent'}
                />
              </div>
              <div className="form-group">
                <label>Nội dung</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Nhập nội dung thông báo"
                  rows={6}
                  disabled={activeTab === 'sent'}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  {activeTab === 'sent' ? 'Đóng' : 'Hủy'}
                </button>
                {activeTab !== 'sent' && (
                  <button type="submit" className="btn-submit">
                    {editingItem ? 'Lưu thay đổi' : 'Tạo bản nháp'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastList;
