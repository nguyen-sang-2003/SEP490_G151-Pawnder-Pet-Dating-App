import React, { useEffect, useMemo, useState } from 'react';
import { mockPayments } from '../../shared/data/mockPayments';
import { paymentService } from '../../shared/api';
import './styles/PaymentManagement.css';

const parseDateValue = (value) => {
  if (!value) return null;
  const normalized =
    typeof value === 'string' && !value.includes('T')
      ? `${value}T00:00:00`
      : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculatePlanDuration = (start, end) => {
  const startDate = parseDateValue(start);
  const endDate = parseDateValue(end);
  if (!startDate || !endDate) return '1 tháng';

  const diffInMs = Math.max(endDate - startDate, 0);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  const months = Math.max(1, Math.round(diffInDays / 30));
  return `${months} tháng`;
};

const RANGE_MIN_BUCKETS = {
  year: 4,
  month: 6,
  week: 6,
};

const FALLBACK_REVENUE_DATA = {
  year: [
    { label: '2018', total: 21819.6 },
    { label: '2019', total: 27100 },
    { label: '2020', total: 6946.2 },
    { label: '2021', total: 14500 },
  ],
  month: [
    { label: 'Tháng 1', total: 60 },
    { label: 'Tháng 2', total: 110 },
    { label: 'Tháng 3', total: 80 },
    { label: 'Tháng 4', total: 100 },
    { label: 'Tháng 5', total: 80 },
    { label: 'Tháng 6', total: 140 },
  ],
  week: [
    { label: 'Tuần 1', total: 20 },
    { label: 'Tuần 2', total: 35 },
    { label: 'Tuần 3', total: 28 },
    { label: 'Tuần 4', total: 42 },
    { label: 'Tuần 5', total: 30 },
    { label: 'Tuần 6', total: 50 },
  ],
};

const cloneDate = (date) => new Date(date.getTime());

const subtractRange = (date, range) => {
  const newDate = cloneDate(date);
  switch (range) {
    case 'year':
      newDate.setFullYear(newDate.getFullYear() - 1);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case 'week':
      newDate.setDate(newDate.getDate() - 7);
      break;
    default:
      break;
  }
  return newDate;
};

const getRangeMeta = (date, range) => {
  const year = date.getFullYear();
  switch (range) {
    case 'month': {
      const month = date.getMonth() + 1;
      return {
        key: `${year}-${month}`,
        label: `${month}/${year}`,
        sortKey: year * 100 + month,
      };
    }
    case 'week': {
      const { week } = getIsoWeek(date);
      return {
        key: `${year}-W${week}`,
        label: `Tuần ${week} ${year}`,
        sortKey: year * 100 + week,
      };
    }
    case 'year':
    default:
      return {
        key: String(year),
        label: String(year),
        sortKey: year,
      };
  }
};

const getIsoWeek = (date) => {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  return { year: tempDate.getFullYear(), week: weekNo };
};

const aggregateRevenueData = (payments, range) => {
  if (!payments || payments.length === 0) {
    return FALLBACK_REVENUE_DATA[range] || FALLBACK_REVENUE_DATA.year;
  }

  const buckets = {};
  let latestDate = null;

  payments.forEach((payment) => {
    const amount = Number(payment.amount ?? 0);
    if (!amount) return;

    const date =
      parseDateValue(payment.startDate || payment.createdAt) ||
      parseDateValue(payment.endDate || payment.completedAt);

    if (!date) return;

    if (!latestDate || date > latestDate) {
      latestDate = date;
    }

    const meta = getRangeMeta(date, range);

    if (!buckets[meta.key]) {
      buckets[meta.key] = { ...meta, total: 0 };
    }
    buckets[meta.key].total += amount;
  });

  let result = Object.values(buckets).sort((a, b) => a.sortKey - b.sortKey);

  if (!result.length) {
    return FALLBACK_REVENUE_DATA[range] || FALLBACK_REVENUE_DATA.year;
  }

  const desired = RANGE_MIN_BUCKETS[range] || 6;
  if (result.length < desired && latestDate) {
    const fillers = [];
    const existingKeys = new Set(result.map((item) => item.key));
    let cursor = cloneDate(latestDate);
    while (result.length + fillers.length < desired) {
      cursor = subtractRange(cursor, range);
      const meta = getRangeMeta(cursor, range);
      if (!existingKeys.has(meta.key)) {
        fillers.push({ ...meta, total: 0 });
        existingKeys.add(meta.key);
      }
    }
    result = [...result, ...fillers].sort((a, b) => a.sortKey - b.sortKey);
  }

  return result.map(({ key, ...rest }) => rest);
};

const getStatusKey = (statusService = '') => {
  const normalized = statusService.toLowerCase();
  if (normalized.includes('active')) return 'active';
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('expired') || normalized.includes('cancel')) return 'failed';
  return 'unknown';
};

