import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../shared/api';
import './styles/ExpertList.css';

const EXPERT_ROLE_ID = 2;
const DEFAULT_PAGE_SIZE = 10;

const ExpertList = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadExperts = async (pageNumber = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers({
        roleId: EXPERT_ROLE_ID,
        page: pageNumber,
        pageSize,
        includeDeleted: false,
      });

      const items = response.Items || response.items || [];
      const totalCount = response.Total ?? response.total ?? items.length;

      setExperts(items);
      setTotal(totalCount);
      setPage(pageNumber);
    } catch (err) {
      console.error('Error loading experts', err);
      setError('Không thể tải danh sách expert. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleRowClick = (expert) => {
    const id = expert.UserId || expert.userId;
    if (id) {
      navigate(`/experts/${id}`);
    }
  };

  return (
    <div className="expert-list-page">
      <div className="page-header">
        <h1>Quản lý Expert</h1>
        <p>Xem danh sách, chi tiết và cập nhật thông tin tài khoản chuyên gia.</p>
      </div>

      <div className="expert-list-card">
        {loading && (
          <div className="table-loading">
            <div className="spinner" />
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <table className="expert-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Ngày tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {experts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Chưa có expert nào.
                    </td>
                  </tr>
                ) : (
                  experts.map((expert) => {
                    const id = expert.UserId || expert.userId;
                    const fullName = expert.FullName || expert.fullName || 'Không rõ';
                    const email = expert.Email || expert.email;
                    const createdAt = expert.CreatedAt || expert.createdAt;

                    return (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>{fullName}</td>
                        <td>{email}</td>
                        <td>{createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => handleRowClick(expert)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="table-footer">
              <span>
                Tổng: {total} expert
              </span>
              <div className="pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => loadExperts(page - 1)}
                >
                  Trước
                </button>
                <span>
                  Trang {page}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => loadExperts(page + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpertList;


