const express = require("express");
const path = require("path");

const router = express.Router();

// Home routes
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "main", "index.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "login", "login.html"));
});

router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "signup", "signup.html"));
});

router.get("/events", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "events", "events.html"));
});

router.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "forgot-password", "forgot-password.html"));
});

router.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "reset-password", "reset-password.html"));
});

router.get("/verify-2fa", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "guest", "verify-2fa", "verify-2fa.html"));
});

// Dashboard routes
router.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "admin", "admin-dashboard.html"));
});

router.get("/athlete-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "athlete", "athlete-dashboard.html"));
});

router.get("/member-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "views", "member", "member-dashboard.html"));
});

module.exports = router;