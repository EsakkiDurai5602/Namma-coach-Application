// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/auth.css';

function pwStrength(pw) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score; // 0–4
}
const strengthColors = ['#dc2626','#f97316','#eab308','#16a34a'];
const strengthLabels = ['Too weak','Weak','Fair','Strong'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const score = pwStrength(form.password);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.'); return;
    }
    if (score < 2) {
      setError('Please choose a stronger password (min 8 chars, 1 uppercase, 1 number).'); return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      navigate('/verify-email', {
        state: {
          email: form.email,
          purpose: 'verify',
          otp: data?.otp || '',
          fallback: Boolean(data?.fallback),
          message: data?.message || '',
        },
      });
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands finding their path with personalised coaching.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <input
              id="full_name" name="full_name" type="text"
              className="form-input" placeholder="Priya Sharma"
              value={form.full_name} onChange={handleChange}
              required autoComplete="name" autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email"
              className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone" name="phone" type="tel"
              className="form-input" placeholder="+91 98765 43210"
              value={form.phone} onChange={handleChange}
              required autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password} onChange={handleChange}
              required autoComplete="new-password"
            />
            {form.password && (
              <>
                <div className="pw-strength" style={{ marginTop: 8 }}>
                  <div className="pw-bar" style={{
                    width: `${(score / 4) * 100}%`,
                    background: strengthColors[score - 1] || '#e1f0fa',
                  }} />
                </div>
                <div style={{ fontSize: 12, color: strengthColors[score - 1] || 'var(--slate)', marginTop: 4 }}>
                  {strengthLabels[score - 1] || ''}
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
            <input
              id="confirm_password" name="confirm_password" type="password"
              className={`form-input${form.confirm_password && form.confirm_password !== form.password ? ' error' : ''}`}
              placeholder="Repeat password"
              value={form.confirm_password} onChange={handleChange}
              required autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-auth btn-auth-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account…' : 'Create Account & Send OTP'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
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
