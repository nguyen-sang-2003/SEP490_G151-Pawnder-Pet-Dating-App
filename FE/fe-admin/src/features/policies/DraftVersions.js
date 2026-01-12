import React, { useEffect, useState, useMemo } from 'react';
import { policyService } from '../../shared/api';
import './styles/DraftVersions.css';

const DraftVersions = () => {
  // Data
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Selection
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [draftVersions, setDraftVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetail, setVersionDetail] = useState(null);

  // Search
  const [policySearch, setPolicySearch] = useState('');

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', changeLog: '' });

  // Create mode
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', changeLog: '' });

  // Bulk publish modal
  const [showBulkPublish, setShowBulkPublish] = useState(false);
  const [bulkSelections, setBulkSelections] = useState({});

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await policyService.getAllPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      setFeedback({ type: 'error', message: 'Không thể tải danh sách Policy.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Fetch draft versions when policy selected
  useEffect(() => {
    if (!selectedPolicy) {
      setDraftVersions([]);
      setSelectedVersion(null);
      setVersionDetail(null);
      return;
    }

    const fetchVersions = async () => {
      try {
        const data = await policyService.getVersionsByPolicyId(selectedPolicy.policyId);
        const drafts = (Array.isArray(data) ? data : []).filter(
          (v) => v.status === 'DRAFT'
        );
        setDraftVersions(drafts);
        setSelectedVersion(null);
        setVersionDetail(null);
      } catch (err) {
        console.error('Error:', err);
        setDraftVersions([]);
      }
    };

    fetchVersions();
  }, [selectedPolicy]);

  // Fetch version detail when version selected
  useEffect(() => {
    if (!selectedVersion) {
      setVersionDetail(null);
      setIsEditing(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const data = await policyService.getVersionById(selectedVersion.policyVersionId);
        setVersionDetail(data);
        setEditForm({
          title: data.title || '',
          content: data.content || '',
          changeLog: data.changeLog || '',
        });
      } catch (err) {
        console.error('Error:', err);
        setVersionDetail(null);
      }
    };

    fetchDetail();
  }, [selectedVersion]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    if (!policySearch.trim()) return policies;
    return policies.filter(
      (p) =>
        p.policyName?.toLowerCase().includes(policySearch.toLowerCase()) ||
        p.policyCode?.toLowerCase().includes(policySearch.toLowerCase())
    );
  }, [policies, policySearch]);

  // Count drafts per policy
  const getDraftCount = (policyId) => {
    // This would need to be fetched, for now show from activeVersion
    return '?';
  };

  // Handlers
  const handleSelectPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }

    try {
      await policyService.updateVersion(selectedVersion.policyVersionId, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        changeLog: editForm.changeLog.trim(),
      });
      setFeedback({ type: 'success', message: 'Đã lưu thay đổi!' });
      setIsEditing(false);

      // Refresh
      const data = await policyService.getVersionById(selectedVersion.policyVersionId);
      setVersionDetail(data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể lưu.' });
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin.' });
      return;
    }

    try {
      await policyService.createVersion(selectedPolicy.policyId, {
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        changeLog: createForm.changeLog.trim(),
      });
      setFeedback({ type: 'success', message: 'Đã tạo version mới!' });
      setIsCreating(false);
      setCreateForm({ title: '', content: '', changeLog: '' });

      // Refresh drafts
      const data = await policyService.getVersionsByPolicyId(selectedPolicy.policyId);
      const drafts = (Array.isArray(data) ? data : []).filter((v) => v.status === 'DRAFT');
      setDraftVersions(drafts);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tạo.' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa version nháp này?')) return;

    try {
      await policyService.deleteVersion(selectedVersion.policyVersionId);
      setFeedback({ type: 'success', message: 'Đã xóa version!' });
      setSelectedVersion(null);
      setVersionDetail(null);

      // Refresh drafts
      const data = await policyService.getVersionsByPolicyId(selectedPolicy.policyId);
      const drafts = (Array.isArray(data) ? data : []).filter((v) => v.status === 'DRAFT');
      setDraftVersions(drafts);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể xóa.' });
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish version này?\n\nLưu ý: Tất cả User sẽ phải xác nhận lại Policy!')) return;

    try {
      await policyService.publishVersion(selectedVersion.policyVersionId);
      setFeedback({ type: 'success', message: 'Đã publish thành công!' });
      setSelectedVersion(null);
      setVersionDetail(null);

      // Refresh
      const data = await policyService.getVersionsByPolicyId(selectedPolicy.policyId);
      const drafts = (Array.isArray(data) ? data : []).filter((v) => v.status === 'DRAFT');
      setDraftVersions(drafts);
      fetchPolicies();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể publish.' });
    }
  };

  // Bulk publish handlers
  const handleBulkSelect = (policyId, versionId) => {
    setBulkSelections((prev) => ({
      ...prev,
      [policyId]: versionId,
    }));
  };

  const handleBulkPublish = async () => {
    const toPublish = Object.entries(bulkSelections).filter(([_, vId]) => vId);
    if (toPublish.length === 0) {
      setFeedback({ type: 'error', message: 'Chưa chọn version nào để publish.' });
      return;
    }

    if (!window.confirm(`Publish ${toPublish.length} version?\n\nLưu ý: Tất cả User sẽ phải xác nhận lại các Policy này!`)) return;

    try {
      for (const [_, versionId] of toPublish) {
        await policyService.publishVersion(versionId);
      }
      setFeedback({ type: 'success', message: `Đã publish ${toPublish.length} version!` });
      setShowBulkPublish(false);
      setBulkSelections({});
      fetchPolicies();

      // Refresh current drafts if policy selected
      if (selectedPolicy) {
        const data = await policyService.getVersionsByPolicyId(selectedPolicy.policyId);
        const drafts = (Array.isArray(data) ? data : []).filter((v) => v.status === 'DRAFT');
        setDraftVersions(drafts);
        if (selectedVersion && !drafts.find((d) => d.policyVersionId === selectedVersion.policyVersionId)) {
          setSelectedVersion(null);
          setVersionDetail(null);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Có lỗi khi publish.' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="draft-versions-page">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Version nháp</h1>
        <button className="btn-primary" onClick={() => setShowBulkPublish(true)}>
          🚀 Publish nhiều Version
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>{feedback.message}</div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="three-column-layout">
          {/* Column 1: Policies */}
          <div className="column policies-column">
            <div className="column-header">
              <h3>Policies</h3>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="column-content">
              {filteredPolicies.length === 0 ? (
                <div className="empty-small">Không có Policy.</div>
              ) : (
                <ul className="policy-list">
                  {filteredPolicies.map((policy) => (
                    <li
                      key={policy.policyId}
                      className={`policy-item ${selectedPolicy?.policyId === policy.policyId ? 'selected' : ''}`}
                      onClick={() => handleSelectPolicy(policy)}
                    >
                      <div className="policy-name">{policy.policyName}</div>
                      <div className="policy-code">{policy.policyCode}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Column 2: Draft Versions */}
          <div className="column versions-column">
            <div className="column-header">
              <h3>
                {selectedPolicy ? `Nháp của "${selectedPolicy.policyName}"` : 'Chọn Policy'}
              </h3>
              {selectedPolicy && (
                <button
                  className="btn-small"
                  onClick={() => {
                    setIsCreating(true);
                    setSelectedVersion(null);
                    setVersionDetail(null);
                    setIsEditing(false);
                    setCreateForm({ title: '', content: '', changeLog: '' });
                  }}
                >
                  + Tạo mới
                </button>
              )}
            </div>
            <div className="column-content">
              {!selectedPolicy ? (
                <div className="empty-small">← Chọn một Policy để xem các version nháp</div>
              ) : draftVersions.length === 0 ? (
                <div className="empty-small">Không có version nháp nào.</div>
              ) : (
                <ul className="version-list">
                  {draftVersions.map((version) => (
                    <li
                      key={version.policyVersionId}
                      className={`version-item ${selectedVersion?.policyVersionId === version.policyVersionId ? 'selected' : ''}`}
                      onClick={() => handleSelectVersion(version)}
                    >
                      <div className="version-title">
                        <span className="version-number">v{version.versionNumber}</span>
                        {version.title}
                      </div>
                      <div className="version-date">Tạo: {formatDate(version.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Column 3: Version Content */}
          <div className="column content-column">
            <div className="column-header">
              <h3>
                {isCreating
                  ? 'Tạo Version mới'
                  : selectedVersion
                  ? `v${selectedVersion.versionNumber} - ${selectedVersion.title}`
                  : 'Nội dung Version'}
              </h3>
              {selectedVersion && !isCreating && (
                <div className="header-actions">
                  {isEditing ? (
                    <>
                      <button className="btn-small" onClick={() => setIsEditing(false)}>
                        Hủy
                      </button>
                      <button className="btn-small primary" onClick={handleSaveEdit}>
                        💾 Lưu
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small" onClick={() => setIsEditing(true)}>
                        ✏️ Sửa
                      </button>
                      <button className="btn-small danger" onClick={handleDelete}>
                        🗑️ Xóa
                      </button>
                      <button className="btn-small success" onClick={handlePublish}>
                        🚀 Publish
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="column-content">
              {isCreating ? (
                <div className="version-form">
                  <div className="form-group">
                    <label>Tiêu đề *</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="VD: Điều khoản v2.0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nội dung *</label>
                    <textarea
                      value={createForm.content}
                      onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                      placeholder="Nội dung đầy đủ của Policy..."
                      rows={12}
                    />
                  </div>
                  <div className="form-group">
                    <label>Changelog</label>
                    <textarea
                      value={createForm.changeLog}
                      onChange={(e) => setCreateForm({ ...createForm, changeLog: e.target.value })}
                      placeholder="Mô tả thay đổi..."
                      rows={3}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setIsCreating(false)}>
                      Hủy
                    </button>
                    <button className="btn-primary" onClick={handleCreate}>
                      Tạo Version
                    </button>
                  </div>
                </div>
              ) : !selectedVersion ? (
                <div className="empty-small">← Chọn một version để xem nội dung</div>
              ) : !versionDetail ? (
                <div className="loading-small">Đang tải...</div>
              ) : isEditing ? (
                <div className="version-form">
                  <div className="form-group">
                    <label>Tiêu đề *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nội dung *</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={12}
                    />
                  </div>
                  <div className="form-group">
                    <label>Changelog</label>
                    <textarea
                      value={editForm.changeLog}
                      onChange={(e) => setEditForm({ ...editForm, changeLog: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="version-view">
                  {versionDetail.changeLog && (
                    <div className="view-section">
                      <h4>Changelog</h4>
                      <p className="changelog">{versionDetail.changeLog}</p>
                    </div>
                  )}
                  <div className="view-section">
                    <h4>Nội dung</h4>
                    <div className="content-box">{versionDetail.content}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Publish Modal */}
      {showBulkPublish && (
        <BulkPublishModal
          policies={policies}
          selections={bulkSelections}
          onSelect={handleBulkSelect}
          onPublish={handleBulkPublish}
          onClose={() => {
            setShowBulkPublish(false);
            setBulkSelections({});
          }}
        />
      )}
    </div>
  );
};

// Bulk Publish Modal Component
const BulkPublishModal = ({ policies, selections, onSelect, onPublish, onClose }) => {
  const [policyDrafts, setPolicyDrafts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllDrafts = async () => {
      setLoading(true);
      const draftsMap = {};

      for (const policy of policies) {
        try {
          const versions = await policyService.getVersionsByPolicyId(policy.policyId);
          const drafts = (Array.isArray(versions) ? versions : []).filter(
            (v) => v.status === 'DRAFT'
          );
          if (drafts.length > 0) {
            draftsMap[policy.policyId] = {
              policy,
              drafts,
            };
          }
        } catch (err) {
          console.error('Error fetching drafts for policy:', policy.policyId);
        }
      }

      setPolicyDrafts(draftsMap);
      setLoading(false);
    };

    fetchAllDrafts();
  }, [policies]);

  const policiesWithDrafts = Object.values(policyDrafts);
  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Publish nhiều Version</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : policiesWithDrafts.length === 0 ? (
            <div className="empty">Không có Policy nào có version nháp.</div>
          ) : (
            <div className="bulk-list">
              <p className="bulk-hint">
                Chọn version muốn publish cho mỗi Policy (mỗi Policy chỉ chọn được 1 version):
              </p>
              {policiesWithDrafts.map(({ policy, drafts }) => (
                <div key={policy.policyId} className="bulk-item">
                  <div className="bulk-policy">
                    <strong>{policy.policyName}</strong>
                    <code>{policy.policyCode}</code>
                  </div>
                  <div className="bulk-versions">
                    <select
                      value={selections[policy.policyId] || ''}
                      onChange={(e) => onSelect(policy.policyId, e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Không chọn --</option>
                      {drafts.map((draft) => (
                        <option key={draft.policyVersionId} value={draft.policyVersionId}>
                          v{draft.versionNumber} - {draft.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="btn-primary"
            onClick={onPublish}
            disabled={selectedCount === 0}
          >
            🚀 Publish {selectedCount > 0 ? `(${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftVersions;
