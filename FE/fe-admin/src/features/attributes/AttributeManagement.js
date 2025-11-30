import React, { useEffect, useMemo, useState } from 'react';
import { attributeService } from '../../shared/api';
import './styles/AttributeManagement.css';

const TYPE_VALUE_OPTIONS = [
  { value: '', label: 'Chọn kiểu giá trị' },
  { value: 'string', label: 'Chuỗi (string)' },
  { value: 'number', label: 'Số (number)' },
  { value: 'int', label: 'Số nguyên (int)' },
  { value: 'float', label: 'Số thực (float)' },
  { value: 'boolean', label: 'Boolean (true/false)' },
  { value: 'select', label: 'Lựa chọn đơn (select)' },
  { value: 'multi_select', label: 'Lựa chọn nhiều (multi select)' },
  { value: 'range', label: 'Khoảng giá trị (range)' },
  { value: 'date', label: 'Ngày (date)' },
  { value: 'datetime', label: 'Ngày + giờ (datetime)' },
];

const defaultAttributeForm = {
  name: '',
  typeValue: '',
  unit: '',
};

const defaultOptionForm = {
  name: '',
  optionId: null,
};

const AttributeManagement = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [attributeForm, setAttributeForm] = useState(defaultAttributeForm);
  const [editingAttribute, setEditingAttribute] = useState(null);

  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [options, setOptions] = useState([]);
  const [optionForm, setOptionForm] = useState(defaultOptionForm);
  const [optionLoading, setOptionLoading] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const filteredAttributes = useMemo(() => {
    if (!searchTerm) return attributes;
    return attributes.filter((attr) =>
      attr.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [attributes, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const fetchAttributes = async () => {
      setLoading(true);
      setError(null);
      try {
        const { items } = await attributeService.getAttributes();
        if (!isMounted) return;
        setAttributes(items);

        setSelectedAttribute((prev) => {
          if (!prev) return null;
          const updatedSelection = items.find((attr) => attr.id === prev.id);
          return updatedSelection || null;
        });
      } catch (err) {
        console.error('Error fetching attributes:', err);
        if (isMounted) setError('Không thể tải danh sách thuộc tính. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAttributes();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedAttribute) {
      setOptions([]);
      return;
    }

    let isMounted = true;
    const fetchOptions = async () => {
      setOptionLoading(true);
      try {
        const optionList = await attributeService.getAttributeOptions(selectedAttribute.id);
        if (isMounted) {
          setOptions(optionList);
        }
      } catch (err) {
        console.error('Error fetching attribute options:', err);
        if (isMounted) {
          setOptions([]);
          setFeedback({
            type: 'error',
            message: 'Không thể tải option cho thuộc tính này.',
          });
        }
      } finally {
        if (isMounted) setOptionLoading(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [selectedAttribute]);

  const handleAttributeSubmit = async (event) => {
    event.preventDefault();
    if (!attributeForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Tên thuộc tính không được để trống.' });
      return;
    }

    try {
      if (editingAttribute) {
        await attributeService.updateAttribute(editingAttribute.id, {
          Name: attributeForm.name.trim(),
          TypeValue: attributeForm.typeValue || null,
          Unit: attributeForm.unit || null,
        });
        setFeedback({ type: 'success', message: 'Đã cập nhật thuộc tính.' });
      } else {
        await attributeService.createAttribute({
          Name: attributeForm.name.trim(),
          TypeValue: attributeForm.typeValue || null,
          Unit: attributeForm.unit || null,
        });
        setFeedback({ type: 'success', message: 'Đã tạo thuộc tính mới.' });
      }
      setAttributeForm(defaultAttributeForm);
      setEditingAttribute(null);
      triggerRefresh();
    } catch (err) {
      console.error('Attribute save failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể lưu thuộc tính.',
      });
    }
  };

  const handleEditAttribute = (attribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({
      name: attribute.name,
      typeValue: attribute.typeValue ?? '',
      unit: attribute.unit ?? '',
    });
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (!window.confirm('Bạn có chắc muốn xoá thuộc tính này?')) return;

    try {
      await attributeService.deleteAttribute(attributeId, { hard: false });
      setFeedback({ type: 'success', message: 'Đã xoá thuộc tính.' });
      if (selectedAttribute?.id === attributeId) {
        setSelectedAttribute(null);
        setOptions([]);
      }
      triggerRefresh();
    } catch (err) {
      console.error('Delete attribute failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể xoá thuộc tính.',
      });
    }
  };

  const handleSelectAttribute = (attribute) => {
    setSelectedAttribute(attribute);
    setOptionForm(defaultOptionForm);
  };

  const handleResetAttributeForm = () => {
    setEditingAttribute(null);
    setAttributeForm(defaultAttributeForm);
  };

  const handleOptionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAttribute) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn thuộc tính trước.' });
      return;
    }
    if (!optionForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Tên option không được để trống.' });
      return;
    }

    try {
      if (optionForm.optionId) {
        await attributeService.updateOption(optionForm.optionId, optionForm.name.trim());
        setFeedback({ type: 'success', message: 'Đã cập nhật option.' });
      } else {
        await attributeService.createOption(selectedAttribute.id, optionForm.name.trim());
        setFeedback({ type: 'success', message: 'Đã thêm option mới.' });
      }
      setOptionForm(defaultOptionForm);
      setSelectedAttribute({ ...selectedAttribute }); // trigger options reload
    } catch (err) {
      console.error('Option save failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể lưu option.',
      });
    }
  };

  const handleEditOption = (option) => {
    setOptionForm({
      name: option.name,
      optionId: option.id,
    });
  };

  const handleDeleteOption = async (optionId) => {
    if (!window.confirm('Xoá option này?')) return;

    try {
      await attributeService.deleteOption(optionId);
      setFeedback({ type: 'success', message: 'Đã xoá option.' });
      setSelectedAttribute({ ...selectedAttribute });
    } catch (err) {
      console.error('Delete option failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể xoá option.',
      });
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="attribute-page">
      <div className="page-header">
        <h1>Quản lý thuộc tính</h1>
        <p>Quản lý danh sách thuộc tính và option được sử dụng trong hệ thống.</p>
      </div>

      {feedback && (
        <div className={`feedback-banner ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="attribute-layout">
        <section className="attribute-card">
          <div className="card-header">
            <h2>{editingAttribute ? 'Cập nhật thuộc tính' : 'Tạo mới thuộc tính'}</h2>
            {editingAttribute && (
              <button className="text-btn" onClick={handleResetAttributeForm}>
                + Thuộc tính mới
              </button>
            )}
          </div>
          <form className="attribute-form" onSubmit={handleAttributeSubmit}>
            <div className="form-group">
              <label>Tên thuộc tính *</label>
              <input
                type="text"
                value={attributeForm.name}
                onChange={(e) => setAttributeForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Màu lông"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kiểu giá trị</label>
                <select
                  value={attributeForm.typeValue}
                  onChange={(e) =>
                    setAttributeForm((prev) => ({ ...prev, typeValue: e.target.value }))
                  }
                >
                  {TYPE_VALUE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Đơn vị</label>
                <input
                  type="text"
                  value={attributeForm.unit}
                  onChange={(e) => setAttributeForm((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="VD: kg, cm"
                />
              </div>
            </div>
            <button type="submit" className="primary-btn">
              {editingAttribute ? 'Lưu thay đổi' : 'Tạo thuộc tính'}
            </button>
          </form>
        </section>

        <section className="attribute-card">
          <div className="card-header">
            <div>
              <h2>Danh sách thuộc tính</h2>
              <p>Nhấn vào một thuộc tính để quản lý option</p>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty-state">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="empty-state error">{error}</div>
          ) : filteredAttributes.length === 0 ? (
            <div className="empty-state">Không có thuộc tính nào</div>
          ) : (
            <div className="attribute-table">
              {filteredAttributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className={`attribute-row ${
                    selectedAttribute?.id === attribute.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectAttribute(attribute)}
                >
                  <div>
                    <h4>{attribute.name}</h4>
                    <p>
                      Kiểu: {attribute.typeValue || 'N/A'} • Đơn vị:{' '}
                      {attribute.unit || 'N/A'}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      className="text-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAttribute(attribute);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttribute(attribute.id);
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="attribute-card">
          <div className="card-header">
            <h2>
              {selectedAttribute
                ? `Option của "${selectedAttribute.name}"`
                : 'Chọn thuộc tính để quản lý option'}
            </h2>
          </div>

          {!selectedAttribute ? (
            <div className="empty-state">Hãy chọn một thuộc tính ở danh sách bên cạnh.</div>
          ) : (
            <>
              <form className="attribute-form" onSubmit={handleOptionSubmit}>
                <div className="form-group">
                  <label>{optionForm.optionId ? 'Cập nhật option' : 'Thêm option mới'}</label>
                  <div className="option-row">
                    <input
                      type="text"
                      value={optionForm.name}
                      onChange={(e) => setOptionForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên option"
                    />
                    {optionForm.optionId && (
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setOptionForm(defaultOptionForm)}
                      >
                        Huỷ
                      </button>
                    )}
                    <button type="submit" className="primary-btn">
                      {optionForm.optionId ? 'Lưu' : 'Thêm'}
                    </button>
                  </div>
                </div>
              </form>

              {optionLoading ? (
                <div className="empty-state">Đang tải option...</div>
              ) : options.length === 0 ? (
                <div className="empty-state">Chưa có option nào cho thuộc tính này.</div>
              ) : (
                <ul className="option-list">
                  {options.map((option) => (
                    <li key={option.id} className="option-item">
                      <span>{option.name}</span>
                      <div className="row-actions">
                        <button className="text-btn" onClick={() => handleEditOption(option)}>
                          Sửa
                        </button>
                        <button
                          className="text-btn danger"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          Xoá
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AttributeManagement;

