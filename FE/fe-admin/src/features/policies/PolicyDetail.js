import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { policyService } from '../../shared/api';
import './styles/PolicyDetail.css';

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Version detail modal
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [policyData, versionsData, statsData] = await Promise.all([
        policyService.getPolicyById(id),
        policyService.getVersionsByPolicyId(id),
        policyService.getAcceptStats(),
      ]);
      setPolicy(policyData);
      setVersions(Array.isArray(versionsData) ? versionsData : []);
      const policyStat = statsData?.find((s) => s.policyId === parseInt(id));
      setStats(policyStat || null);
    } catch (err) {
      console.error('Error:', err);
      setFeedback({ type: 'error', message: 'Không thể tải dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleViewVersion = async (version) => {
    try {
      setVersionLoading(true);
      const detail = await policyService.getVersionById(version.policyVersionId);
      setSelectedVersion(detail);
      setShowVersionModal(true);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Không thể tải chi tiết version.' });
    } finally {
      setVersionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'active';
      case 'DRAFT':
        return 'draft';
      default:
        return 'inactive';
    }
  };

  if (loading) {
    return <div className="policy-detail-page"><div className="loading">Đang tải...</div></div>;
  }

  if (!policy) {
    return (
      <div className="policy-detail-page">
        <div className="empty">Không tìm thấy Policy.</div>
        <button className="btn-secondary" onClick={() => navigate('/policies')}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="policy-detail-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/policies')}>
            ← Quay lại
          </button>
          <h1>{policy.policyName}</h1>
          <span className={`badge ${policy.isActive ? 'active' : 'inactive'}`}>
            {policy.isActive ? 'Đang bật' : 'Đã tắt'}
          </span>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Policy Info */}
      <div className="info-card">
        <h2>Thông tin Policy</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Mã Policy</label>
            <code>{policy.policyCode}</code>
          </div>
          <div className="info-item">
            <label>Thứ tự hiển thị</label>
            <span>{policy.displayOrder || 1}</span>
          </div>
          <div className="info-item">
            <label>Bắt buộc xác nhận</label>
            <span className={`badge ${policy.requireConsent ? 'required' : 'optional'}`}>
              {policy.requireConsent ? 'Có' : 'Không'}
            </span>
          </div>
          <div className="info-item">
            <label>Tổng Version</label>
            <span>{policy.totalVersions || versions.length}</span>
          </div>
          {stats && (
            <>
              <div className="info-item">
                <label>Đã Accept</label>
                <span className="text-success">{stats.acceptedUsers || 0} users</span>
              </div>
              <div className="info-item">
                <label>Chưa Accept</label>
                <span className="text-warning">{stats.pendingUsers || 0} users</span>
              </div>
              <div className="info-item">
                <label>Tỷ lệ Accept</label>
                <span className="text-primary">{stats.acceptRate?.toFixed(1) || 0}%</span>
              </div>
            </>
          )}
        </div>
        {policy.description && (
          <div className="info-item full">
            <label>Mô tả</label>
            <p>{policy.description}</p>
          </div>
        )}
      </div>

      {/* Versions Table */}
      <div className="versions-card">
        <div className="card-header">
          <h2>Danh sách Version ({versions.length})</h2>
        </div>

        {versions.length === 0 ? (
          <div className="empty">Chưa có version nào.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày publish</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.policyVersionId} className={version.status === 'ACTIVE' ? 'row-active' : ''}>
                    <td>
                      <strong>v{version.versionNumber}</strong>
                    </td>
                    <td>{version.title}</td>
                    <td>
                      <span className={`badge ${getStatusClass(version.status)}`}>
                        {version.status}
                      </span>
                    </td>
                    <td>{formatDate(version.createdAt)}</td>
                    <td>{version.publishedAt ? formatDate(version.publishedAt) : '-'}</td>
                    <td>
                      <button
                        className="btn-icon"
                        title="Xem chi tiết"
                        onClick={() => handleViewVersion(version)}
                        disabled={versionLoading}
                      >
                        👁 Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Version Detail Modal */}
      {showVersionModal && selectedVersion && (
        <div className="modal-overlay" onClick={() => setShowVersionModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>v{selectedVersion.versionNumber} - {selectedVersion.title}</h2>
                <span className={`badge ${getStatusClass(selectedVersion.status)}`}>
                  {selectedVersion.status}
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowVersionModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="version-meta">
                <div className="meta-item">
                  <label>Ngày tạo</label>
                  <span>{formatDate(selectedVersion.createdAt)}</span>
                </div>
                {selectedVersion.publishedAt && (
                  <div className="meta-item">
                    <label>Ngày publish</label>
                    <span>{formatDate(selectedVersion.publishedAt)}</span>
                  </div>
                )}
              </div>

              {selectedVersion.changeLog && (
                <div className="version-section">
                  <h4>Changelog</h4>
                  <p className="changelog">{selectedVersion.changeLog}</p>
                </div>
              )}

              <div className="version-section">
                <h4>Nội dung</h4>
                <div className="content-box">{selectedVersion.content}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyDetail;
