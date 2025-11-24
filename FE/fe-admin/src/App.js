import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider } from './context';
import { NotificationProvider } from './context/NotificationContext';
import { STORAGE_KEYS } from './constants';
import './App.css';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import UsersList from './pages/users/UsersList';
import UserDetail from './pages/users/UserDetail';
import PetsList from './pages/pets/PetsList';
import PetDetail from './pages/pets/PetDetail';
import ReportsList from './pages/reports/ReportsList';
import ReportDetail from './pages/reports/ReportDetail';
import Activities from './pages/activities/Activities';
import PaymentManagement from './pages/payments/PaymentManagement';
import ExpertNotifications from './pages/expert/ExpertNotifications';
import ExpertChat from './pages/expert/ExpertChat';
import ExpertList from './pages/expert/ExpertList';
import ExpertDetail from './pages/expert/ExpertDetail';
import CreateExpert from './pages/expert/CreateExpert';
import AttributeManagement from './pages/attributes/AttributeManagement';

// Layout
import AdminLayout from './components/layout/AdminLayout';
import ExpertLayout from './components/layout/ExpertLayout';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';
import { USER_ROLES } from './constants';
import { useAuth } from './context/AuthContext';

// Redirect component based on role
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === USER_ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  } else if (user.role === USER_ROLES.EXPERT) {
    return <Navigate to="/expert/notifications" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route path="/" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <UsersList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <UserDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/pets" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PetsList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/pets/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PetDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <ReportsList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <ReportDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/activities" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <Activities />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/payments" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PaymentManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/attributes" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <AttributeManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/experts" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <ExpertList />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/experts/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <ExpertDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/experts/create" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <CreateExpert />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* Expert Routes */}
              <Route path="/expert/notifications" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.EXPERT]}>
                  <ExpertLayout>
                    <ExpertNotifications />
                  </ExpertLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/expert/chat" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.EXPERT]}>
                  <ExpertLayout>
                    <ExpertChat />
                  </ExpertLayout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
          </div>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;