-- SQL Script to Alter Existing Tables for 2FA and Forgot Password Features
-- Run this script after ensuring users and login_logs tables exist

USE aquautm;

-- Alter users table to add 2FA enabled column
ALTER TABLE users ADD COLUMN twofa_enabled BOOLEAN DEFAULT FALSE;

-- Alter users table to add role column
ALTER TABLE users ADD COLUMN role ENUM('admin', 'athlete', 'member') DEFAULT 'member';

-- Create verification_codes table for 2FA
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create password_resets table (if not already exists)
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
