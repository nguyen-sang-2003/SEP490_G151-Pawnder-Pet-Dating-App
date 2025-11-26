import React, { useState } from 'react';
import { mockPayments } from '../../data/mockPayments';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Format số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lọc và tìm kiếm
  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = 
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || payment.paymentMethod === filterPaymentMethod;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: '#27ae60', text: 'Thành công', icon: '✓' },
      pending: { color: '#f39c12', text: 'Đang xử lý', icon: '⏳' },
      failed: { color: '#e74c3c', text: 'Thất bại', icon: '✗' }
    };
    const config = statusConfig[status] || { color: '#95a5a6', text: status, icon: '' };
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  // Tính tổng doanh thu
  const totalRevenue = mockPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = mockPayments.filter(p => p.status === 'completed').length;
  const pendingPayments = mockPayments.filter(p => p.status === 'pending').length;
  const failedPayments = mockPayments.filter(p => p.status === 'failed').length;

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Quản lý thanh toán</h1>
        <p>Theo dõi các giao dịch nâng cấp Premium và thanh toán của người dùng</p>
      </div>

      {/* Thống kê */}
      <div className="payments-stats">
        <div className="stat-card">
          <span className="stat-number">{formatCurrency(totalRevenue)}</span>
          <span className="stat-label">Tổng doanh thu</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{completedPayments}</span>
          <span className="stat-label">Giao dịch thành công</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pendingPayments}</span>
          <span className="stat-label">Đang xử lý</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{failedPayments}</span>
          <span className="stat-label">Thất bại</span>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="payments-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo email, tên, mã giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Đang xử lý</option>
            <option value="failed">Thất bại</option>
          </select>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả phương thức</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="E-Wallet">E-Wallet</option>
          </select>
        </div>
      </div>

      {/* Bảng thanh toán */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Người dùng</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Gói Premium</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Ngày hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Không có giao dịch nào
                </td>
              </tr>
            ) : (
              currentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <span className="transaction-id">{payment.transactionId}</span>
                  </td>
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
                    <span className="payment-method">{payment.paymentMethod}</span>
                  </td>
                  <td>
                    <div className="plan-info">
                      <span className="plan-type">{payment.planType}</span>
                      <span className="plan-duration">{payment.planDuration}</span>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(payment.status)}
                    {payment.failureReason && (
                      <div className="failure-reason">{payment.failureReason}</div>
                    )}
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(payment.createdAt)}</span>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(payment.completedAt)}</span>
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
    </div>
  );
};

export default PaymentManagement;

