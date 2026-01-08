import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { badWordService } from '../../shared/api';
import './styles/BadWordManagement.css';

const LEVEL_OPTIONS = [
  { value: 1, label: 'Nhẹ (Level 1)', description: 'Che từ ***' },
  { value: 2, label: 'Nặng (Level 2)', description: 'Chặn tin nhắn' },
  { value: 3, label: 'Rất nghiêm trọng (Level 3)', description: 'Chặn + Cảnh báo' },
];

const CATEGORY_OPTIONS = [
  { value: 'Thô tục', label: 'Thô tục' },
  { value: 'Scam', label: 'Lừa đảo/Scam' },
  { value: 'Spam', label: 'Spam' },
  { value: 'Khác', label: 'Khác' },
];

const defaultForm = {
  word: '',
  isRegex: false,
  level: 1,
  category: 'Thô tục',
  isActive: true,
};

const BadWordList = () => {
  const navigate = useNavigate();
  const [badWords, setBadWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [reloadingCache, setReloadingCache] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBadWords = async () => {
    setLoading(true);
    try {
      const data = await badWordService.getBadWords();
      setBadWords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bad words:', err);
      setFeedback({ type: 'error', message: 'Không thể tải danh sách từ cấm.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadWords();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Stats
  const stats = useMemo(() => {
    const total = badWords.length;
    const active = badWords.filter(bw => bw.isActive).length;
    const level1 = badWords.filter(bw => bw.level === 1).length;
    const level2 = badWords.filter(bw => bw.level === 2).length;
    const level3 = badWords.filter(bw => bw.level === 3).length;
    const regex = badWords.filter(bw => bw.isRegex).length;
    return { total, active, level1, level2, level3, regex };
  }, [badWords]);

  // Filter and search
  const filteredBadWords = useMemo(() => {
    let result = badWords;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(bw =>
        bw.word.toLowerCase().includes(term) ||
        (bw.category && bw.category.toLowerCase().includes(term))
      );
    }

    if (filterLevel) {
      result = result.filter(bw => bw.level === parseInt(filterLevel));
    }

    if (filterCategory) {
      result = result.filter(bw => bw.category === filterCategory);
    }

    if (filterStatus) {
      const isActive = filterStatus === 'active';
      result = result.filter(bw => bw.isActive === isActive);
    }

    return result;
  }, [badWords, searchTerm, filterLevel, filterCategory, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredBadWords.length / itemsPerPage);
  const paginatedBadWords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBadWords.slice(start, start + itemsPerPage);
  }, [filteredBadWords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLevel, filterCategory, filterStatus]);

  // Handlers
  const handleReloadCache = async () => {
    setReloadingCache(true);
    try {
      await badWordService.reloadBadWordCache();
      setFeedback({ type: 'success', message: '✓ Đã reload cache thành công!' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể reload cache.' });
    } finally {
      setReloadingCache(false);
    }
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (badWord) => {
    setForm({
      word: badWord.word,
      isRegex: badWord.isRegex,
      level: badWord.level,
      category: badWord.category || 'Thô tục',
      isActive: badWord.isActive,
    });
    setEditingId(badWord.badWordId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.word.trim()) {
      setFeedback({ type: 'error', message: 'Từ cấm không được để trống.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        Word: form.word.trim(),
        IsRegex: form.isRegex,
        Level: form.level,
        Category: form.category,
        IsActive: form.isActive,
      };

      if (editingId) {
        await badWordService.updateBadWord(editingId, payload);
        setFeedback({ type: 'success', message: '✓ Đã cập nhật từ cấm.' });
      } else {
        await badWordService.createBadWord(payload);
        setFeedback({ type: 'success', message: '✓ Đã thêm từ cấm mới.' });
      }

      handleCloseModal();
      fetchBadWords();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể lưu từ cấm.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await badWordService.deleteBadWord(deleteConfirm.badWordId);
      setFeedback({ type: 'success', message: '✓ Đã xóa từ cấm.' });
      setDeleteConfirm(null);
      fetchBadWords();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể xóa từ cấm.' });
    }
  };

  const handleToggleActive = async (badWord) => {
    try {
      await badWordService.updateBadWord(badWord.badWordId, {
        Word: badWord.word,
        IsRegex: badWord.isRegex,
        Level: badWord.level,
        Category: badWord.category,
        IsActive: !badWord.isActive,
      });
      setFeedback({ 
        type: 'success', 
        message: `✓ Đã ${badWord.isActive ? 'tắt' : 'bật'} từ cấm.` 
      });
      fetchBadWords();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể cập nhật trạng thái.' });
    }
  };

  const getLevelLabel = (level) => {
    const opt = LEVEL_OPTIONS.find(o => o.value === level);
    return opt ? opt.label : `Level ${level}`;
  };

  return (
    <div className="badword-page">
      {/* Header */}
      <div className="page-header">
        <h1>🚫 Quản lý từ cấm</h1>
        <div className="header-actions">
          <button 
            className="btn-warning" 
            onClick={handleReloadCache}
            disabled={reloadingCache}
          >
            {reloadingCache ? (
              <><span className="loading-spinner"></span> Đang reload...</>
            ) : (
              <>🔄 Reload Cache</>
            )}
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            + Thêm từ cấm
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Tổng số</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card level-1">
          <div className="stat-value">{stats.level1}</div>
          <div className="stat-label">Level 1</div>
        </div>
        <div className="stat-card level-2">
          <div className="stat-value">{stats.level2}</div>
          <div className="stat-label">Level 2</div>
        </div>
        <div className="stat-card level-3">
          <div className="stat-value">{stats.level3}</div>
          <div className="stat-label">Level 3</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.regex}</div>
          <div className="stat-label">Regex</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm từ cấm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">Tất cả Level</option>
            {LEVEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">
          <span className="loading-spinner"></span> Đang tải...
        </div>
      ) : filteredBadWords.length === 0 ? (
        <div className="empty">
          {searchTerm || filterLevel || filterCategory || filterStatus
            ? 'Không tìm thấy từ cấm phù hợp.'
            : 'Chưa có từ cấm nào. Nhấn "Thêm từ cấm" để bắt đầu.'}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Từ cấm</th>
                  <th>Level</th>
                  <th>Danh mục</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBadWords.map((bw) => (
                  <tr key={bw.badWordId}>
                    <td>
                      <span className={`word-cell ${bw.isRegex ? 'regex' : ''}`}>
                        {bw.word}
                      </span>
                    </td>
                    <td>
                      <span className={`badge level-${bw.level}`}>
                        {getLevelLabel(bw.level)}
                      </span>
                    </td>
                    <td>{bw.category || '-'}</td>
                    <td>
                      {bw.isRegex ? (
                        <span className="badge regex">Regex</span>
                      ) : (
                        <span className="text-muted">Text</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${bw.isActive ? 'active' : 'inactive'}`}>
                        {bw.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/badwords/${bw.badWordId}`)}
                        >
                          👁
                        </button>
                        <button
                          className="btn-icon"
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(bw)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title={bw.isActive ? 'Tắt' : 'Bật'}
                          onClick={() => handleToggleActive(bw)}
                        >
                          {bw.isActive ? '🔴' : '🟢'}
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Xóa"
                          onClick={() => setDeleteConfirm(bw)}
                        >
                          🗑️
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
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ‹ Trước
              </button>
              <span>Trang {currentPage} / {totalPages} ({filteredBadWords.length} từ)</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Sau ›
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Chỉnh sửa từ cấm' : 'Thêm từ cấm mới'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Từ cấm *</label>
                <input
                  type="text"
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="Nhập từ cấm..."
                  autoFocus
                />
                {form.isRegex && (
                  <div className="hint">💡 Đang ở chế độ Regex. Ví dụ: \\b(từ1|từ2)\\b</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mức độ</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
                  >
                    {LEVEL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isRegex}
                    onChange={(e) => setForm({ ...form, isRegex: e.target.checked })}
                  />
                  Sử dụng Regex (biểu thức chính quy)
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Kích hoạt ngay
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="icon">⚠️</div>
              <h3>Xác nhận xóa</h3>
              <p>
                Bạn có chắc muốn xóa từ cấm "<strong>{deleteConfirm.word}</strong>"?
                <br />Hành động này không thể hoàn tác.
              </p>
              <div className="actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Hủy
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadWordList;
