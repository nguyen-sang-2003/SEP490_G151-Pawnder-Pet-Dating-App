import React, { useEffect, useState, useMemo } from 'react';
import { badWordService } from '../../shared/api';
import './styles/BadWordManagement.css';

const LEVEL_OPTIONS = [
  { value: 1, label: 'Nhẹ (Level 1) - Che từ ***' },
  { value: 2, label: 'Nặng (Level 2) - Chặn tin nhắn' },
  { value: 3, label: 'Rất nghiêm trọng (Level 3) - Chặn tin nhắn' },
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

const BadWordManagement = () => {
  const [badWords, setBadWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [reloadingCache, setReloadingCache] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBadWords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await badWordService.getBadWords();
      setBadWords(data || []);
    } catch (err) {
      console.error('Error fetching bad words:', err);
      setError('Không thể tải danh sách từ cấm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadWords();
  }, []);

  // Filter and search
  const filteredBadWords = useMemo(() => {
    let result = badWords;

    if (searchTerm) {
      result = result.filter((bw) =>
        bw.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel) {
      result = result.filter((bw) => bw.level === parseInt(filterLevel));
    }

    if (filterCategory) {
      result = result.filter((bw) => bw.category === filterCategory);
    }

    return result;
  }, [badWords, searchTerm, filterLevel, filterCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredBadWords.length / itemsPerPage);
  const paginatedBadWords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBadWords.slice(start, start + itemsPerPage);
  }, [filteredBadWords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLevel, filterCategory]);

  const handleOpenModal = (badWord = null) => {
    if (badWord) {
      setForm({
        word: badWord.word,
        isRegex: badWord.isRegex,
        level: badWord.level,
        category: badWord.category || 'Thô tục',
        isActive: badWord.isActive,
      });
      setEditingId(badWord.badWordId);
    } else {
      setForm(defaultForm);
      setEditingId(null);
    }
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
        setFeedback({ type: 'success', message: 'Đã cập nhật từ cấm.' });
      } else {
        await badWordService.createBadWord(payload);
        setFeedback({ type: 'success', message: 'Đã thêm từ cấm mới.' });
      }

      handleCloseModal();
      fetchBadWords();
    } catch (err) {
      console.error('Save bad word failed:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể lưu từ cấm.',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa từ cấm này?')) return;

    try {
      await badWordService.deleteBadWord(id);
      setFeedback({ type: 'success', message: 'Đã xóa từ cấm.' });
      fetchBadWords();
    } catch (err) {
      console.error('Delete bad word failed:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể xóa từ cấm.',
      });
    }
  };

  const handleReloadCache = async () => {
    setReloadingCache(true);
    try {
      await badWordService.reloadCache();
      setFeedback({ type: 'success', message: 'Đã reload cache từ cấm.' });
    } catch (err) {
      console.error('Reload cache failed:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể reload cache.',
      });
    } finally {
      setReloadingCache(false);
    }
  };

  const getLevelLabel = (level) => {
    const option = LEVEL_OPTIONS.find((o) => o.value === level);
    return option ? option.label : `Level ${level}`;
  };

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 1:
        return 'badge-level-1';
      case 2:
        return 'badge-level-2';
      case 3:
        return 'badge-level-3';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="badword-management">
      <div className="page-header">
        <h1>Quản lý từ cấm</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleReloadCache}
            disabled={reloadingCache}
          >
            {reloadingCache ? 'Đang reload...' : '🔄 Reload Cache'}
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            + Thêm từ cấm
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

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
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">Tất cả mức độ</option>
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Level {opt.value}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : filteredBadWords.length === 0 ? (
        <div className="empty">Không có từ cấm nào.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Từ cấm</th>
                  <th>Regex</th>
                  <th>Mức độ</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBadWords.map((bw) => (
                  <tr key={bw.badWordId}>
                    <td>
                      <code>{bw.word}</code>
                    </td>
                    <td>{bw.isRegex ? '✓' : '-'}</td>
                    <td>
                      <span className={`badge ${getLevelBadgeClass(bw.level)}`}>
                        Level {bw.level}
                      </span>
                    </td>
                    <td>{bw.category || '-'}</td>
                    <td>
                      <span
                        className={`badge ${bw.isActive ? 'active' : 'inactive'}`}
                      >
                        {bw.isActive ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          title="Sửa"
                          onClick={() => handleOpenModal(bw)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Xóa"
                          onClick={() => handleDelete(bw.badWordId)}
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Sửa từ cấm' : 'Thêm từ cấm'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Từ cấm *</label>
                <input
                  type="text"
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="Nhập từ cấm..."
                />
              </div>

              <div className="form-group">
                <label>Mức độ</label>
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm({ ...form, level: parseInt(e.target.value) })
                  }
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  Kích hoạt
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadWordManagement;
