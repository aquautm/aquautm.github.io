const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/announcements/create", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Not allowed");
  }

  const { title, content, image_path, link, target_role } = req.body;

  const safeTargetRole = ["member", "athlete", "all"].includes(target_role)
    ? target_role
    : "all";

  try {
    await db.promise().query(
      `INSERT INTO announcements (title, content, image_path, link, target_role, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, image_path, link, safeTargetRole, req.session.user.id] // <--- FIXED: user.id
    );

    res.redirect("/admin-dashboard");
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).send("Failed to create announcement");
  }
});

router.get("/announcements", async (req, res) => {
  if (!req.session.user) {
     return res.status(401).json({ error: "Please log in" });
  }

  const userRole = req.session.user.role;

  try {
    const [rows] = await db.promise().query(`
      SELECT a.id, a.title, a.content, a.image_path, a.link, 
             a.created_at, a.target_role,
             u.first_name, u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.target_role = 'all'
         OR a.target_role = ?
         OR ? = 'admin'
      ORDER BY a.created_at DESC
    `, [userRole, userRole]);

    res.json(rows);
  } catch (err) {
    console.error("Fetch announcements error:", err);
    res.status(500).json({ error: "Failed to load announcements" });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Not allowed");
  }

  try {
    await db.promise().query(
      "DELETE FROM announcements WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false });
  }
});

router.put("/announcements/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Not allowed");
  }

  const { title, content, image_path, link, target_role } = req.body;

  const safeTargetRole = ["member", "athlete", "all"].includes(target_role)
  ? target_role
  : "all";

  try {
    await db.promise().query(
      `UPDATE announcements 
       SET title = ?, content = ?, image_path = ?, link = ?, target_role = ?
       WHERE id = ?`,
      [title, content, image_path, link, safeTargetRole, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ 
      id: req.session.user.id,
      role: req.session.user.role,
      name: req.session.user.firstName
    });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

module.exports = router;