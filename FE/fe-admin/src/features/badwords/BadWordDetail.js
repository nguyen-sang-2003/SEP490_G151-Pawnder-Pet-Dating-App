import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { badWordService } from '../../shared/api';
import './styles/BadWordManagement.css';

const LEVEL_INFO = {
  1: { label: 'Nhẹ (Level 1)', description: 'Che từ bằng ***', color: '#f59e0b' },
  2: { label: 'Nặng (Level 2)', description: 'Chặn tin nhắn hoàn toàn', color: '#ef4444' },
};

const BadWordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [badWord, setBadWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchBadWord = async () => {
      setLoading(true);
      try {
        const data = await badWordService.getBadWordById(id);
        setBadWord(data);
      } catch (err) {
        console.error('Error fetching bad word:', err);
        setError('Không tìm thấy từ cấm này.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadWord();
  }, [id]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleToggleActive = async () => {
    try {
      await badWordService.updateBadWord(badWord.badWordId, {
        Word: badWord.word,
        IsRegex: badWord.isRegex,
        Level: badWord.level,
        Category: badWord.category,
        IsActive: !badWord.isActive,
      });
      setBadWord({ ...badWord, isActive: !badWord.isActive });
      setFeedback({ 
        type: 'success', 
        message: `✓ Đã ${badWord.isActive ? 'tắt' : 'bật'} từ cấm.` 
      });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể cập nhật trạng thái.' });
    }
  };

  const handleDelete = async () => {
    try {
      await badWordService.deleteBadWord(badWord.badWordId);
      navigate('/badwords', { state: { message: 'Đã xóa từ cấm thành công.' } });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể xóa từ cấm.' });
      setDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading">
          <span className="loading-spinner"></span> Đang tải...
        </div>
      </div>
    );
  }

  if (error || !badWord) {
    return (
      <div className="detail-page">
        <span className="back-link" onClick={() => navigate('/badwords')}>
          ← Quay lại danh sách
        </span>
        <div className="empty">{error || 'Không tìm thấy từ cấm.'}</div>
      </div>
    );
  }

  const levelInfo = LEVEL_INFO[badWord.level] || LEVEL_INFO[1];

  return (
    <div className="detail-page">
      {/* Back link */}
      <span className="back-link" onClick={() => navigate('/badwords')}>
        ← Quay lại danh sách
      </span>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Detail Card */}
      <div className="detail-card">
        <div className="detail-header">
          <h1>
            🚫 {badWord.word}
            {badWord.isRegex && <span className="badge regex">Regex</span>}
          </h1>
          <div className="badges">
            <span className={`badge level-${badWord.level}`}>
              {levelInfo.label}
            </span>
            <span className={`badge ${badWord.isActive ? 'active' : 'inactive'}`}>
              {badWord.isActive ? 'Đang hoạt động' : 'Đã tắt'}
            </span>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-grid">
            <div className="detail-item">
              <div className="label">Từ cấm</div>
              <div className="value mono">{badWord.word}</div>
            </div>

            <div className="detail-item">
              <div className="label">Loại</div>
              <div className="value">
                {badWord.isRegex ? '🔤 Biểu thức chính quy (Regex)' : '📝 Văn bản thường'}
              </div>
            </div>

            <div className="detail-item">
              <div className="label">Mức độ vi phạm</div>
              <div className="value" style={{ color: levelInfo.color }}>
                {levelInfo.label}
              </div>
            </div>

            <div className="detail-item">
              <div className="label">Hành động</div>
              <div className="value">{levelInfo.description}</div>
            </div>

            <div className="detail-item">
              <div className="label">Danh mục</div>
              <div className="value">{badWord.category || 'Không phân loại'}</div>
            </div>

            <div className="detail-item">
              <div className="label">Trạng thái</div>
              <div className="value">
                {badWord.isActive ? '✅ Đang hoạt động' : '⏸️ Đã tắt'}
              </div>
            </div>

            <div className="detail-item">
              <div className="label">Ngày tạo</div>
              <div className="value">{formatDate(badWord.createdAt)}</div>
            </div>

            <div className="detail-item">
              <div className="label">Cập nhật lần cuối</div>
              <div className="value">{formatDate(badWord.updatedAt)}</div>
            </div>
          </div>

          {badWord.isRegex && (
            <div className="detail-item" style={{ marginTop: '1.5rem' }}>
              <div className="label">Hướng dẫn Regex</div>
              <div className="value" style={{ fontSize: '0.875rem', color: 'var(--bw-subtext)' }}>
                <p>• <code>\b</code> - Ranh giới từ</p>
                <p>• <code>(a|b|c)</code> - Khớp a hoặc b hoặc c</p>
                <p>• <code>.*</code> - Khớp bất kỳ ký tự nào</p>
                <p>• <code>\d+</code> - Khớp một hoặc nhiều số</p>
              </div>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button 
            className="btn-secondary" 
            onClick={() => navigate(`/badwords/${badWord.badWordId}/edit`)}
          >
            ✏️ Chỉnh sửa
          </button>
          <button 
            className={badWord.isActive ? 'btn-warning' : 'btn-primary'}
            onClick={handleToggleActive}
          >
            {badWord.isActive ? '⏸️ Tắt' : '▶️ Bật'}
          </button>
          <button 
            className="btn-danger" 
            onClick={() => setDeleteConfirm(true)}
          >
            🗑️ Xóa
          </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="icon">⚠️</div>
              <h3>Xác nhận xóa</h3>
              <p>
                Bạn có chắc muốn xóa từ cấm "<strong>{badWord.word}</strong>"?
                <br />Hành động này không thể hoàn tác.
              </p>
              <div className="actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(false)}>
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

export default BadWordDetail;
