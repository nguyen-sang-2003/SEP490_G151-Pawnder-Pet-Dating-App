import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../../shared/api';
import './styles/EventForm.css';

/**
 * EventForm Component
 * Form for creating and editing events
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [event, setEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    startTime: '',
    submissionDeadline: '',
    endTime: '',
    prizeDescription: '',
    prizePoints: 0,
  });

  const [errors, setErrors] = useState({});
  const [coverImageMode, setCoverImageMode] = useState('url'); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch event data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(id);
      setEvent(data);
      
      // Format datetime for input - keep local time (Vietnam timezone)
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        // Backend returns time without timezone, treat as Vietnam time
        // Create date and format for datetime-local input
        const date = new Date(dateStr);
        
        // If the date string doesn't have timezone info, it's already in local time
        // Just format it for the input
        if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
          // No timezone info - format directly without conversion
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        // Has timezone info - convert to local time
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: data.title || '',
        description: data.description || '',
        coverImageUrl: data.coverImageUrl || '',
        startTime: formatForInput(data.startTime),
        submissionDeadline: formatForInput(data.submissionDeadline),
        endTime: formatForInput(data.endTime),
        prizeDescription: data.prizeDescription || '',
        prizePoints: data.prizePoints || 0,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể tải thông tin sự kiện.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Ảnh tối đa 10MB' });
      return;
    }

    try {
      setUploading(true);
      const result = await eventService.uploadCoverImage(file);
      setFormData((prev) => ({ ...prev, coverImageUrl: result.coverImageUrl }));
      setFeedback({ type: 'success', message: 'Upload ảnh bìa thành công!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi upload ảnh' });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear cover image
  const handleClearCover = () => {
    setFormData((prev) => ({ ...prev, coverImageUrl: '' }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên sự kiện';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
    }

    if (!formData.submissionDeadline) {
      newErrors.submissionDeadline = 'Vui lòng chọn hạn nộp bài';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
    }

    // Validate time logic
    if (formData.startTime && formData.submissionDeadline && formData.endTime) {
      const start = new Date(formData.startTime);
      const deadline = new Date(formData.submissionDeadline);
      const end = new Date(formData.endTime);

      if (start >= deadline) {
        newErrors.submissionDeadline = 'Hạn nộp bài phải sau thời gian bắt đầu';
      }

      if (deadline >= end) {
        newErrors.endTime = 'Thời gian kết thúc phải sau hạn nộp bài';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        Title: formData.title.trim(),
        Description: formData.description.trim() || null,
        CoverImageUrl: formData.coverImageUrl.trim() || null,
        StartTime: formData.startTime,
        SubmissionDeadline: formData.submissionDeadline,
        EndTime: formData.endTime,
        PrizeDescription: formData.prizeDescription.trim() || null,
        PrizePoints: parseInt(formData.prizePoints) || 0,
      };

      if (isEditMode) {
        await eventService.updateEvent(id, payload);
        setFeedback({ type: 'success', message: 'Cập nhật sự kiện thành công!' });
        setTimeout(() => navigate(`/events/${id}`), 1500);
      } else {
        const result = await eventService.createEvent(payload);
        setFeedback({ type: 'success', message: 'Tạo sự kiện thành công!' });
        setTimeout(() => navigate('/events'), 1500);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Có lỗi xảy ra.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if field should be disabled based on event status
  const isFieldDisabled = (field) => {
    if (!isEditMode || !event) return false;

    const status = event.status;
    
    // Chỉ disable khi event đã completed hoặc cancelled
    if (['completed', 'cancelled'].includes(status)) {
      return true;
    }

    // StartTime: Chỉ cho edit khi còn upcoming VÀ chưa có bài dự thi
    if (field === 'startTime') {
      if (status !== 'upcoming') {
        return true; // Đã bắt đầu rồi thì không cho edit
      }
      if (event.submissionCount > 0) {
        return true; // Đã có người nộp bài thì không cho edit
      }
    }

    // SubmissionDeadline và EndTime: Cho edit thoải mái để admin có thể nới thời gian
    return false;
  };

  if (loading) {
    return <div className="event-form-page"><div className="loading">Đang tải...</div></div>;
  }

  return (
    <div className="event-form-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1>{isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h1>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Form */}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Tên sự kiện *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Mèo ngủ xấu nhất 2026"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về cuộc thi..."
              rows={3}
            />
          </div>

          {/* Cover Image */}
          <div className="form-group">
            <label>Ảnh bìa</label>
            
            {/* Mode Toggle */}
            <div className="cover-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${coverImageMode === 'upload' ? 'active' : ''}`}
                onClick={() => setCoverImageMode('upload')}
              >
                📤 Upload ảnh
              </button>
              <button
                type="button"
                className={`mode-btn ${coverImageMode === 'url' ? 'active' : ''}`}
                onClick={() => setCoverImageMode('url')}
              >
                🔗 Nhập URL
              </button>
            </div>

            {/* Upload Mode */}
            {coverImageMode === 'upload' && (
              <div className="cover-upload-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '⏳ Đang upload...' : '📷 Chọn ảnh từ máy'}
                </button>
                <span className="upload-hint">JPG, PNG, WebP, GIF - Tối đa 10MB</span>
              </div>
            )}

            {/* URL Mode */}
            {coverImageMode === 'url' && (
              <input
                type="url"
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
              />
            )}

            {/* Preview */}
            {formData.coverImageUrl && (
              <div className="image-preview">
                <img 
                  src={formData.coverImageUrl} 
                  alt="Preview" 
                  onError={(e) => e.target.style.display = 'none'} 
                />
                <button
                  type="button"
                  className="btn-clear-cover"
                  onClick={handleClearCover}
                  title="Xóa ảnh bìa"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="form-row">
            <div className="form-group">
              <label>Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                disabled={isFieldDisabled('startTime')}
                className={errors.startTime ? 'error' : ''}
              />
              {errors.startTime && <span className="error-text">{errors.startTime}</span>}
              {isFieldDisabled('startTime') && event && (
                <span className="hint-text">
                  {event.status !== 'upcoming' 
                    ? 'Không thể thay đổi sau khi sự kiện đã bắt đầu'
                    : event.submissionCount > 0
                      ? 'Không thể thay đổi khi đã có người tham gia'
                      : 'Không thể chỉnh sửa sự kiện đã hoàn thành hoặc đã hủy'}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Hạn nộp bài *</label>
              <input
                type="datetime-local"
                name="submissionDeadline"
                value={formData.submissionDeadline}
                onChange={handleChange}
                disabled={isFieldDisabled('submissionDeadline')}
                className={errors.submissionDeadline ? 'error' : ''}
              />
              {errors.submissionDeadline && <span className="error-text">{errors.submissionDeadline}</span>}
              {isFieldDisabled('submissionDeadline') && (
                <span className="hint-text">Không thể chỉnh sửa sự kiện đã hoàn thành hoặc đã hủy</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={errors.endTime ? 'error' : ''}
              />
              {errors.endTime && <span className="error-text">{errors.endTime}</span>}
            </div>

            <div className="form-group">
              <label>Điểm thưởng</label>
              <input
                type="number"
                name="prizePoints"
                value={formData.prizePoints}
                onChange={handleChange}
                min="0"
                placeholder="100"
              />
            </div>
          </div>

          {/* Prize Description */}
          <div className="form-group">
            <label>Mô tả giải thưởng</label>
            <textarea
              name="prizeDescription"
              value={formData.prizeDescription}
              onChange={handleChange}
              placeholder="VD: Top 3 nhận 100/50/30 điểm VIP"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : isEditMode ? 'Lưu thay đổi' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
