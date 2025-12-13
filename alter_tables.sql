USE aquautm;

-- Add missing columns to users table
ALTER TABLE users
ADD COLUMN role ENUM('admin', 'member', 'athlete', 'guest') DEFAULT 'member' AFTER password,
ADD COLUMN profile_pic VARCHAR(255) DEFAULT '/images/default-profile.png' AFTER role,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE AFTER profile_pic;

-- Update existing users to have default role if not set
UPDATE users SET role = 'member' WHERE role IS NULL OR role = '';
UPDATE users SET profile_pic = '/images/default-profile.png' WHERE profile_pic IS NULL OR profile_pic = '';
UPDATE users SET notifications_enabled = TRUE WHERE notifications_enabled IS NULL;
