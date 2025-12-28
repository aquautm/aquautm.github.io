// routes/admin.js
const express = require("express");
const router = express.Router();
const { sendMail } = require("../utils/mailer");
const User = require("../models/User");
const Event = require("../models/Event");

router.post("/create-event", async (req, res) => {
  try {
    const event = await Event.create(req.body);

    const users = await User.find({}, "email");

    const emails = users.map(u => u.email);

    const emailHTML = `
      <h2>New Event Announced</h2>
      <p><strong>${event.title}</strong></p>
      <p>${event.description}</p>
      <p>Date: ${event.date}</p>
    `;

    for (const email of emails) {
      await sendMail(
        email,
        "📢 New Event Announcement",
        emailHTML
      );
    }

    res.json({ success: true, message: "Event created and users notified" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
