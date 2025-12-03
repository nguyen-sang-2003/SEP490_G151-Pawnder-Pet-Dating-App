import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState([]);

  const updatePendingCount = useCallback((count) => {
    setPendingCount(count);
  }, []);

  const updatePendingNotifications = useCallback((notifications) => {
    const pending = notifications.filter(n => n.status === 'pending');
    setPendingNotifications(pending);
    setPendingCount(pending.length);
  }, []);

  return (
    <NotificationContext.Provider value={{
      pendingCount,
      pendingNotifications,
      updatePendingCount,
      updatePendingNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

