const mysql = require("mysql2");

// Use the URI from Aiven (the one starting with mysql://)
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This tells Node to connect even without the CA file
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected to Aiven");
    connection.release();
  }
});

module.exports = pool;