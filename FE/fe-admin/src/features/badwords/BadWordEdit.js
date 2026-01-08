import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const BadWordEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    word: '',
    isRegex: false,
    level: 1,
    category: 'Thô tục',
    isActive: true,
  });

  useEffect(() => {
    const fetchBadWord = async () => {
      setLoading(true);
      try {
        const data = await badWordService.getBadWordById(id);
        setForm({
          word: data.word || '',
          isRegex: data.isRegex || false,
          level: data.level || 1,
          category: data.category || 'Thô tục',
          isActive: data.isActive ?? true,
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.word.trim()) {
      setFeedback({ type: 'error', message: 'Từ cấm không được để trống.' });
      return;
    }

    // Validate regex if enabled
    if (form.isRegex) {
      try {
        new RegExp(form.word);
      } catch (err) {
        setFeedback({ type: 'error', message: 'Biểu thức Regex không hợp lệ.' });
        return;
      }
    }

    setSaving(true);
    try {
      await badWordService.updateBadWord(id, {
        Word: form.word.trim(),
        IsRegex: form.isRegex,
        Level: form.level,
        Category: form.category,
        IsActive: form.isActive,
      });
      
      navigate(`/badwords/${id}`, { 
        state: { message: 'Đã cập nhật từ cấm thành công.' } 
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể cập nhật từ cấm.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

  if (error) {
    return (
      <div className="detail-page">
        <span className="back-link" onClick={() => navigate('/badwords')}>
          ← Quay lại danh sách
        </span>
        <div className="empty">{error}</div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Back link */}
      <span className="back-link" onClick={() => navigate(`/badwords/${id}`)}>
        ← Quay lại chi tiết
      </span>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Edit Card */}
      <div className="detail-card">
        <div className="detail-header">
          <h1>✏️ Chỉnh sửa từ cấm</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="detail-body">
            <div className="form-group">
              <label>Từ cấm *</label>
              <input
                type="text"
                value={form.word}
                onChange={(e) => handleChange('word', e.target.value)}
                placeholder="Nhập từ cấm..."
              />
              {form.isRegex && (
                <div className="hint">
                  💡 Đang ở chế độ Regex. Ví dụ: \b(từ1|từ2)\b
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mức độ vi phạm</label>
                <select
                  value={form.level}
                  onChange={(e) => handleChange('level', parseInt(e.target.value))}
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
                  onChange={(e) => handleChange('category', e.target.value)}
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
                  onChange={(e) => handleChange('isRegex', e.target.checked)}
                />
                Sử dụng Regex (biểu thức chính quy)
              </label>
              <div className="hint">
                Regex cho phép khớp nhiều biến thể của từ cấm. Chỉ bật nếu bạn hiểu cú pháp Regex.
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
                Kích hoạt từ cấm này
              </label>
            </div>

            {form.isRegex && (
              <div className="form-group" style={{ 
                background: 'var(--bw-hover)', 
                padding: '1rem', 
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <label style={{ marginBottom: '0.5rem', display: 'block' }}>
                  📖 Hướng dẫn Regex
                </label>
                <div style={{ fontSize: '0.875rem', color: 'var(--bw-subtext)' }}>
                  <p style={{ margin: '0.25rem 0' }}>• <code>\b</code> - Ranh giới từ (word boundary)</p>
                  <p style={{ margin: '0.25rem 0' }}>• <code>(a|b|c)</code> - Khớp a hoặc b hoặc c</p>
                  <p style={{ margin: '0.25rem 0' }}>• <code>.*</code> - Khớp bất kỳ ký tự nào</p>
                  <p style={{ margin: '0.25rem 0' }}>• <code>\d+</code> - Khớp một hoặc nhiều số</p>
                  <p style={{ margin: '0.25rem 0' }}>• <code>[aàáảãạ]</code> - Khớp các biến thể có dấu</p>
                </div>
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => navigate(`/badwords/${id}`)}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BadWordEdit;
