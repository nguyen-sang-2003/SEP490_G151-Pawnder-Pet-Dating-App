import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import './styles/Sidebar.css';

const ExpertSidebar = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      path: '/expert/notifications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      label: 'Thông báo chờ xác nhận',
      exact: true
    },
    {
      path: '/expert/chat',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: 'Chat với người dùng',
      exact: true
    },
    {
      path: '/expert/chat-ai',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      label: 'Chat với AI',
      exact: true
    },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end={item.exact}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-number">{user?.FullName || 'Expert'}</span>
            <span className="stat-label">Chuyên gia</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ExpertSidebar;

