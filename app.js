
require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const db = require("./db"); 

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
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

  const { title, date, event_role } = req.body;

  try {
      const query = 'INSERT INTO schedules (title, start_date, target_role) VALUES (?, ?, ?)';
      await db.promise().query(query, [title, date, event_role]);      
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
      query = 'SELECT title, start_date as start, target_role FROM schedules';
  } else {
      query = 'SELECT title, start_date as start FROM schedules WHERE target_role = ? OR target_role = "all"';
      params = [userRole];
  }

  try {
      const [results] = await db.promise().query(query, params);
      
      res.json(results);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
  }
});

// Routes
const pagesRouter = require("./routes/pages");
const authRouter = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const announcementRoutes = require("./routes/announcements");

app.use(announcementRoutes);
app.use("/", profileRoutes);
app.use("/", pagesRouter);
app.use("/", authRouter);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
