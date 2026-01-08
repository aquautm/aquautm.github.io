const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const db = require("../db");

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Signup route


router.post("/signup", async (req, res) => {
  console.log("REQ.BODY:", req.body);
  const { first_name, last_name, email, password, confirm_Password} = req.body;
  const role = "member";
   
  if (!role) {
    return res.status(400).send("Role is required. Please select a user type.");
  }

  if (password !== confirm_Password) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists. Please use a different email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      "INSERT INTO users (first_name, last_name, email, password, twofa_enabled) VALUES (?, ?, ?, ?, 1)",
      [first_name, last_name, email, hashedPassword]
    );

    

    console.log("✅ New user registered:", email);

    // Send JSON success instead of redirecting
    res.json({ success: true, message: "Signup successful!" });

  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ success: false, message: "Error registering user." });
  }
});

// Login route with login logging and 2FA
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Email not found. Please sign up first." });
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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your 2FA Code',
        text: `Your verification code is: ${code}. It expires in 10 minutes.`
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        redirectUrl: `/verify-2fa?email=${encodeURIComponent(email)}`
      });
    }

    await db.promise().query(
      "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, email, ipAddress, userAgent]
    );

    console.log(`✅ Login successful for: ${email}`);

    req.session.user = user;
    req.session.userId = user.id;
    req.session.userRole = user.role;

    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';

    res.json({ success: true, redirectUrl: dashboardPath });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed due to server error." });
  }
});

// 2FA verification route
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

    // Delete used code
    await db.promise().query("DELETE FROM verification_codes WHERE id = ?", [verification.id]);

    // Get user
    const [userRows] = await db.promise().query("SELECT * FROM users WHERE id = ?", [verification.user_id]);
    const user = userRows[0];

    // Log login
    await db.promise().query(
      "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, email, ipAddress, userAgent]
    );

    console.log(`✅ 2FA login successful for: ${email}`);

    // IMPORTANT: Set full user object for app.js middleware
    req.session.user = user;
    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Determine dashboard URL
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';

    // Send JSON success with redirect URL
    res.json({ success: true, redirectUrl: dashboardPath });

  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
});

// Forgot password route
// Forgot password route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent."
      });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.promise().query(
      "INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)",
      [user.id, email, token, expiresAt]
    );

    const resetLink = `http://localhost:${process.env.PORT || 5000}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Click here to reset your password: ${resetLink}. This link expires in 1 hour.`
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent."
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Error sending reset email." });
  }
});

// Reset password route
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

    res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "reset-password", "reset-success.html"));
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).send("Error resetting password.");
  }
});

// Enable 2FA route (simplified, assumes user is logged in)
router.post("/enable-2fa", async (req, res) => {
  const { email } = req.body; // In real app, get from session

  try {
    await db.promise().query("UPDATE users SET twofa_enabled = TRUE WHERE email = ?", [email]);
    res.send("2FA enabled.");
  } catch (err) {
    console.error("Enable 2FA error:", err);
    res.status(500).send("Error enabling 2FA.");
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/");
  });
});

router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({
      role: req.session.user.role,
      name: req.session.user.firstName
    });
  } else {
    res.json({ role: "guest" });
  }
});

module.exports = router;
