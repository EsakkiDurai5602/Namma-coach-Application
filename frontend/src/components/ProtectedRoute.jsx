// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--slate)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--blue-200)', borderTopColor: 'var(--blue-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          Loading…
        </div>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
