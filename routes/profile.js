const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `profile_${userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

router.get("/profile", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const userId = req.session.user.id;

    const [rows] = await db.promise().query(
      `SELECT first_name, last_name, email, role, profile_pic, notifications_enabled, twofa_enabled, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ error: "Server error fetching profile" });
  }
});

// Update profile information
router.put("/profile", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { first_name, last_name, email } = req.body;
  const userId = req.session.user.id;

  try {
    // Check if email is already taken by another user
    const [existing] = await db.promise().query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    await db.promise().query(
      "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, userId]
    );

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ error: "Server error updating profile" });
  }
});

// Change password
router.put("/profile/password", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { current_password, new_password } = req.body;
  const userId = req.session.user.id;

  try {
    const [rows] = await db.promise().query(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(current_password, rows[0].password);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.promise().query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    console.error("Password Change Error:", err);
    res.status(500).json({ error: "Server error changing password" });
  }
});

// Upload profile picture
router.post("/profile/picture", upload.single("profile_pic"), async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const userId = req.session.user.id;
  const profilePicPath = `/uploads/${req.file.filename}`;

  try {
    // Get current profile pic to delete old file
    const [rows] = await db.promise().query(
      "SELECT profile_pic FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length > 0 && rows[0].profile_pic && rows[0].profile_pic !== "/images/default-profile.png") {
      const oldPath = path.join(__dirname, "../public", rows[0].profile_pic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db.promise().query(
      "UPDATE users SET profile_pic = ? WHERE id = ?",
      [profilePicPath, userId]
    );

    res.json({ message: "Profile picture updated successfully", profile_pic: profilePicPath });

  } catch (err) {
    console.error("Profile Picture Upload Error:", err);
    res.status(500).json({ error: "Server error uploading picture" });
  }
});

// Toggle 2FA
router.put("/profile/2fa", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { enabled } = req.body;
  const userId = req.session.user.id;

  try {
    await db.promise().query(
      "UPDATE users SET twofa_enabled = ? WHERE id = ?",
      [enabled, userId]
    );

    res.json({ message: "2FA setting updated successfully" });

  } catch (err) {
    console.error("2FA Toggle Error:", err);
    res.status(500).json({ error: "Server error updating 2FA" });
  }
});

// Toggle notifications
router.put("/profile/notifications", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { enabled } = req.body;
  const userId = req.session.user.id;

  try {
    await db.promise().query(
      "UPDATE users SET notifications_enabled = ? WHERE id = ?",
      [enabled, userId]
    );

    res.json({ message: "Notification setting updated successfully" });

  } catch (err) {
    console.error("Notifications Toggle Error:", err);
    res.status(500).json({ error: "Server error updating notifications" });
  }
});

module.exports = router;
