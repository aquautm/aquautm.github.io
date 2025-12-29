
require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const { sendMail } = require("./utils/mailer");
console.log("Mailer loaded successfully");


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

app.get('/api/events/:id', isAuthenticated, async (req, res) => {
  const userRole = req.session.user.role;
  const { id } = req.params;

  let query = '';
  let params = [];

  if (userRole === 'admin') {
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role, type, instructor, location, description FROM schedules WHERE id = ?';
    params = [id];
  } else {
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role, type, instructor, location, description FROM schedules WHERE id = ? AND (target_role = ? OR target_role = "all")';
    params = [id, userRole];
  }

  try {
    const [results] = await db.promise().query(query, params);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }

    const event = results[0];
    const formattedEvent = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: {
        role: event.role,
        type: event.type,
        instructor: event.instructor,
        location: event.location,
        description: event.description
      }
    };

    res.json(formattedEvent);
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
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role, type, instructor, location, description FROM schedules';
  } else {
    query = 'SELECT id, title, start_date as start, end_date as end, target_role as role, type, instructor, location, description FROM schedules WHERE target_role = ? OR target_role = "all"';
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
            role: event.role,
            type: event.type,
            instructor: event.instructor,
            location: event.location,
            description: event.description
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

  const { title, start_date, end_date, event_role, type, instructor, location, description } = req.body;
  const finalEndDate = end_date ? end_date : null;

  try {
    const query = 'INSERT INTO schedules (title, start_date, end_date, target_role, type, instructor, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(query, [title, start_date, finalEndDate, event_role, type || 'event', instructor, location, description]);
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
  const { title, start_date, end_date, event_role, type, instructor, location, description } = req.body;
  const finalEndDate = end_date ? end_date : null;

  try {
    const query = 'UPDATE schedules SET title = ?, start_date = ?, end_date = ?, target_role = ?, type = ?, instructor = ?, location = ?, description = ? WHERE id = ?';
    await db.promise().query(query, [title, start_date, finalEndDate, event_role, type || 'event', instructor, location, description, id]);
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
          SELECT id, title, start_date, end_date, type, instructor, location, description
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

app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Total users
    const [totalUsers] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    // Active today: distinct logins today
    const [activeToday] = await db.promise().query('SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_time) = CURDATE()');
    // New this month
    const [newMonth] = await db.promise().query('SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())');
    // Announcements
    const [announcements] = await db.promise().query('SELECT COUNT(*) as count FROM announcements');

    res.json({
      totalUsers: totalUsers[0].count,
      activeToday: activeToday[0].count,
      newMonth: newMonth[0].count,
      announcements: announcements[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/dashboard/user-activity', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const query = `
      SELECT DATE(login_time) as date, COUNT(*) as count
      FROM login_logs
      WHERE login_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(login_time)
      ORDER BY date
    `;
    const [results] = await db.promise().query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/dashboard/recent-logs', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const query = `
      SELECT ll.login_time, u.first_name, u.last_name, ll.ip_address
      FROM login_logs ll
      JOIN users u ON ll.user_id = u.id
      ORDER BY ll.login_time DESC
      LIMIT 10
    `;
    const [results] = await db.promise().query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/create-athlete', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { first_name, last_name, email, password } = req.body;

  try {
    // Check if email already exists
    const [existingUser] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new athlete
    const query = 'INSERT INTO users (first_name, last_name, email, password, role, twofa_enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())';
    await db.promise().query(query, [first_name, last_name, email, hashedPassword, 'athlete']);

    console.log(`✅ Athlete account created: ${email}`);
    res.json({ success: true, message: 'Athlete account created successfully!' });

  } catch (err) {
    console.error('Error creating athlete:', err);
    res.status(500).json({ success: false, message: 'Error creating athlete account.' });
  }
});

app.get('/api/admin/members', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const query = 'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC';
    const [results] = await db.promise().query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/members/:id/role', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'athlete', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const query = 'UPDATE users SET role = ? WHERE id = ?';
    await db.promise().query(query, [role, id]);
    res.json({ success: true, message: 'Role updated successfully' });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/members/:id', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    // Prevent deleting the current admin user
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const query = 'DELETE FROM users WHERE id = ?';
    await db.promise().query(query, [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/feedback/submit', isAuthenticated, async (req, res) => {
  const { message } = req.body;
  
  const { id, first_name, last_name, role } = req.session.user;
  const fullName = `${first_name} ${last_name}`;

  if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
      const query = 'INSERT INTO feedback (user_id, user_name, role, message) VALUES (?, ?, ?, ?)';
      await db.promise().query(query, [id, fullName, role, message]);
      
      res.json({ success: true, response: "Your feedback has been sent to the admins. Thank you!" });
  } catch (err) {
      console.error("Feedback Error:", err);
      res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admin/feedback', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
      const query = `
          SELECT id, user_name, role, message, 
          DATE_FORMAT(created_at, '%d %b %Y, %h:%i %p') as date 
          FROM feedback 
          ORDER BY created_at DESC
      `;
      const [results] = await db.promise().query(query);
      res.json(results);
  } catch (err) {
      console.error("Error fetching feedback:", err);
      res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/feedback/:id', isAuthenticated, async (req, res) => {
  if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
      await db.promise().query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) {
      console.error("Error deleting feedback:", err);
      res.status(500).json({ error: 'Database error' });
  }
});

// Routes
const pagesRouter = require("./routes/pages");
const authRouter = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const announcementRoutes = require("./routes/announcements");
const tournamentRoutes = require("./routes/tournaments");
const chatbotRoutes = require("./routes/chatbot");

app.use(announcementRoutes);
app.use("/", pagesRouter);
app.use("/", authRouter);
app.use("/", pagesRouter);
app.use("/", authRouter);
app.use("/profile", profileRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use("/api/tournaments", tournamentRoutes);



// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