const normalizePaymentRecord = (record) => {
  const historyId =
    record.historyId ??
    record.HistoryId ??
    record.id ??
    record.Id ??
    `${record.userId || 'unknown'}-${record.createdAt || record.CreatedAt || Date.now()}`;

  const startDate = record.startDate || record.StartDate || null;
  const endDate = record.endDate || record.EndDate || null;
  const createdAt = record.createdAt || record.CreatedAt || null;
  const updatedAt = record.updatedAt || record.UpdatedAt || null;

  const statusServiceValue = record.statusService || record.StatusService || '';
  const statusKey = getStatusKey(statusServiceValue);

  return {
    id: historyId,
    transactionId: record.transactionId || record.TransactionId || `VIP-${historyId}`,
    userName: record.userName || record.UserName || 'Chưa cập nhật',
    userEmail: record.userEmail || record.UserEmail || '—',
    amount: Number(record.amount ?? record.Amount ?? 0),
    statusService: statusServiceValue,
    statusKey,
    planType: record.planName || record.PlanName || 'Gói VIP',
    planDuration: record.planDuration || record.PlanDuration || calculatePlanDuration(startDate, endDate),
    startDate,
    endDate,
    createdAt,
    completedAt: updatedAt,
    expiresAt: endDate,
    failureReason: record.failureReason || record.FailureReason || null,
  };
};

const PaymentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [chartRange, setChartRange] = useState('year');
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await paymentService.getAllHistories();
        if (!isMounted) return;
        const normalized = data.map(normalizePaymentRecord);
        setPayments(normalized);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load payment histories:', err);
        setError(err.message || 'Không thể tải dữ liệu thanh toán');
        setPayments([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  const shouldUseMockFallback = Boolean(error) && mockPayments.length > 0;
  const paymentSource = shouldUseMockFallback ? mockPayments : payments;

  // Format số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format ngày
  const formatDate = (dateValue) => {
    const date = parseDateValue(dateValue);
    if (!date) return '-';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredPayments = useMemo(() => {
    return paymentSource.filter((payment) => {
      const term = searchTerm.toLowerCase();
      const userEmail = payment.userEmail?.toLowerCase() || '';
      const userName = payment.userName?.toLowerCase() || '';
      const transaction = payment.transactionId?.toLowerCase() || '';
      return (
        userEmail.includes(term) ||
        userName.includes(term) ||
        transaction.includes(term)
      );
    });
  }, [paymentSource, searchTerm]);

  // Phân trang
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (statusService) => {
    const statusKey = getStatusKey(statusService);
    const statusConfig = {
      active: { color: '#27ae60', text: 'active', icon: '✓' },
      pending: { color: '#f39c12', text: 'HẾT HẠN', icon: '⏳' },
      failed: { color: '#e74c3c', text: 'failed', icon: '✗' }
    };
    // Always use text from config if statusKey exists, otherwise use statusService or 'unknown'
    const config = statusConfig[statusKey];
    const displayText = config?.text || statusService?.trim() || 'unknown';
    const finalConfig = config || { color: '#95a5a6', text: displayText, icon: '' };
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: finalConfig.color }}
      >
        {finalConfig.icon} {displayText}
      </span>
    );
  };

  // Tính tổng doanh thu - lấy tất cả thanh toán kể cả hết hạn
  const totalRevenue = paymentSource
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTransactions = paymentSource.length;
  const showMockNotice = shouldUseMockFallback && !loading;
  const chartData = useMemo(
    () => aggregateRevenueData(paymentSource, chartRange),
    [paymentSource, chartRange]
  );

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Quản lý thanh toán</h1>
        <p>Theo dõi các giao dịch nâng cấp Premium và thanh toán của người dùng</p>
      </div>

      {loading && (
        <div className="payments-alert payments-alert--info">
          Đang tải dữ liệu thanh toán...
        </div>
      )}

      {error && (
        <div className="payments-alert payments-alert--error">
          {error}
          {showMockNotice && ' • Đang hiển thị dữ liệu mẫu để tiếp tục quan sát.'}
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="payments-alert payments-alert--info">
          Chưa có giao dịch nào được ghi nhận.
        </div>
      )}

      {/* Thống kê */}
      <div className="payments-stats">
        <div className="stat-card">
          <span className="stat-number">{formatCurrency(totalRevenue)}</span>
          <span className="stat-label">Tổng doanh thu</span>
          <button
            className="stat-chart-btn"
            onClick={() => setShowRevenueChart(true)}
          >
            Biểu đồ
          </button>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalTransactions}</span>
          <span className="stat-label">Tổng giao dịch</span>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="payments-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Tìm kiếm theo email, tên, mã giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Bảng thanh toán */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Số tiền</th>
              <th>Gói Premium</th>
              <th>Trạng thái</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Không có giao dịch nào
                </td>
              </tr>
            ) : (
              currentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{payment.userName}</div>
                      <div className="user-email">{payment.userEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className="amount">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td>
                    <div className="plan-info">
                      <span className="plan-type">{payment.planType}</span>
                      <span className="plan-duration">{payment.planDuration}</span>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(payment.statusService)}
                    {payment.failureReason && (
                      <div className="failure-reason">{payment.failureReason}</div>
                    )}
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(payment.startDate || payment.createdAt)}</span>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(payment.endDate || payment.expiresAt || payment.completedAt)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Trước
          </button>
          <span className="pagination-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Sau
          </button>
        </div>
      )}

      {showRevenueChart && (
        <div
          className="chart-modal-overlay"
          onClick={() => setShowRevenueChart(false)}
        >
          <div
            className="chart-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chart-modal-header">
              <h3>Biểu đồ doanh thu</h3>
              <button
                className="chart-close-btn"
                onClick={() => setShowRevenueChart(false)}
                aria-label="Đóng biểu đồ"
              >
                ×
              </button>
            </div>

            <div className="chart-range-tabs">
              {[
                { key: 'year', label: 'Theo năm' },
                { key: 'month', label: 'Theo tháng' },
                { key: 'week', label: 'Theo tuần' },
              ].map((option) => (
                <button
                  key={option.key}
                  className={`chart-range-tab ${
                    chartRange === option.key ? 'active' : ''
                  }`}
                  onClick={() => setChartRange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <RevenueBarChart
              data={chartData}
              formatCurrency={formatCurrency}
              range={chartRange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const RevenueBarChart = ({ data, formatCurrency, range }) => {
  const maxValue = Math.max(...data.map((item) => item.total), 1);
  const ySteps = 4;
  const stepValue = maxValue / ySteps;
  const axisXLabel =
    range === 'year' ? 'Năm' : range === 'month' ? 'Tháng' : 'Tuần';

  return (
    <div className="revenue-chart">
      <div className="chart-axis-y-title">Doanh thu (₫)</div>
      <div className="chart-content">
        <div className="chart-y-axis">
          {Array.from({ length: ySteps + 1 }, (_, idx) => (
            <span key={idx}>
              {formatCurrency(stepValue * (ySteps - idx)).replace('₫', '')}
            </span>
          ))}
        </div>
        <div className="chart-bars">
          {Array.from({ length: ySteps }, (_, idx) => (
            <span
              key={`grid-${idx}`}
              className="chart-grid-line"
              style={{ bottom: `${((idx + 1) / ySteps) * 100}%` }}
            />
          ))}
          {data.map((item) => {
            const heightPercent = (item.total / maxValue) * 100;
            return (
              <div className="chart-bar-wrapper" key={item.label}>
                <div
                  className="chart-bar"
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className="chart-bar-value">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <span className="chart-bar-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="chart-axis-x-label">{axisXLabel}</div>
    </div>
  );
};

export default PaymentManagement;

