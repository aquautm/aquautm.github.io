-- SQL Script to Enable 2FA for All Existing Users
-- Run this script to set twofa_enabled = TRUE for all users in the database

USE aquautm;

-- Update all users to have 2FA enabled
UPDATE users SET twofa_enabled = TRUE;