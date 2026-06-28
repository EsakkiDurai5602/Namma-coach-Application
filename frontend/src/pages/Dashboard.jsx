// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ice-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)', padding: '44px 40px',
        maxWidth: 500, width: '100%', textAlign: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--navy-900), var(--blue-600))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--white)', fontFamily: 'var(--font-display)',
          fontWeight: 800, fontSize: 28,
        }}>
          {user?.full_name?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-900)', marginBottom: 8 }}>
          NAMMA COACH
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>
          Welcome, {user?.full_name?.split(' ')[0]}! 👋
        </h2>
        <p style={{ color: 'var(--slate)', fontSize: 14, marginBottom: 32 }}>
          Your email <strong>{user?.email}</strong> is verified and your account is active.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/"
            style={{
              padding: '12px 24px', borderRadius: '999px',
              background: 'linear-gradient(90deg, var(--blue-600), var(--blue-500))',
              color: 'var(--white)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to website
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px', borderRadius: '999px',
              background: 'var(--ice-50)', border: '1.5px solid var(--blue-200)',
              color: 'var(--blue-600)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
