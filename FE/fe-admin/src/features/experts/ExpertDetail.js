import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../shared/api';
import './styles/ExpertDetail.css';

const EXPERT_ROLE_ID = 2;

const generateFriendlyPassword = () => {
  const words = ['Paw', 'Cat', 'Love', 'Pet', 'Heart', 'Meow', 'Cute'];
  const suffix = Math.floor(100 + Math.random() * 900);
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${suffix}`;
};

const ExpertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expert, setExpert] = useState(null);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Other');
  const [statusId, setStatusId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExpert = async () => {
      try {
        setLoading(true);
        const user = await userService.getUserById(id);

        if ((user.RoleId || user.roleId) !== EXPERT_ROLE_ID) {
          setError('Người dùng này không phải Expert.');
          return;
        }

        setExpert(user);
        setFullName(user.FullName || user.fullName || '');
        setGender(user.Gender || user.gender || 'Other');
        setStatusId(user.UserStatusId || user.userStatusId || 1);
      } catch (err) {
        console.error('Error loading expert', err);
        setError('Không thể tải thông tin expert. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadExpert();
  }, [id]);

  const handleSaveInfo = async (event) => {
    event.preventDefault();
    if (!expert) return;

    setSavingInfo(true);
    setInfoMessage(null);

    try {
      await userService.updateUser(expert.UserId || expert.userId, {
        RoleId: EXPERT_ROLE_ID,
        AddressId: expert.AddressId || expert.addressId || null,
        FullName: fullName.trim(),
        Gender: gender === 'Other' ? null : gender,
      });

      setInfoMessage('Cập nhật thông tin expert thành công.');
    } catch (err) {
      console.error('Error updating expert', err);
      setInfoMessage('Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleResetPassword = async () => {
    if (!expert) return;
    const email = expert.Email || expert.email;
    if (!email) {
      setPasswordMessage('Không tìm thấy email của expert.');
      return;
    }

    const password = generateFriendlyPassword();
    setResettingPassword(true);
    setPasswordMessage(null);

    try {
      await userService.resetPasswordByEmail(email, password);
      setNewPassword(password);
      setPasswordMessage(
        'Đã đặt lại mật khẩu. Hãy gửi mật khẩu mới cho expert và khuyến nghị họ đổi lại sau khi đăng nhập.'
      );
    } catch (err) {
      console.error('Error resetting password', err);
      setPasswordMessage('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="expert-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/experts')} className="back-btn">
            Quay lại danh sách Expert
          </button>
          <h1>Chi tiết Expert</h1>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="expert-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/experts')} className="back-btn">
            Quay lại danh sách Expert
          </button>
          <h1>Chi tiết Expert</h1>
        </div>
        <div className="error-message">
          <h2>{error || 'Không tìm thấy expert'}</h2>
        </div>
      </div>
    );
  }

  const email = expert.Email || expert.email;

  return (
    <div className="expert-detail-page">
      <div className="page-header">
        <button onClick={() => navigate('/experts')} className="back-btn">
          Quay lại danh sách Expert
        </button>
        <h1>Chi tiết Expert</h1>
      </div>

      <div className="expert-detail-grid">
        <form className="expert-card" onSubmit={handleSaveInfo}>
          <div className="card-header">
            <h2>Thông tin cơ bản</h2>
            <p>Cập nhật họ tên, giới tính. Email và vai trò được cố định.</p>
          </div>

          {infoMessage && <div className="alert">{infoMessage}</div>}

          <div className="field-row">
            <label>
              Họ và tên
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label>
              Email
              <input type="text" value={email} disabled />
            </label>
          </div>

          <div className="field-row">
            <label>
              Giới tính
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Other">Khác / Không tiết lộ</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </label>
          </div>

          <button type="submit" className="primary-btn" disabled={savingInfo}>
            {savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>

        <div className="expert-card">
          <div className="card-header">
            <h2>Đặt lại mật khẩu</h2>
            <p>
              Tạo mật khẩu mới khi có người mới tiếp quản tài khoản Expert. Mật khẩu cũ không
              được hiển thị lại.
            </p>
          </div>

          {passwordMessage && <div className="alert">{passwordMessage}</div>}

          <div className="password-box">
            <p className="hint">
              Sau khi đặt lại, bạn cần gửi mật khẩu mới cho Expert hoặc cập nhật qua kênh nội bộ.
            </p>

            {newPassword && (
              <div className="new-password-display">
                <span>Mật khẩu mới:</span>
                <strong>{newPassword}</strong>
              </div>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetail;


