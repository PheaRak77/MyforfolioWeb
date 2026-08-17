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

    // Get portfolio owner email from the DB (first admin user)
    const { rows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (!rows.length || !rows[0].email) {
      return res.status(503).json({
        success: false,
        message: "Contact service is not configured yet",
      });
    }

    const recipientEmail = rows[0].email;

    // Check SMTP is configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return res.status(503).json({
        success: false,
        message: "Email service is not configured on the server. Please contact the owner directly.",
      });
    }

    await sendContactEmail({
      senderName: name.trim(),
      senderEmail: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      recipientEmail,
    });

    return res.json({
      success: true,
      message: "Message sent successfully! The owner will reply to your email soon.",
    });
  } catch (err) {
    // Safe error - don't leak SMTP details
    console.error("[Contact] Email send error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later or contact directly via email.",
    });
  }
});

module.exports = router;
