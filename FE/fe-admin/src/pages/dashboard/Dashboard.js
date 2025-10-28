import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [showUserChart, setShowUserChart] = useState(false);
  const navigate = useNavigate();

  // Dữ liệu biểu đồ người dùng theo tháng/năm
  const userChartData = [
    { month: 'T1/2023', users: 850 },
    { month: 'T2/2023', users: 920 },
    { month: 'T3/2023', users: 920 },
    { month: 'T4/2023', users: 800 },
    { month: 'T5/2023', users: 800 },
    { month: 'T6/2023', users: 1100 },
    { month: 'T7/2023', users: 1100 },
    { month: 'T8/2023', users: 750 },
    { month: 'T9/2023', users: 1400 },
    { month: 'T10/2023', users: 1200 },
    { month: 'T11/2023', users: 1200 },
    { month: 'T12/2023', users: 950 },
    { month: 'T1/2024', users: 950 },
    { month: 'T2/2024', users: 1300 },
    { month: 'T3/2024', users: 800 },
    { month: 'T4/2024', users: 1234 }
  ];
  const stats = [
    {
      title: 'Tổng người dùng',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: '#667eea'
    },
    {
      title: 'Tổng thú cưng',
      value: '2,456',
      change: '+8%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
        </svg>
      ),
      color: '#764ba2'
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: '12',
      change: '-3%',
      changeType: 'negative',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      color: '#e74c3c'
    },
    {
      title: 'Ghép đôi thành công',
      value: '89',
      change: '+15%',
      changeType: 'positive',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      color: '#27ae60'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user',
      message: 'Người dùng mới đăng ký: john_doe',
      time: '5 phút trước',
      avatar: '👤'
    },
    {
      id: 2,
      type: 'pet',
      message: 'Thú cưng mới được thêm: Buddy',
      time: '15 phút trước',
      avatar: '🐕'
    },
    {
      id: 3,
      type: 'report',
      message: 'Báo cáo mới từ user123',
      time: '30 phút trước',
      avatar: '⚠️'
    },
    {
      id: 4,
      type: 'match',
      message: 'Ghép đôi thành công: Luna & Max',
      time: '1 giờ trước',
      avatar: '💕'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Chào mừng trở lại! Đây là tổng quan về hệ thống Pawnder.</p>
      </div>
      
      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ '--card-color': stat.color }}>
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.changeType}`}>
                {stat.change} so với tháng trước
              </div>
              {stat.title === 'Tổng người dùng' && (
                <button 
                  className="chart-toggle-btn"
                  onClick={() => setShowUserChart(!showUserChart)}
                >
                  {showUserChart ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ người dùng */}
      {showUserChart && (
        <div className="chart-container">
          <div className="chart-header">
            <h3>Biểu đồ tăng trưởng người dùng</h3>
            <p>Số liệu người dùng theo từng tháng</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userChartData}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Người dùng']}
                  labelFormatter={(label) => `Tháng: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e1e8ed',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#FFD700" 
                  strokeWidth={2}
                  fill="rgba(255, 215, 0, 0.3)"
                  dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#FFD700', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Hoạt động gần đây</h2>
            <button 
              onClick={() => navigate('/activities')} 
              className="view-all"
            >
              Xem tất cả
            </button>
          </div>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-avatar">
                  {activity.avatar}
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Thống kê nhanh</h2>
          </div>
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-label">Người dùng hoạt động hôm nay</span>
              <span className="quick-stat-value">156</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Thú cưng được duyệt</span>
              <span className="quick-stat-value">23</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Báo cáo đã xử lý</span>
              <span className="quick-stat-value">8</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Tỷ lệ hài lòng</span>
              <span className="quick-stat-value">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
