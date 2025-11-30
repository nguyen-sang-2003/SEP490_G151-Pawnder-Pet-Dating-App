import React, { useEffect, useState } from 'react';
import { userService } from '../../shared/api';
import './styles/CreateExpert.css';

const EXPERT_ROLE_ID = 2;
const ACTIVE_STATUS_ID = 2;
const DEFAULT_EMAIL_DOMAIN = 'pawnder.com';

const getEmailDomain = (experts) => {
  for (const expert of experts) {
    const email = (expert.Email || expert.email || '').toLowerCase();
    if (email.startsWith('expert') && email.includes('@')) {
      return email.split('@')[1];
    }
  }
  return DEFAULT_EMAIL_DOMAIN;
};

const extractExpertNumber = (email = '') => {
  const match = email.toLowerCase().match(/^expert(\d+)@/);
  return match ? parseInt(match[1], 10) : null;
};

const generateExpertEmail = (experts = []) => {
  const usedNumbers = new Set();
  experts.forEach((expert) => {
    const email = expert.Email || expert.email;
    const number = extractExpertNumber(email);
    if (number) {
      usedNumbers.add(number);
    }
  });

  let counter = 1;
  while (usedNumbers.has(counter)) {
    counter += 1;
  }

  const domain = getEmailDomain(experts);
  return `expert${counter}@${domain}`;
};

const generateFriendlyPassword = () => {
  const words = ['Paw', 'Cat', 'Love', 'Pet', 'Heart', 'Meow', 'Cute'];
  const suffix = Math.floor(100 + Math.random() * 900);
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${suffix}`;
};

const fetchAllExperts = async () => {
  const pageSize = 50;
  let page = 1;
  const allExperts = [];
  let total = Infinity;

  while (allExperts.length < total) {
    const response = await userService.getUsers({
      roleId: EXPERT_ROLE_ID,
      page,
      pageSize,
      includeDeleted: false,
    });

    const items = response.Items || response.items || [];
    const totalCount = response.Total ?? response.total ?? items.length;
    allExperts.push(...items);

    if (items.length < pageSize) {
      break;
    }

    total = totalCount;
    page += 1;
  }

  return allExperts;
};

const CreateExpert = () => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Other');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadExperts = async () => {
      try {
        setInitializing(true);
        const data = await fetchAllExperts();
        setExperts(data);
        setEmail(generateExpertEmail(data));
        setPassword(generateFriendlyPassword());
      } catch (err) {
        console.error('Error loading experts', err);
        setError('Không thể tải danh sách chuyên gia. Vui lòng thử lại sau.');
      } finally {
        setInitializing(false);
      }
    };

    loadExperts();
  }, []);

  const handleRegeneratePassword = () => {
    setPassword(generateFriendlyPassword());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ tên của chuyên gia.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await userService.createUserByAdmin({
        RoleId: EXPERT_ROLE_ID,
        UserStatusId: ACTIVE_STATUS_ID,
        FullName: fullName.trim(),
        Gender: gender === 'Other' ? null : gender,
        Email: email,
        Password: password,
        IsProfileComplete: true,
      });

      const newExpert = { Email: email };
      const updatedExperts = [...experts, newExpert];

      setExperts(updatedExperts);
      setSuccess(`Đã tạo tài khoản cho chuyên gia ${fullName.trim()}.`);
      setFullName('');
      setGender('Other');
      setEmail(generateExpertEmail(updatedExperts));
      setPassword(generateFriendlyPassword());
    } catch (err) {
      console.error('Error creating expert', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Không thể tạo tài khoản chuyên gia. Vui lòng thử lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="create-expert-page">
        <div className="page-header">
          <h1>Tạo tài khoản chuyên gia</h1>
          <p>Đang tải dữ liệu...</p>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-expert-page">
      <div className="page-header">
        <h1>Tạo tài khoản chuyên gia</h1>
        <p>Admin có thể tạo nhanh tài khoản Expert với email và mật khẩu tự động.</p>
      </div>

      <div className="create-expert-grid">
        <form className="create-expert-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Thông tin chuyên gia</h2>
            <p>Điền thông tin cơ bản, hệ thống sẽ tự tạo email và mật khẩu.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <label className="form-label">
            Họ và tên *
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              required
            />
          </label>

          <label className="form-label">
            Giới tính
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Other">Khác / Không tiết lộ</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </label>

          <div className="generated-credentials">
            <div className="credential-item">
              <span className="label">Email tự động</span>
              <strong className="value">{email}</strong>
              <span className="hint">
                Hệ thống cấp email dạng expert + số thứ tự nhỏ nhất chưa dùng.
              </span>
            </div>

            <div className="credential-item">
              <span className="label">Mật khẩu đề xuất</span>
              <div className="password-row">
                <strong className="value">{password}</strong>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleRegeneratePassword}
                >
                  Đổi mật khẩu
                </button>
              </div>
              <span className="hint">Mật khẩu ngẫu nhiên, dễ nhớ cho chuyên gia.</span>
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="create-expert-card">
          <div className="card-header">
            <h2>Danh sách nhanh</h2>
            <p>{experts.length} tài khoản Expert đang được quản lý.</p>
          </div>

          <div className="expert-list">
            {experts.length === 0 ? (
              <p>Chưa có chuyên gia nào.</p>
            ) : (
              <ul>
                {experts.slice(0, 8).map((expert) => {
                  const emailValue = expert.Email || expert.email;
                  return (
                    <li key={emailValue} className="expert-item">
                      <span className="expert-name">
                        {expert.FullName || expert.fullName || 'Expert'}
                      </span>
                      <span className="expert-email">{emailValue}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {experts.length > 8 && (
              <p className="hint">Chỉ hiển thị 8 chuyên gia gần nhất.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExpert;


