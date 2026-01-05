-- Full Database Script for AquaUTM System
-- This script creates the entire database, tables, alters them, and inserts initial data

CREATE DATABASE IF NOT EXISTS aquautm;
USE aquautm;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member', 'athlete', 'guest') DEFAULT 'member',
    profile_pic VARCHAR(255) DEFAULT '/images/default-profile.png',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create login_logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

-- Create schedules table for calendar events
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    target_role ENUM('all', 'member', 'athlete') NOT NULL,
    type ENUM('event', 'class') DEFAULT 'event',
    instructor VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_path VARCHAR(500),
    link VARCHAR(500),
    target_role ENUM('member', 'athlete', 'all') NOT NULL DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create events table (for events.html page)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    event_time TIME,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feedback table
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(100),
    role VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert admin user (password: admin123)
-- Note: The password hash below is for 'admin123' using bcrypt with salt rounds 10
-- IMPORTANT: Replace 'youremail@example.com' with your email.
-- IMPORTANT: If it says "Incorrect password" go to forgot password option to change the password.
INSERT INTO users (first_name, last_name, email, password, role, twofa_enabled) VALUES
('Admin', 'User', 'muhammadfirdaus.ms@graduate.utm.my', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', FALSE);

-- Insert athlete user (password: athlete123)
-- Note: The password hash below is for 'athlete123' using bcrypt with salt rounds 10.
-- IMPORTANT: If it says "Incorrect password" go to forgot password option to change the password.
INSERT INTO users (first_name, last_name, email, password, role, twofa_enabled) VALUES
('Athlete', 'User', 'ciku137@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'athlete', FALSE);

-- Example events for events.html page
INSERT INTO events (title, description, event_date, event_time, location) VALUES
(
    'Swimming Competition - December 2023',
    'Annual swimming competition for all age groups and skill levels.',
    '2023-12-15',
    '09:00:00',
    'Kolam Renang UTM'
),
(
    'Swimming Lessons for Beginners',
    'Weekly swimming lessons for beginners.',
    '2024-01-06',
    '10:00:00',
    'Kolam Renang UTM'
);

-- Example schedules for calendar
INSERT INTO schedules (title, start_date, end_date, target_role, type, instructor, location, description) VALUES
(
    'Morning Training Session',
    '2024-01-15 08:00:00',
    '2024-01-15 10:00:00',
    'athlete',
    'class',
    'Coach Ahmad',
    'Main Pool',
    'Intensive training for competitive swimmers'
),
(
    'General Meeting',
    '2024-01-20 18:00:00',
    '2024-01-20 19:00:00',
    'all',
    'event',
    NULL,
    'Club House',
    'Monthly general meeting for all members'
);

-- Example announcements
INSERT INTO announcements (title, content, target_role, created_by) VALUES
(
    'Welcome to AquaUTM',
    'Welcome to the UTM Aquatic Sports Club! We are excited to have you join our community.',
    'all',
    1
),
(
    'New Training Schedule',
    'Please check the updated training schedule for January 2024.',
    'athlete',
    1
);
