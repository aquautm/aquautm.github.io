require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");

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

// Routes
const pagesRouter = require("./routes/pages");
const authRouter = require("./routes/auth");
const profileRoutes = require("./routes/profile");


app.use("/", profileRoutes);
app.use("/", pagesRouter);
app.use("/", authRouter);








// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
