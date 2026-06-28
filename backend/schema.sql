-- ============================================================
--  Namma Coach — MySQL Database Schema
--  Run this once to initialise the database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS namma_coach CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE namma_coach;

-- ─── Users ────────────────────────────────────────────────────
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
) ENGINE=InnoDB;

-- ─── OTPs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,   -- bcrypt hash of the 6-digit code
  purpose     ENUM('verify','reset')   NOT NULL DEFAULT 'verify',
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email_purpose (email, purpose)
) ENGINE=InnoDB;
