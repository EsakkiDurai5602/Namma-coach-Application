// Run this once to create database and tables automatically
// Command: node setup-db.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
  console.log('\n🔧 Setting up Namma Coach database...\n');

  let conn;
  try {
    // Connect WITHOUT database first
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL');

    // Create database
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'namma_coach'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${process.env.DB_NAME}' ready`);

    await conn.query(`USE \`${process.env.DB_NAME || 'namma_coach'}\``);

    // Create users table
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
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table: users');

    // Create otps table
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
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table: otps');

    console.log('\n🎉 Database setup complete! You can now run: npm run dev\n');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → MySQL is not running. Please start XAMPP MySQL first.\n');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Wrong MySQL username or password. Check DB_USER and DB_PASSWORD in .env\n');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setup();
