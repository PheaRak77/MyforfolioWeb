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

    // 2. Determine recipient email (Always deliver to the configured portfolio SMTP_EMAIL)
    let recipientEmail = process.env.SMTP_EMAIL?.trim();
    if (!recipientEmail) {
      const { rows } = await pool.query(
        "SELECT email FROM users WHERE role = 'admin' LIMIT 1"
      );
      recipientEmail = rows[0]?.email;
    }

    // 3. Send email notification if SMTP credentials are provided
    let emailSent = false;
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && recipientEmail) {
      console.log(`[Contact] Sending notification from ${process.env.SMTP_EMAIL} to ${recipientEmail}...`);
      try {
        await sendContactEmail({
          senderName: name.trim(),
          senderEmail: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
          recipientEmail,
        });
        emailSent = true;
        console.log(`[Contact] ✅ Email delivered to ${recipientEmail} successfully!`);
      } catch (emailErr) {
        console.error("[Contact Email Error]:", emailErr.message);
      }
    } else {
      console.log("[Contact] ⚠ SMTP credentials or recipient missing:", {
        hasSmtpEmail: !!process.env.SMTP_EMAIL,
        hasSmtpPassword: !!process.env.SMTP_PASSWORD,
        recipientEmail,
      });
    }

    return res.json({
      success: true,
      emailSent,
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

/**
 * GET /api/contact/messages
 * Admin endpoint to list all received contact messages from database.
 */
router.get("/messages", async (req, res, next) => {
  try {
    const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
    // Run auth middleware manually
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
    });
    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (err) => (err ? reject(err) : resolve()));
    });

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

    const { rows } = await pool.query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC"
    );

    return res.json({
      success: true,
      messages: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/contact/messages/:id
 * Admin endpoint to delete a contact message.
 */
router.delete("/messages/:id", async (req, res, next) => {
  try {
    const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
    });
    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (err) => (err ? reject(err) : resolve()));
    });

    const { id } = req.params;
    await pool.query("DELETE FROM contact_messages WHERE id = $1", [id]);

    return res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
