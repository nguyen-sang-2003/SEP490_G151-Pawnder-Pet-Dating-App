import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({
    policies: location.pathname.startsWith('/policies'),
  });

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      label: 'Bảng điều khiển',
      exact: true
    },
    {
      path: '/users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: 'Quản lý người dùng'
    },
    {
      path: '/pets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
        </svg>
      ),
      label: 'Quản lý thú cưng'
    },
    {
      path: '/attributes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.09 6.26H20l-5.17 3.76L16.18 18 12 13.97 7.82 18l1.35-5.98L4 8.26h5.91z"/>
        </svg>
      ),
      label: 'Quản lý thuộc tính'
    },
    {
      key: 'policies',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="9" y1="9" x2="10" y2="9"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
      ),
      label: 'Quản lý Policy',
      isGroup: true,
      children: [
        { path: '/policies', label: 'Policies', exact: true },
        { path: '/policies/drafts', label: 'Draft Versions' },
      ]
    },
    {
      path: '/badwords',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      label: 'Quản lý từ cấm'
    },
    {
      path: '/reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      label: 'Báo cáo'
    },
    {
      path: '/payments',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
          <path d="M12 18h.01"/>
        </svg>
      ),
      label: 'Quản lý thanh toán'
    },
    {
      path: '/events',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M8 14h.01"/>
          <path d="M12 14h.01"/>
          <path d="M16 14h.01"/>
          <path d="M8 18h.01"/>
          <path d="M12 18h.01"/>
        </svg>
      ),
      label: 'Quản lý sự kiện'
    },
    {
      path: '/notifications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      label: 'Thông báo hệ thống'
    },
    {
      path: '/experts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/>
        </svg>
      ),
      label: 'Quản lý Expert',
      exact: true
    },
    {
      path: '/experts/create',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/>
          <line x1="12" y1="12" x2="12" y2="20"/>
          <line x1="9" y1="16" x2="15" y2="16"/>
        </svg>
      ),
      label: 'Tạo tài khoản Expert'
    }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            item.isGroup ? (
              <li key={item.key} className="nav-item nav-group">
                <button
                  className={`nav-link nav-group-toggle ${expandedMenus[item.key] ? 'expanded' : ''}`}
                  onClick={() => toggleMenu(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </button>
                {expandedMenus[item.key] && (
                  <ul className="nav-submenu">
                    {item.children.map((child) => (
                      <li key={child.path} className="nav-subitem">
                        <NavLink
                          to={child.path}
                          className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                          end={child.exact}
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
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
            )
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
