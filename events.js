const express = require("express");
const db = require("../db");

const router = express.Router();

// CREATE event/class (admin only)
router.post("/events/create", async (req, res) => {
  if (req.session.userRole !== "admin") {
    return res.status(403).send("Not allowed");
  }

  const { title, description, event_date, event_time, location, type, target_role } = req.body;

  const safeTargetRole = ["member", "athlete", "all"].includes(target_role)
    ? target_role
    : "all";

  const safeType = ["event", "class"].includes(type)
    ? type
    : "event";

  try {
    await db.promise().query(
      `INSERT INTO events (title, description, event_date, event_time, location, type, target_role, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, event_date, event_time, location, safeType, safeTargetRole, req.session.userId]
    );

    res.redirect("/admin-dashboard");
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).send("Failed to create event");
  }
});

// FETCH events (everyone)
router.get("/events", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.location, e.type, e.target_role,
             e.created_at, u.first_name, u.last_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Fetch events error:", err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// DELETE event (admin only)
router.delete("/events/:id", async (req, res) => {
  if (req.session.userRole !== "admin") {
    return res.status(403).send("Not allowed");
  }

  try {
    await db.promise().query(
      "DELETE FROM events WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ success: false });
  }
});

// GET current user info (For frontend role checking)
router.get("/events/me", (req, res) => {
  if (req.session && req.session.userRole) {
    res.json({
      id: req.session.userId,
      role: req.session.userRole,
      name: req.session.firstName
    });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

module.exports = router;
