const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/profile", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const [rows] = await db.promise().query(
      "SELECT id, first_name, last_name, email, twofa_enabled,created_at FROM users WHERE id= ?",
      [userId]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;



