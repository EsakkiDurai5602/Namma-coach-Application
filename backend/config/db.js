const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'namma_coach';

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

async function ensureDatabaseExists() {
  const adminConnection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await adminConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await adminConnection.end();
}

async function ensureTablesExist() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        full_name     VARCHAR(120)    NOT NULL,
        email         VARCHAR(255)    NOT NULL UNIQUE,
        phone         VARCHAR(20)     NOT NULL,
        password_hash VARCHAR(255)    NOT NULL,
        is_verified   TINYINT(1)      NOT NULL DEFAULT 0,
        created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email       VARCHAR(255) NOT NULL,
        otp_hash    VARCHAR(255) NOT NULL,
        purpose     ENUM('verify','reset') NOT NULL DEFAULT 'verify',
        expires_at  DATETIME     NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_email_purpose (email, purpose)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } finally {
    conn.release();
  }
}

async function initialize() {
  await ensureDatabaseExists();
  await ensureTablesExist();
  await pool.query('SELECT 1');
}

pool.initialize = initialize;

module.exports = pool;
