const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_COOLDOWN_SECS  = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function createOtp(email, purpose = 'verify') {
  // Check cooldown
  const [rows] = await db.query(
    'SELECT created_at FROM otps WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
    [email, purpose]
  );

  if (rows.length) {
    const ageSecs = (Date.now() - new Date(rows[0].created_at).getTime()) / 1000;
    if (ageSecs < OTP_COOLDOWN_SECS) {
      const wait = Math.ceil(OTP_COOLDOWN_SECS - ageSecs);
      const err  = new Error(`Please wait ${wait} seconds before requesting a new OTP.`);
      err.status = 429;
      throw err;
    }
  }

  // Delete old OTPs
  await db.query('DELETE FROM otps WHERE email = ? AND purpose = ?', [email, purpose]);

  const plainOtp  = generateOtp();
  const hash      = await bcrypt.hash(plainOtp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');

  await db.query(
    'INSERT INTO otps (email, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, hash, purpose, expiresAt]
  );

  console.log(`✅ OTP created for ${email} [${purpose}]`);
  return plainOtp;
}

async function verifyOtp(email, plainOtp, purpose = 'verify') {
  const [rows] = await db.query(
    'SELECT id, otp_hash, expires_at FROM otps WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
    [email, purpose]
  );

  if (!rows.length) {
    const err = new Error('No OTP found. Please request a new one.');
    err.status = 400;
    throw err;
  }

  const { id, otp_hash, expires_at } = rows[0];

  if (new Date() > new Date(expires_at)) {
    await db.query('DELETE FROM otps WHERE id = ?', [id]);
    const err = new Error('OTP has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  const valid = await bcrypt.compare(String(plainOtp), otp_hash);
  if (!valid) {
    const err = new Error('Invalid OTP. Please check and try again.');
    err.status = 400;
    throw err;
  }

  await db.query('DELETE FROM otps WHERE id = ?', [id]);
  console.log(`✅ OTP verified for ${email}`);
}

module.exports = { createOtp, verifyOtp };
