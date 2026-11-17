const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const sanitizeUser = require("../utils/sanitizeUser");
const { sendPasswordResetEmail } = require("../utils/emailSender");

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, dob } = req.body;

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedPhone = phone?.trim() || null;
  const trimmedDob = dob?.trim() || null;

  if (!trimmedName || !trimmedEmail || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  // Check email existence specifically
  const existingEmail = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
    [trimmedEmail],
  );

  if (existingEmail.rows.length > 0) {
    throw new ApiError(409, "This email is already registered. Please log in.");
  }

  // Check phone existence specifically if provided
  if (trimmedPhone) {
    const existingPhone = await pool.query(
      "SELECT id FROM users WHERE phone = $1 LIMIT 1",
      [trimmedPhone],
    );

    if (existingPhone.rows.length > 0) {
      throw new ApiError(
        409,
        "This phone number is already registered to another account.",
      );
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, phone, password_hash, dob, provider, role)
      VALUES ($1, $2, $3, $4, $5, 'local', 'user')
      RETURNING *
      `,
      [trimmedName, trimmedEmail, trimmedPhone, passwordHash, trimmedDob],
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      if (error.constraint === "users_email_key") {
        throw new ApiError(409, "This email is already registered.");
      }
      if (error.constraint === "users_phone_key") {
        throw new ApiError(409, "This phone number is already registered.");
      }
      throw new ApiError(409, "An account with these details already exists.");
    }

    throw error;
  }
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Identifier and password are required");
  }

  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1)
       OR phone = $1
    LIMIT 1
    `,
    [identifier],
  );

  const user = result.rows[0];

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.password_hash) {
    throw new ApiError(400, "Please login with Google");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  res.json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
    user: sanitizeUser(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

const hashSecret = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const resolveResetClientUrl = (req) => {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "ypheareak.site" ||
        parsed.hostname.endsWith(".ypheareak.site") ||
        parsed.hostname.endsWith(".vercel.app")
      ) {
        return parsed.origin;
      }
    } catch {
      // ignore invalid origin
    }
  }
  return process.env.NODE_ENV === "production"
    ? "https://www.ypheareak.site"
    : process.env.CLIENT_URL || "http://localhost:5173";
};

const findUserByIdentifier = async (identifier) => {
  const target = (identifier || "").trim().toLowerCase();
  if (!target) return null;
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1",
    [target, target],
  );
  return result.rows[0] || null;
};

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, identifier } = req.body;
  const rawTarget = (email || identifier || "").trim();

  if (!rawTarget) {
    throw new ApiError(400, "Email or phone number is required");
  }

  const user = await findUserByIdentifier(rawTarget);
  let resetLink = null;

  if (user) {
    // Invalidate any previous unused OTPs or reset links for this user
    await pool.query(
      "UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [user.id],
    );

    // 1. 6-digit numeric OTP code (valid for 15 minutes)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashSecret(otp);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 2. Fallback clickable reset link token (valid for 60 minutes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashSecret(resetToken);
    const linkExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await pool.query(
      `
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3), ($1, $4, $5)
      `,
      [user.id, otpHash, otpExpiresAt, resetTokenHash, linkExpiresAt],
    );

    const clientUrl = resolveResetClientUrl(req);
    resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email,
    )}`;

    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const hasSmtp = Boolean(
      process.env.SMTP_EMAIL?.trim() && process.env.SMTP_PASSWORD?.trim(),
    );

    if (hasResend) {
      try {
        await sendPasswordResetEmail({
          recipientEmail: user.email,
          otp,
          resetLink,
        });
        console.log(`[Auth] Password reset OTP delivered via Resend to ${user.email}.`);
      } catch (error) {
        console.error("[Auth] Resend OTP delivery failed:", error.message);
        throw new ApiError(
          502,
          "Could not send OTP email right now. Please try again in a moment.",
        );
      }
    } else if (hasSmtp) {
      setImmediate(() =>
        sendPasswordResetEmail({
          recipientEmail: user.email,
          otp,
          resetLink,
        }).catch((error) =>
          console.error("[Auth] SMTP OTP delivery failed:", error.message),
        ),
      );
    }

    if (process.env.NODE_ENV === "production") {
      resetLink = null;
    }
  }

  res.json({
    success: true,
    message:
      "If an account matches those details, a 6-digit OTP verification code has been sent to your email.",
    ...(process.env.NODE_ENV !== "production" && resetLink ? { resetLink } : {}),
  });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, identifier, otp } = req.body;
  const rawTarget = (email || identifier || "").trim();
  const cleanOtp = String(otp || "").trim();

  if (!rawTarget || !cleanOtp) {
    throw new ApiError(400, "Email/phone and 6-digit OTP code are required");
  }

  const user = await findUserByIdentifier(rawTarget);
  if (!user) {
    throw new ApiError(400, "Invalid or expired OTP code");
  }

  const otpHash = hashSecret(cleanOtp);
  const resetResult = await pool.query(
    `
    SELECT id
    FROM password_resets
    WHERE user_id = $1
      AND token_hash = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
    `,
    [user.id, otpHash],
  );

  if (!resetResult.rows[0]) {
    throw new ApiError(400, "Invalid or expired OTP code. Please try again.");
  }

  res.json({
    success: true,
    message: "OTP verified! Please enter your new password.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, otp, email, identifier, newPassword } = req.body;
  const rawTarget = (email || identifier || "").trim();
  const secret = String(otp || token || "").trim();

  if (!secret || !rawTarget || !newPassword) {
    throw new ApiError(
      400,
      "OTP code (or reset token), email/phone, and newPassword are required",
    );
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await findUserByIdentifier(rawTarget);
  if (!user) {
    throw new ApiError(400, "Invalid reset request");
  }

  const tokenHash = hashSecret(secret);
  const resetResult = await pool.query(
    `
    SELECT *
    FROM password_resets
    WHERE user_id = $1
      AND token_hash = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
    `,
    [user.id, tokenHash],
  );

  const reset = resetResult.rows[0];
  if (!reset) {
    throw new ApiError(400, "Invalid or expired OTP code / reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    user.id,
  ]);

  await pool.query(
    "UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
    [user.id],
  );

  res.json({
    success: true,
    message: "Password has been reset successfully",
  });
});

const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Google authentication failed");
  }

  const token = generateToken(user);
  const safeUser = sanitizeUser(user);

  const userJson = encodeURIComponent(JSON.stringify(safeUser));
  const configuredClientUrl = "https://www.ypheareak.site";

  // `state` is set only after validation in auth.routes.js. Validate it again
  // here because it is returned by an external OAuth provider.
  let clientUrl = configuredClientUrl;
  try {
    const stateUrl = new URL(req.query.state);
    const isCanonicalDomain = stateUrl.hostname === "www.ypheareak.site";
    if (stateUrl.protocol === "https:" && isCanonicalDomain) {
      clientUrl = stateUrl.origin;
    }
  } catch {
    // No valid state: retain the server's configured fallback.
  }

  res.redirect(
    `${clientUrl}/login?token=${token}&user=${userJson}`,
  );
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleCallback,
};
