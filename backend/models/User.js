// models/User.js
const db   = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  /** Find a user by email. Returns the row or null. */
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  /** Find a user by id. */
  async findById(id) {
    const [rows] = await db.query('SELECT id, full_name, email, phone, is_verified, created_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  /** Create a new (unverified) user. Returns inserted id. */
  async create({ full_name, email, phone, password }) {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, phone, hash]
    );
    return result.insertId;
  },

  /** Mark email as verified. */
  async markVerified(email) {
    await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);
  },

  /** Update password. */
  async updatePassword(email, newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
  },

  /** Compare plaintext password against stored hash. */
  async checkPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },
};

module.exports = User;
