import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider } from '../shared/context';
import { NotificationProvider } from '../shared/context/NotificationContext';
import { STORAGE_KEYS, USER_ROLES } from '../shared/constants';
import './styles/App.css';

// Features
import { Login } from '../features/auth';
import { Dashboard } from '../features/dashboard';
import { UsersList, UserDetail } from '../features/users';
import { PetsList, PetDetail, Activities } from '../features/pets';
import { ReportsList, ReportDetail } from '../features/reports';
import { PaymentManagement } from '../features/payments';
import { ExpertList, ExpertDetail, CreateExpert, ExpertChat, ExpertChatAI, ExpertNotifications } from '../features/experts';
import { AttributeManagement } from '../features/attributes';
import { PolicyList, PolicyDetail, DraftVersions } from '../features/policies';
import { BadWordList, BadWordDetail, BadWordEdit } from '../features/badwords';
import { EventList, EventDetail, EventForm } from '../features/events';
import { BroadcastList } from '../features/notifications';

// Layout
import AdminLayout from '../components/layout/AdminLayout';
import ExpertLayout from '../components/layout/ExpertLayout';

// Protected Route Component
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../shared/context/AuthContext';

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

              <Route path="/policies" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PolicyList />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/policies/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PolicyDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/policies/drafts" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <DraftVersions />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* Bad Word Routes */}
              <Route path="/badwords" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <BadWordList />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/badwords/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <BadWordDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/badwords/:id/edit" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <BadWordEdit />
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

              {/* Event Routes */}
              <Route path="/events" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <EventList />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/events/create" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <EventForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/events/:id" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <EventDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/events/:id/edit" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <EventForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* Broadcast Notification Routes */}
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <BroadcastList />
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
              
              <Route path="/expert/chat-ai" element={
                <ProtectedRoute allowedRoles={[USER_ROLES.EXPERT]}>
                  <ExpertLayout>
                    <ExpertChatAI />
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