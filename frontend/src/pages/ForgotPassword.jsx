// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      setTimeout(() => navigate('/verify-email', {
        state: {
          email,
          purpose: 'reset',
          otp: data?.otp || '',
          fallback: Boolean(data?.fallback),
          message: data?.message || '',
        },
      }), 2000);
    } catch (err) {
      setError(err.message);
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

        <button className="back-link" onClick={() => navigate('/login')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to login
        </button>

        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">
          Enter your registered email and we&apos;ll send you a 6-digit reset code.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {sent && (
          <div className="alert alert-success" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Reset code sent! Redirecting…
          </div>
        )}

        {!sent && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email" type="email"
                className="form-input" placeholder="you@example.com"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                required autoFocus autoComplete="email"
              />
            </div>
            <button type="submit" className="btn-auth btn-auth-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
