

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


router.post("/register", (req, res) => {
    const {
        tournament_id,
        event_name,
        seed_time,
        contact_name,
        contact_email,
        contact_phone,
        category,
        gender
    } = req.body;

    if (
        !tournament_id ||
        !event_name ||
        !seed_time ||
        !contact_name ||
        !contact_email ||
        !contact_phone
    ) {
        return res.json({
            success: false,
            message: "Missing required fields"
        });
    }

    // If you have auth later, replace this
    const athlete_id = req.session?.user?.id || null;

    // 1️⃣ Insert into tournament_registrations
   const regSql = `
INSERT INTO tournament_registrations
(tournament_id, athlete_id, category, gender, contact_name, contact_email, contact_phone)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

db.query(regSql, [
    tournament_id,
    athlete_id,
    category,
    gender,
    contact_name,
    contact_email,
    contact_phone
], 

        (err, result) => {
            if (err) {
    console.error("DB ERROR:", err);
    return res.json({
        success: false,
        message: err.message
    });
}


            const registrationId = result.insertId;

            // 2️⃣ Insert event + seed time
            const eventSql = `
                INSERT INTO registration_events
                (registration_id, event_name, seed_time)
                VALUES (?, ?, ?)
            `;

            db.query(
                eventSql,
                [registrationId, event_name, seed_time],
                err2 => {
                    if (err2) {
                        console.error(err2);
                        return res.json({
                            success: false,
                            message: "Failed to save event"
                        });
                    }

                    res.json({ success: true });
                }
            );
        }
    );
});


router.get("/my-registrations", (req, res) => {
    const athlete_id = req.session?.user?.id || 1;

    const sql = `
        SELECT
    r.id AS registration_id,
    t.name AS tournament_name,
    GROUP_CONCAT(e.event_name ORDER BY e.event_name SEPARATOR ', ') AS events,
    r.registered_at
FROM tournament_registrations r
JOIN tournaments t ON r.tournament_id = t.id
LEFT JOIN registration_events e ON e.registration_id = r.id
WHERE r.athlete_id = ?
GROUP BY r.id
ORDER BY r.registered_at DESC;

    `;

    db.query(sql, [athlete_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }
        res.json(rows);
    });
});

router.get("/admin-registrations", (req, res) => {
    const sql = `
        SELECT
            r.contact_name AS athlete,
            t.name AS tournament,
            GROUP_CONCAT(
                e.event_name
                ORDER BY e.event_name
                SEPARATOR ', '
            ) AS events,
            r.gender,
            r.contact_email,
            r.contact_phone,
            GROUP_CONCAT(
                IFNULL(e.seed_time, '—')
                ORDER BY e.event_name
                SEPARATOR ', '
            ) AS seed_time
        FROM tournament_registrations r
        JOIN tournaments t ON t.id = r.tournament_id
        LEFT JOIN registration_events e ON e.registration_id = r.id
        GROUP BY r.id
        ORDER BY r.registered_at DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }
        res.json(rows);
    });
});





module.exports = router;
