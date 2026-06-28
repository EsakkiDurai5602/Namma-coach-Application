// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const windowMs = 15 * 60 * 1000; // 15 minutes

/** Strict limiter for OTP send endpoints */
exports.otpLimiter = rateLimit({
  windowMs,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** Login endpoint limiter */
exports.loginLimiter = rateLimit({
  windowMs,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** General API limiter */
exports.apiLimiter = rateLimit({
  windowMs,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
