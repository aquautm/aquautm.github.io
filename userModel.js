const db = require('./db');
const bcrypt = require('bcrypt');

async function signupUser(firstName, lastName, username, email, password) {
  try {
    // Check for existing user by email or username
    const [existingUser] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existingUser.length > 0) {
      throw new Error('User with this email or username already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const [result] = await db.promise().query(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, hashedPassword]
    );

    console.log("✅ New user registered:", email);
    return { success: true, userId: result.insertId };
  } catch (error) {
    console.error("Error during signup:", error);
    throw error;
  }
}

module.exports = { signupUser };
