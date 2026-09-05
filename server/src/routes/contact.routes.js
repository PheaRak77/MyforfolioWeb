const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../utils/emailSender");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

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

    // 1. Immediately save message into database
    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]
    );

    // 2. The recipient is the real portfolio-admin email. SMTP_EMAIL is the
    // sending mailbox; CONTACT_RECIPIENT_EMAIL permits a separate inbox.
    const { rows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1"
    );
    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || rows[0]?.email;

    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const hasSmtp = Boolean(process.env.SMTP_EMAIL?.trim() && process.env.SMTP_PASSWORD?.trim());
    if (!hasResend && !hasSmtp) {
      console.error("[Contact] Email not sent: no email delivery provider is configured.");
      return res.status(503).json({
        success: false,
        message: "Email delivery is not configured yet. Please contact the administrator directly.",
      });
    }

    if (!recipientEmail) {
      console.error("[Contact] Email not sent: no administrator recipient address found.");
      return res.status(503).json({
        success: false,
        message: "The administrator email address is not configured yet.",
      });
    }

    // 3. Await the provider response. Never show a false success message: the
    // sender only sees success after Nodemailer accepts the message for delivery.
    await sendContactEmail({
      senderName: name.trim(),
      senderEmail: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      recipientEmail,
    });

    console.log(`[Contact] Email accepted for delivery to ${recipientEmail}.`);

    // 4. Return success only after the mail provider accepted the message.
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

/**
 * GET /api/contact/messages
 * Admin endpoint to list all received contact messages from database.
 */
router.get("/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
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
router.delete("/messages/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
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
