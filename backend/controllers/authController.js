require('dotenv').config();
const jwt      = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User     = require('../models/User');
const { createOtp, verifyOtp } = require('../services/otpService');
const { sendOtpEmail }         = require('../services/emailService');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sendError(res, errors) {
  return res.status(422).json({ success: false, message: errors.array()[0].msg });
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors);

    const { full_name, email, phone, password } = req.body;
    console.log(`📝 Register attempt: ${email}`);

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    await User.create({ full_name, email, phone, password });
    console.log(`✅ User created: ${email}`);

    const otp = await createOtp(email, 'verify');
    const emailResult = await sendOtpEmail(email, full_name, otp, 'verify');

    return res.status(201).json({
      success: true,
      message: emailResult?.fallback
        ? 'Account created! The OTP was generated, but email delivery is currently unavailable. Check the server logs for the code.'
        : 'Account created! Check your email for the 6-digit OTP.',
      ...(emailResult?.fallback ? { otp, fallback: true } : {}),
    });
  } catch (err) {
    console.error('❌ Register error:', err.message);
    next(err);
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors);

    const { email, otp } = req.body;
    console.log(`🔑 Verify OTP attempt: ${email}`);

    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified. Please log in.' });

    await verifyOtp(email, otp, 'verify');
    await User.markVerified(email);

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Email verified! Welcome to Namma Coach.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('❌ Verify error:', err.message);
    next(err);
  }
};

// POST /api/auth/resend-otp
exports.resendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'verify' } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'No account found.' });

    const otp = await createOtp(email, purpose);
    const emailResult = await sendOtpEmail(email, user.full_name, otp, purpose);

    return res.json({
      success: true,
      message: emailResult?.fallback
        ? 'OTP was generated, but email delivery is currently unavailable. Check the server logs for the code.'
        : 'New OTP sent to your email.',
      ...(emailResult?.fallback ? { otp, fallback: true } : {}),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors);

    const { email, password } = req.body;
    console.log(`🔐 Login attempt: ${email}`);

    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const match = await User.checkPassword(password, user.password_hash);
    if (!match)  return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.is_verified) {
      let fallbackOtp = '';
      let fallbackMode = false;
      try {
        const otp = await createOtp(email, 'verify');
        fallbackOtp = otp;
        const emailResult = await sendOtpEmail(email, user.full_name, otp, 'verify');
        fallbackMode = Boolean(emailResult?.fallback);
      } catch (err) {
        console.warn('⚠️ OTP email delivery skipped during login:', err.message);
      }

      return res.status(403).json({
        success: false,
        message: fallbackMode
          ? 'Please verify your email first. The OTP was generated, but email delivery is unavailable. Use the code shown on screen.'
          : 'Please verify your email first. A new OTP has been sent.',
        needsVerification: true,
        ...(fallbackMode ? { otp: fallbackOtp, fallback: true } : {}),
      });
    }

    const token = signToken(user);
    console.log(`✅ Login success: ${email}`);
    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });

    const otp = await createOtp(email, 'reset');
    const emailResult = await sendOtpEmail(email, user.full_name, otp, 'reset');

    return res.json({
      success: true,
      message: emailResult?.fallback
        ? 'Password reset code was generated, but email delivery is currently unavailable. Check the server logs for the code.'
        : 'Password reset code sent to your email.',
      ...(emailResult?.fallback ? { otp, fallback: true } : {}),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors);

    const { email, otp, new_password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'No account found.' });

    await verifyOtp(email, otp, 'reset');
    await User.updatePassword(email, new_password);

    return res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/send-contact-otp
// Sends OTP to email for contact form verification (no account needed)
exports.sendContactOtp = async (req, res, next) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }
    const { email, name } = req.body;
    console.log(`📧 Contact OTP request: ${email}`);
    const otp = await createOtp(email, 'verify');
    const emailResult = await sendOtpEmail(email, name, otp, 'verify');
    return res.json({
      success: true,
      message: emailResult?.fallback
        ? 'OTP generated, but email delivery is currently unavailable. Check the server logs for the code.'
        : 'OTP sent to your email!',
      ...(emailResult?.fallback ? { otp, fallback: true } : {}),
    });
  } catch (err) {
    console.error('❌ Send contact OTP error:', err.message);
    next(err);
  }
};

// POST /api/auth/verify-contact-otp
exports.verifyContactOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await verifyOtp(email, otp, 'verify');
    return res.json({ success: true, message: 'OTP verified! You can now proceed to payment.' });
  } catch (err) {
    console.error('❌ Verify contact OTP error:', err.message);
    next(err);
  }
};
