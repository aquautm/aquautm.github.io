const express = require("express");
const router = express.Router();
const db = require("../db");

/* Create tournament */
router.post("/create", (req, res) => {
  const { name, date, venue } = req.body;

  if (!name || !date || !venue) {
    return res.json({ success: false, message: "Missing fields" });
  }

  const sql = `
    INSERT INTO tournaments (name, date, venue)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, date, venue], err => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

/* Get active tournaments */
router.get("/active", (req, res) => {
  const sql = `
    SELECT id, name, date, venue
    FROM tournaments
    WHERE is_active = TRUE
    ORDER BY date ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json([]);
    res.json(rows);
  });
});

/* Update tournament */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, date, venue } = req.body;

  const sql = `
    UPDATE tournaments
    SET name = ?, date = ?, venue = ?
    WHERE id = ?
  `;

  db.query(sql, [name, date, venue, id], err => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

/* Delete tournament */
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM tournaments WHERE id = ?",
    [req.params.id],
    err => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    }
  );
});

module.exports = router;
