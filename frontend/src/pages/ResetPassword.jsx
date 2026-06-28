// src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import '../styles/auth.css';

function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthColors = ['#dc2626','#f97316','#eab308','#16a34a'];

export default function ResetPassword() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const email = location.state?.email || '';
  const otp   = location.state?.otp   || '';

  const [form,    setForm]    = useState({ new_password: '', confirm_new_password: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const score = pwStrength(form.new_password);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm_new_password) {
      setError('Passwords do not match.'); return;
    }
    if (score < 2) {
      setError('Choose a stronger password (8+ chars, 1 uppercase, 1 number).'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, ...form });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="auth-title">Password reset!</h2>
          <p className="auth-subtitle">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">NAMMA COACH</div>
          <div className="auth-brand-sub">Career Guidance &amp; Mentorship</div>
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="new_password">New Password</label>
            <input
              id="new_password" name="new_password" type="password"
              className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.new_password} onChange={handleChange}
              required autoFocus autoComplete="new-password"
            />
            {form.new_password && (
              <>
                <div className="pw-strength" style={{ marginTop: 8 }}>
                  <div className="pw-bar" style={{
                    width: `${(score / 4) * 100}%`,
                    background: strengthColors[score - 1] || '#e1f0fa',
                  }} />
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm_new_password">Confirm New Password</label>
            <input
              id="confirm_new_password" name="confirm_new_password" type="password"
              className={`form-input${form.confirm_new_password && form.confirm_new_password !== form.new_password ? ' error' : ''}`}
              placeholder="Repeat new password"
              value={form.confirm_new_password} onChange={handleChange}
              required autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-auth btn-auth-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
