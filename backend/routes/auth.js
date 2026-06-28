const express  = require('express');
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const auth     = require('../middleware/auth');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register
router.post('/register', otpLimiter, [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
], ctrl.register);

// POST /api/auth/verify-email
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
], ctrl.verifyEmail);

// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
], ctrl.resendOtp);

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], ctrl.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', otpLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
], ctrl.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain a number.'),
  body('confirm_new_password').custom((val, { req }) => {
    if (val !== req.body.new_password) throw new Error('Passwords do not match.');
    return true;
  }),
], ctrl.resetPassword);

// POST /api/auth/send-phone-otp  ← NEW: send OTP to email for contact form
router.post('/send-contact-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
], ctrl.sendContactOtp);

// POST /api/auth/verify-contact-otp  ← NEW: verify OTP for contact form
router.post('/verify-contact-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
], ctrl.verifyContactOtp);

// GET /api/auth/me
router.get('/me', auth, ctrl.getMe);

module.exports = router;
