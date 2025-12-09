import React from 'react';
import Header from '../common/Header';
import ExpertSidebar from '../common/ExpertSidebar';
import './styles/AdminLayout.css';

const ExpertLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-content">
        <ExpertSidebar />
        <main className="admin-main">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExpertLayout;

