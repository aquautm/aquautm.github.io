
require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const db = require("./db");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express.static(path.join(__dirname, "")));

function isAuthenticated(req, res, next) {
  console.log('--- Auth Check ---');
  console.log('Session ID:', req.sessionID);
  console.log('Session User Data:', req.session.user);

  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Please log in to view events' });
}

app.post('/api/events', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { title, start_date, end_date, event_role } = req.body;

  const finalEndDate = end_date ? end_date : null;

  try {
    const query = 'INSERT INTO schedules (title, start_date, end_date, target_role) VALUES (?, ?, ?, ?)';
    await db.promise().query(query, [title, start_date, finalEndDate, event_role]);
    res.json({ success: true, message: 'Event added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/events', isAuthenticated, async (req, res) => {
  const userRole = req.session.user.role;
  let query = '';
  let params = [];

  if (userRole === 'admin') {
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role FROM schedules';
  } else {
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role FROM schedules WHERE target_role = ? OR target_role = "all"';
    params = [userRole];
  }

  try {
    const [results] = await db.promise().query(query, params);
    
    const events = results.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: {
            role: event.role
        }
    }));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/events', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { title, start_date, end_date, event_role } = req.body;
  const finalEndDate = end_date ? end_date : null;

  try {
    const query = 'INSERT INTO schedules (title, start_date, end_date, target_role) VALUES (?, ?, ?, ?)';
    const [result] = await db.promise().query(query, [title, start_date, finalEndDate, event_role]);
    res.json({ success: true, id: result.insertId, message: 'Event added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/events/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, start_date, end_date, event_role } = req.body;
    const finalEndDate = end_date ? end_date : null;

    try {
        const query = 'UPDATE schedules SET title = ?, start_date = ?, end_date = ?, target_role = ? WHERE id = ?';
        await db.promise().query(query, [title, start_date, finalEndDate, event_role, id]);
        res.json({ success: true, message: 'Event updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        const query = 'DELETE FROM schedules WHERE id = ?';
        await db.promise().query(query, [id]);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
app.get('/api/dashboard/upcoming', isAuthenticated, async (req, res) => {
  const userRole = req.session.user.role;

  try {
      const query = `
          SELECT title, start_date, end_date 
          FROM schedules 
          WHERE (target_role = ? OR target_role = 'all')
          AND start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
          ORDER BY start_date ASC
          LIMIT 5
      `;

      const [events] = await db.promise().query(query, [userRole]);
      res.json(events);
  } catch (err) {
      console.error("Dashboard Events Error:", err);
      res.status(500).json({ error: "Database error" });
  }
});

app.get('/api/dashboard/announcement', isAuthenticated, async (req, res) => {
  const userRole = req.session.user.role;

  try {
      const query = `
          SELECT title, content, created_at 
          FROM announcements 
          WHERE (target_role = ? OR target_role = 'all')
          ORDER BY created_at DESC 
          LIMIT 1
      `;

      const [announcements] = await db.promise().query(query, [userRole]);
      
      res.json(announcements.length > 0 ? announcements[0] : null);
  } catch (err) {
      console.error("Dashboard Announcement Error:", err);
      res.status(500).json({ error: "Database error" });
  }
});

app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ 
      name: req.session.user.first_name, 
      role: req.session.user.role 
    });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// Routes
const pagesRouter = require("./routes/pages");
const authRouter = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const announcementRoutes = require("./routes/announcements");
const tournamentRoutes = require("./routes/tournaments");

app.use(announcementRoutes);
app.use("/", pagesRouter);
app.use("/", authRouter);
app.use("/", pagesRouter);
app.use("/", authRouter);
app.use("/profile", profileRoutes);


app.use("/api/tournaments", tournamentRoutes);



// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
