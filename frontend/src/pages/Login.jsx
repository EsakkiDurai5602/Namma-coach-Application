// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export default function Login() {
  const navigate    = useNavigate();
  const { login }   = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const backendData = err.response?.data;
      if (backendData?.needsVerification) {
        setError(backendData.message || err.message);
        setTimeout(() => navigate('/verify-email', {
          state: {
            email: form.email,
            purpose: 'verify',
            otp: backendData?.otp || '',
            fallback: Boolean(backendData?.fallback),
            message: backendData?.message || '',
          },
        }), 2000);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">NAMMA COACH</div>
          <div className="auth-brand-sub">Career Guidance &amp; Mentorship</div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your journey.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email"
              className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email" autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
              <Link to="/forgot-password" className="auth-link" style={{ float: 'right', fontWeight: 500, fontSize: 12 }}>
                Forgot?
              </Link>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" name="password" type={showPw ? 'text' : 'password'}
                className="form-input" placeholder="Your password"
                value={form.password} onChange={handleChange}
                style={{ paddingRight: 44 }}
                required autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth btn-auth-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          New to Namma Coach?{' '}
          <Link to="/register" className="auth-link">Create an account</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" className="auth-link" style={{ fontSize: 13, color: 'var(--slate)' }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
