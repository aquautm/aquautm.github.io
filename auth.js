const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const db = require("../db");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password, confirm_Password } = req.body;

  if (password !== confirmPassword) {
    return res.send("Passwords do not match.");
  }

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.send("User already exists. Please use a different email.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      "INSERT INTO users (first_name, last_name, email, password, twofa_enabled) VALUES (?, ?, ?, ?, true)",
      [first_name, last_name, email, hashedPassword]
    );

    console.log("✅ New user registered:", email);
    res.redirect("/login");
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).send("Error registering user.");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Email not found." });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    if (user.twofa_enabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

      await db.promise().query(
        "INSERT INTO verification_codes (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)",
        [user.id, email, code, expiresAt]
      );

      await sendMail({
        to: email,
        subject: 'Your 2FA Code - AquaUTM',
        html: `<p>Your verification code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`
      });

      return res.json({ 
          success: true, 
          redirectUrl: `/verify-2fa?email=${encodeURIComponent(email)}` 
      });
    }

    await db.promise().query(
      "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, email, ipAddress, userAgent]
    );

    req.session.user = user;
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';
    res.json({ success: true, redirectUrl: dashboardPath });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed." });
  }
});

router.post("/verify-2fa", async (req, res) => {
  const { email, code } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired code." });
    }

    const verification = rows[0];
    await db.promise().query("DELETE FROM verification_codes WHERE id = ?", [verification.id]);

    const [userRows] = await db.promise().query("SELECT * FROM users WHERE id = ?", [verification.user_id]);
    const user = userRows[0];

    await db.promise().query(
      "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, email, ipAddress, userAgent]
    );

    req.session.user = user; 
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';
    res.json({ success: true, redirectUrl: dashboardPath });

  } catch (err) {
    console.error("2FA error:", err);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.send("If an account with that email exists, a reset link has been sent.");
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.promise().query(
      "INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)",
      [user.id, email, token, expiresAt]
    );

    const protocol = req.protocol;
    const host = req.get('host');
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Password Reset Request - AquaUTM',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    res.redirect("/login");
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).send("Error sending reset email.");
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send("Passwords do not match.");
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.send("Invalid or expired token.");
    }

    const reset = rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, reset.user_id]);
    await db.promise().query("DELETE FROM password_resets WHERE id = ?", [reset.id]);

    res.send("Password reset successful! You can now login.");
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).send("Error resetting password.");
  }
});


router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.redirect("/");
  });
});

module.exports = router;