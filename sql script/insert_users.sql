-- SQL Script to Insert Admin and Athlete Accounts
-- Run this script after creating the database and tables

USE aquautm;

-- Insert admin user (password: admin123)
-- Note: The password hash below is for 'admin123' using bcrypt with salt rounds 10
-- IMPORTANT: Replace 'youremail@example.com'with your email.
-- IMPORTANt: IF it said "Incorect password" got to forgot password option to change the password.
INSERT INTO users (first_name, last_name, email, password, role, twofa_enabled) VALUES
('Admin', 'User', 'muhammadfirdaus.ms@graduate.utm.my', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', FALSE);

-- Insert athlete user (password: athlete123)
-- Note: The password hash below is for 'athlete123' using bcrypt with salt rounds 10.
-- IMPORTANt: IF it said "Incorect password" got to forgot password option to change the password. 
INSERT INTO users (first_name, last_name, email, password, role, twofa_enabled) VALUES
('Athlete', 'User', 'ciku137@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'athlete', FALSE);