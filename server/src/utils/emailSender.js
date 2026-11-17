const nodemailer = require("nodemailer");
const dns = require("node:dns");

// Render's service network is IPv4-only in this deployment. Gmail can resolve
// to IPv6 first, which produces ENETUNREACH before Nodemailer can authenticate.
// Prefer IPv4 so SMTP uses smtp.gmail.com's reachable A record.
dns.setDefaultResultOrder("ipv4first");

let transporterInstance = null;
const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const sendWithResend = async ({
  recipientEmail,
  replyTo,
  fromName = "Portfolio",
  subject,
  html,
  text,
}) => {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const configuredFrom = process.env.EMAIL_FROM?.trim();
  const primaryFrom = configuredFrom || `${fromName} <noreply@ypheareak.site>`;
  const fallbackFrom = `${fromName} <onboarding@resend.dev>`;

  const attemptSend = async (fromAddress) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipientEmail],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html,
        text,
      }),
    });

  let response = await attemptSend(primaryFrom);

  // If no custom EMAIL_FROM is set and the custom domain is still propagating,
  // retry once using Resend's sandbox sender so owner alerts still deliver.
  if (!response.ok && !configuredFrom && response.status === 403) {
    response = await attemptSend(fallbackFrom);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend delivery failed (${response.status}): ${detail}`);
  }
};

const getTransporter = () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  const email = (process.env.SMTP_EMAIL || "").trim();
  const rawPass = (process.env.SMTP_PASSWORD || "").trim();
  const pass = rawPass.replace(/\s+/g, ""); // Remove any spaces from app password

  // Render and other cloud hosts can intermittently block or delay Gmail's
  // implicit-TLS port (465). Gmail's explicit TLS submission port (587) is
  // the standard cloud-safe choice and works with Gmail App Passwords.
  if (email.endsWith("@gmail.com") || (!process.env.SMTP_HOST && email.includes("@gmail"))) {
    transporterInstance = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      requireTLS: true,
      pool: true, // Reuse open connections
      maxConnections: 3,
      maxMessages: 50,
      auth: {
        user: email,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    return transporterInstance;
  }

  // Generic SMTP fallback for custom domains / other providers
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: (process.env.SMTP_PORT || "465") === "465",
    pool: true,
    auth: {
      user: email,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporterInstance;
};

/**
 * Send the contact form message to the portfolio owner's email.
 * @param {Object} options
 * @param {string} options.senderName  - Visitor's name
 * @param {string} options.senderEmail - Visitor's email
 * @param {string} options.subject     - Message subject
 * @param {string} options.message     - Message body
 * @param {string} options.recipientEmail - Portfolio owner's email (to receive)
 */
const sendContactEmail = async ({
  senderName,
  senderEmail,
  subject,
  message,
  recipientEmail,
}) => {
  const safeName = escapeHtml(senderName);
  const safeEmail = escapeHtml(senderEmail);
  const safeSubject = escapeHtml(subject);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Portfolio Contact Message</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6);padding:32px 36px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
        📬 New Portfolio Message
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
        Someone reached out via your portfolio contact form
      </p>
    </div>

    <!-- Info Cards -->
    <div style="padding:28px 36px 0;">
      <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
        <tr>
          <td style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:12px 16px;width:50%;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:4px;">From</div>
            <div style="font-size:15px;font-weight:700;color:#e2e8f0;">${safeName}</div>
          </td>
          <td style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:12px 16px;width:50%;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:4px;">Reply To</div>
            <div style="font-size:15px;font-weight:700;color:#60a5fa;">${safeEmail}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:12px 16px;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:4px;">Subject</div>
            <div style="font-size:15px;font-weight:700;color:#e2e8f0;">${safeSubject}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Message Body -->
    <div style="padding:24px 36px 32px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:12px;">Message</div>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;color:#cbd5e1;font-size:14px;line-height:1.75;white-space:pre-line;">
        ${escapeHtml(message)}
      </div>
    </div>

    <!-- CTA Reply Button -->
    <div style="padding:0 36px 32px;text-align:center;">
      <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}"
         style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
        Reply to ${senderName}
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e293b;padding:18px 36px;text-align:center;">
      <p style="margin:0;color:#475569;font-size:11px;">
        This message was sent via your portfolio contact form.
      </p>
      <p style="margin:6px 0 0;color:#334155;font-size:10px;">
        ${new Date().toLocaleString()}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `New message from ${senderName} (${senderEmail})\n\nSubject: ${subject}\n\n${message}`;

  // HTTPS delivery avoids SMTP socket timeouts on restrictive cloud networks.
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendWithResend({
      recipientEmail,
      replyTo: senderEmail,
      fromName: "Portfolio Contact",
      subject: `[Portfolio] ${subject}`,
      html,
      text,
    });
    return;
  }

  const mailTransporter = getTransporter();
  await mailTransporter.sendMail({
    from: `"Portfolio Contact" <${process.env.SMTP_EMAIL}>`,
    to: recipientEmail,
    replyTo: `"${senderName}" <${senderEmail}>`,
    subject: `[Portfolio] ${subject}`,
    html,
    text,
  });
};

const sendPasswordResetEmail = async ({ recipientEmail, otp, resetLink }) => {
  const safeOtp = escapeHtml(otp);
  const safeLink = escapeHtml(resetLink);
  const subject = otp
    ? `Your Password Reset OTP: ${otp}`
    : "Reset your portfolio password";

  const text = otp
    ? `Your password reset OTP verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nOr use this link to reset your password (expires in 1 hour): ${resetLink}`
    : `Use this link to reset your password. It expires in one hour: ${resetLink}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:540px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
        🔐 Password Reset Verification
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.88);font-size:13px;">
        Use the 6-digit OTP code below to set a new password
      </p>
    </div>

    <div style="padding:32px;text-align:center;">
      ${
        otp
          ? `
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#94a3b8;font-weight:700;margin-bottom:12px;">
        One-Time Verification Code (OTP)
      </div>
      <div style="display:inline-block;padding:16px 32px;background:#0f172a;border:1px solid #38bdf8;border-radius:14px;font-family:monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:#38bdf8;">
        ${safeOtp}
      </div>
      <p style="margin:14px 0 0;color:#94a3b8;font-size:12px;">
        This OTP code expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
      </p>
      `
          : ""
      }

      ${
        resetLink
          ? `
      <div style="margin-top:26px;padding-top:22px;border-top:1px solid #334155;">
        <p style="margin:0 0 14px;color:#94a3b8;font-size:12px;">
          Or click the button below directly:
        </p>
        <a href="${safeLink}"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;font-size:13px;font-weight:700;text-decoration:none;border-radius:10px;">
          Reset Password Now
        </a>
      </div>
      `
          : ""
      }
    </div>

    <div style="border-top:1px solid #334155;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendWithResend({
      recipientEmail,
      fromName: "Portfolio Security",
      subject,
      html,
      text,
    });
    return;
  }

  const mailTransporter = getTransporter();
  await mailTransporter.sendMail({
    from: `"Portfolio Security" <${process.env.SMTP_EMAIL}>`,
    to: recipientEmail,
    subject,
    text,
    html,
  });
};

module.exports = { sendContactEmail, sendPasswordResetEmail };
