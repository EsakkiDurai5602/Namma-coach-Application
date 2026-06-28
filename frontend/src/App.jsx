// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute   from './components/ProtectedRoute';

import Home          from './pages/Home';
import Register      from './pages/Register';
import VerifyEmail   from './pages/VerifyEmail';
import Login         from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard     from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Home page — loads first */}
          <Route path="/"               element={<Home />} />

          {/* Auth */}
          <Route path="/register"        element={<Register />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
