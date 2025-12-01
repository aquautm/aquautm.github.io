const express = require("express");
const bcrypt = require("bcrypt");
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
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send("Passwords do not match.");
  }

  try {
    // Check for existing user
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.send("User already exists. Please use a different email.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into SQL
    await db.promise().query(
      "INSERT INTO users (first_name, last_name, email, password, twofa_enabled,role) VALUES (?, ?, ?, ?, true,)",
      [firstName, lastName,  email, hashedPassword,]
    );

    console.log("✅ New user registered:", email);
    res.redirect("/login");
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).send("Error registering user.");
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
      return res.send("Email not found. Please sign up first.");
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.send("Incorrect password.");
    }

    if (user.twofa_enabled) {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store code
      await db.promise().query(
        "INSERT INTO verification_codes (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)",
        [user.id, email, code, expiresAt]
      );

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your 2FA Code',
        text: `Your verification code is: ${code}. It expires in 10 minutes.`
      };

      await transporter.sendMail(mailOptions);

      // Redirect to 2FA page with email in session (simplified)
      res.redirect(`/verify-2fa?email=${encodeURIComponent(email)}`);
      return;
    }

    // ✅ Log the login event
    await db.promise().query(
      "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, email, ipAddress, userAgent]
    );

    console.log(`✅ Login successful for: ${email} (IP: ${ipAddress})`);
    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    // Redirect based on user role
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';
    res.redirect(dashboardPath);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed.");
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
      return res.send("Invalid or expired code.");
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
    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    // Redirect based on user role
    const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : user.role === 'athlete' ? '/athlete-dashboard' : '/member-dashboard';
    res.redirect(dashboardPath);
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(500).send("Verification failed.");
  }
});

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.send("If an account with that email exists, a reset link has been sent.");
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

    res.redirect("/login");
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).send("Error sending reset email.");
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
  res.json({
    role: req.session.userRole || "guest"
  });
});


module.exports = router;
