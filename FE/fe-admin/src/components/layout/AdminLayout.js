import React from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import './styles/AdminLayout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-content">
        <Sidebar />
        <main className="admin-main">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
