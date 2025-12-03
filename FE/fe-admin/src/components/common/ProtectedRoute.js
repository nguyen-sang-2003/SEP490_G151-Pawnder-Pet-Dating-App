import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { STORAGE_KEYS, USER_ROLES } from '../../shared/constants';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  // Check authentication
  if (!token || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(user.role);
    if (!hasAccess) {
      // Redirect based on role
      if (user.role === USER_ROLES.ADMIN) {
        return <Navigate to="/dashboard" replace />;
      } else if (user.role === USER_ROLES.EXPERT) {
        return <Navigate to="/expert/notifications" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;

