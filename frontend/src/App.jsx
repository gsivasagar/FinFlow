import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Budgets from './pages/Budgets';
import RecurringTransactions from './pages/Recurring';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useState } from 'react';

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-slate-900">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute allowedRoles={['viewer', 'analyst', 'admin']}>
                  <Records />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute allowedRoles={['viewer', 'analyst', 'admin']}>
                  <Budgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recurring"
              element={
                <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                  <RecurringTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['viewer', 'analyst', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/records" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <AppLayout />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
