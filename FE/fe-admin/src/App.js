import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider } from './context';
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

// Layout
import AdminLayout from './components/layout/AdminLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <UsersList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <UserDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/pets" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <PetsList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/pets/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <PetDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ReportsList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ReportDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/activities" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Activities />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;