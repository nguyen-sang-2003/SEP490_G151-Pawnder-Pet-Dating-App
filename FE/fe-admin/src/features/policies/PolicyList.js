import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { policyService } from '../../shared/api';
import './styles/PolicyList.css';

const PolicyList = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requireFilter, setRequireFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policyCode: '',
    policyName: '',
    description: '',
    displayOrder: 1,
    requireConsent: true,
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesData, statsData] = await Promise.all([
        policyService.getAllPolicies(),
        policyService.getAcceptStats(),
      ]);
      setPolicies(Array.isArray(policiesData) ? policiesData : []);
      setStats(Array.isArray(statsData) ? statsData : []);
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

  // Filter & Search
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        p.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.policyCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);
      const matchRequire =
        requireFilter === 'all' ||
        (requireFilter === 'yes' && p.requireConsent) ||
        (requireFilter === 'no' && !p.requireConsent);
      return matchSearch && matchStatus && matchRequire;
    });
  }, [policies, searchTerm, statusFilter, requireFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, requireFilter]);

  // Get stat
  const getStat = (policyId) => stats.find((s) => s.policyId === policyId) || {};

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.policyCode.trim() || !formData.policyName.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }
    try {
      // Backend có thể dùng PascalCase
      await policyService.createPolicy({
        PolicyCode: formData.policyCode.trim().toUpperCase(),
        PolicyName: formData.policyName.trim(),
        Description: formData.description.trim(),
        DisplayOrder: parseInt(formData.displayOrder) || 1,
        RequireConsent: formData.requireConsent,
      });
      setFeedback({ type: 'success', message: 'Tạo Policy thành công!' });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tạo Policy.' });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.policyName.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập tên Policy.' });
      return;
    }
    try {
      // Backend có thể dùng PascalCase
      await policyService.updatePolicy(editingPolicy.policyId, {
        PolicyName: formData.policyName.trim(),
        Description: formData.description.trim(),
        DisplayOrder: parseInt(formData.displayOrder) || 1,
        RequireConsent: formData.requireConsent,
        IsActive: editingPolicy.isActive,
      });
      setFeedback({ type: 'success', message: 'Cập nhật thành công!' });
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể cập nhật.' });
    }
  };

  const handleDelete = async (policy) => {
    if (!window.confirm(`Xóa Policy "${policy.policyName}"?`)) return;
    try {
      await policyService.deletePolicy(policy.policyId);
      setFeedback({ type: 'success', message: 'Đã xóa Policy!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể xóa.' });
    }
  };

  const handleToggleActive = async (policy) => {
    console.log('Policy object:', policy); // Debug
    try {
      // Backend C# dùng PascalCase
      const requestBody = {
        PolicyName: policy.policyName || policy.PolicyName,
        Description: policy.description || policy.Description || '',
        DisplayOrder: policy.displayOrder || policy.DisplayOrder || 1,
        RequireConsent: policy.requireConsent ?? policy.RequireConsent ?? true,
        IsActive: !(policy.isActive ?? policy.IsActive),
      };
      console.log('Request body:', requestBody); // Debug

      await policyService.updatePolicy(policy.policyId || policy.PolicyId, requestBody);
      setFeedback({
        type: 'success',
        message: `Đã ${policy.isActive ? 'tắt' : 'bật'} Policy!`,
      });
      fetchData();
    } catch (err) {
      console.error('Toggle active error:', err);
      setFeedback({ type: 'error', message: err.message || 'Lỗi cập nhật.' });
    }
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policyCode: policy.policyCode,
      policyName: policy.policyName,
      description: policy.description || '',
      displayOrder: policy.displayOrder || 1,
      requireConsent: policy.requireConsent ?? true,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      policyCode: '',
      policyName: '',
      description: '',
      displayOrder: 1,
      requireConsent: true,
    });
    setEditingPolicy(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="policy-list-page">
      {/* Header */}
      <div className="page-header">
        <h1>Danh sách Policy</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Tạo Policy mới
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
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đã tắt</option>
          </select>
          <select value={requireFilter} onChange={(e) => setRequireFilter(e.target.value)}>
            <option value="all">Tất cả loại</option>
            <option value="yes">Bắt buộc</option>
            <option value="no">Không bắt buộc</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredPolicies.length === 0 ? (
        <div className="empty">Không có Policy nào.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên Policy</th>
                  <th>Mã</th>
                  <th>Trạng thái</th>
                  <th>Bắt buộc</th>
                  <th>Version hiện tại</th>
                  <th>Tỷ lệ Accept</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPolicies.map((policy) => {
                  const stat = getStat(policy.policyId);
                  return (
                    <tr key={policy.policyId}>
                      <td>
                        <div className="cell-main">{policy.policyName}</div>
                        {policy.description && (
                          <div className="cell-sub">{policy.description}</div>
                        )}
                      </td>
                      <td>
                        <code>{policy.policyCode}</code>
                      </td>
                      <td>
                        <span className={`badge ${policy.isActive ? 'active' : 'inactive'}`}>
                          {policy.isActive ? 'Đang bật' : 'Đã tắt'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${policy.requireConsent ? 'required' : 'optional'}`}>
                          {policy.requireConsent ? 'Có' : 'Không'}
                        </span>
                      </td>
                      <td>
                        {policy.activeVersion ? (
                          <span>v{policy.activeVersion.versionNumber}</span>
                        ) : (
                          <span className="text-muted">Chưa có</span>
                        )}
                      </td>
                      <td>
                        {stat.acceptRate !== undefined ? (
                          <div className="rate-cell">
                            <div className="rate-bar">
                              <div
                                className="rate-fill"
                                style={{ width: `${stat.acceptRate}%` }}
                              />
                            </div>
                            <span>{stat.acceptRate?.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn-icon"
                            title="Xem chi tiết"
                            onClick={() => navigate(`/policies/${policy.policyId}`)}
                          >
                            👁
                          </button>
                          <button
                            className="btn-icon"
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(policy)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            title={policy.isActive ? 'Tắt' : 'Bật'}
                            onClick={() => handleToggleActive(policy)}
                          >
                            {policy.isActive ? '🔴' : '🟢'}
                          </button>
                          <button
                            className="btn-icon delete"
                            title="Xóa"
                            onClick={() => handleDelete(policy)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo Policy mới</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mã Policy *</label>
                  <input
                    type="text"
                    value={formData.policyCode}
                    onChange={(e) =>
                      setFormData({ ...formData, policyCode: e.target.value.toUpperCase() })
                    }
                    placeholder="VD: TERMS_OF_SERVICE"
                  />
                </div>
                <div className="form-group small">
                  <label>Thứ tự</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: e.target.value })
                    }
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tên Policy *</label>
                <input
                  type="text"
                  value={formData.policyName}
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                  placeholder="VD: Điều khoản sử dụng"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn..."
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requireConsent}
                    onChange={(e) =>
                      setFormData({ ...formData, requireConsent: e.target.checked })
                    }
                  />
                  Yêu cầu User xác nhận
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa Policy</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mã Policy</label>
                  <input type="text" value={formData.policyCode} disabled />
                </div>
                <div className="form-group small">
                  <label>Thứ tự</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: e.target.value })
                    }
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tên Policy *</label>
                <input
                  type="text"
                  value={formData.policyName}
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requireConsent}
                    onChange={(e) =>
                      setFormData({ ...formData, requireConsent: e.target.checked })
                    }
                  />
                  Yêu cầu User xác nhận
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyList;
