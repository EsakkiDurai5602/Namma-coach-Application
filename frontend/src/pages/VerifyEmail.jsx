// src/pages/VerifyEmail.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const email       = location.state?.email   || '';
  const purpose     = location.state?.purpose || 'verify';
  const fallbackOtp = location.state?.otp || '';
  const fallbackMode = Boolean(location.state?.fallback);
  const fallbackMessage = location.state?.message || '';

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown,  setCooldown]  = useState(RESEND_COOLDOWN);

  const inputsRef = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (fallbackOtp && fallbackOtp.length === OTP_LENGTH) {
      setDigits(fallbackOtp.split(''));
    }
  }, [fallbackOtp]);

  function focusInput(idx) {
    inputsRef.current[idx]?.focus();
  }

  function handleDigitChange(idx, value) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError('');
    if (char && idx < OTP_LENGTH - 1) focusInput(idx + 1);
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        focusInput(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      focusInput(idx + 1);
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setDigits(pasted.split(''));
      focusInput(OTP_LENGTH - 1);
    }
    e.preventDefault();
  }

  const submitOtp = useCallback(async (otp) => {
    setError('');
    setLoading(true);
    try {
      const endpoint = purpose === 'reset' ? '/auth/reset-password' : '/auth/verify-email';

      if (purpose === 'reset') {
        // Just verify; actual reset handled on next page
        navigate('/reset-password', { state: { email, otp } });
        return;
      }

      const { data } = await api.post(endpoint, { email, otp });
      if (data.token) login(data.token, data.user);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.message);
      setDigits(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    } finally {
      setLoading(false);
    }
  }, [email, purpose, login, navigate]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every(d => d !== '')) {
      submitOtp(digits.join(''));
    }
  }, [digits, submitOtp]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const { data } = await api.post('/auth/resend-otp', { email, purpose });
      if (data?.otp && data?.fallback) {
        setDigits(data.otp.split(''));
      } else {
        setDigits(Array(OTP_LENGTH).fill(''));
      }
      setCooldown(RESEND_COOLDOWN);
      focusInput(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="auth-title">Email Verified!</h2>
          <p className="auth-subtitle">Welcome to Namma Coach. Redirecting you now…</p>
        </div>
      </div>
    );
  }

  const isVerify = purpose === 'verify';
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(0, b.length)) + c);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">NAMMA COACH</div>
          <div className="auth-brand-sub">Career Guidance &amp; Mentorship</div>
        </div>

        <button className="back-link" onClick={() => navigate(isVerify ? '/register' : '/forgot-password')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <h1 className="auth-title">{isVerify ? 'Verify your email' : 'Enter reset code'}</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{maskedEmail}</strong>.<br />
          Check your inbox (and spam folder).
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {(fallbackMode || fallbackMessage) && (
          <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r="1"/></svg>
            {fallbackMessage || 'Email delivery is unavailable right now. Use the code below to continue.'}
            {fallbackOtp && <div style={{ marginTop: 8, fontWeight: 700, letterSpacing: '0.2em' }}>{fallbackOtp}</div>}
          </div>
        )}

        <div className="otp-group" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              className={`otp-input${d ? ' filled' : ''}`}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          className="btn-auth btn-auth-primary"
          onClick={() => submitOtp(digits.join(''))}
          disabled={loading || digits.some(d => !d)}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Verifying…' : isVerify ? 'Verify Email' : 'Continue'}
        </button>

        <div className="resend-row">
          {cooldown > 0 ? (
            <>Resend code in <span className="resend-countdown">{cooldown}s</span></>
          ) : (
            <>
              Didn&apos;t receive it?{' '}
              <button
                className="auth-link"
                onClick={handleResend}
                disabled={resending}
                style={{ background: 'none', padding: 0, fontSize: 'inherit' }}
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
