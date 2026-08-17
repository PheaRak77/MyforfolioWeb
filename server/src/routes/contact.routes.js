const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../utils/emailSender");
const pool = require("../config/db");

/**
 * POST /api/contact
 * Sends a real contact email to the portfolio owner.
 * Validates input and fetches owner email from the DB.
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Input validation
    const errors = {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.email = "A valid email address is required";
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
      errors.subject = "Subject is required";
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Ensure contact_messages table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Immediately save message into database
    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]
    );

    // 2. Fetch admin recipient email
    const { rows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin' LIMIT 1"
    );
    const recipientEmail = rows[0]?.email || process.env.SMTP_EMAIL;

    // 3. Send email asynchronously if SMTP credentials are provided
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && recipientEmail) {
      sendContactEmail({
        senderName: name.trim(),
        senderEmail: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        recipientEmail,
      }).catch((emailErr) => {
        console.error("[Contact Email Error]:", emailErr.message);
      });
    }

    return res.json({
      success: true,
      message: "Message sent successfully! Thank you for reaching out.",
    });
  } catch (err) {
    console.error("[Contact Error]:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later or contact directly via email.",
    });
  }
});

module.exports = router;
