const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const sanitizeUser = require("../utils/sanitizeUser");

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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, identifier } = req.body;
  const target = (email || identifier || "").trim().toLowerCase();

  if (!target) {
    throw new ApiError(400, "Email or phone number is required");
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2",
    [target, target]
  );

  const user = result.rows[0];
  let resetLink = null;
  let resetToken = null;

  if (user) {
    resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await pool.query(
      `
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      `,
      [user.id, resetTokenHash, expiresAt],
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email,
    )}`;

    console.log("\n=================================");
    console.log("🔑 PASSWORD RESET LINK GENERATED:");
    console.log(resetLink);
    console.log("=================================\n");
  }

  res.json({
    success: true,
    message: "Password reset request generated successfully.",
    resetLink,
    email: user ? user.email : null,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    throw new ApiError(400, "Token, email, and newPassword are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(400, "Invalid reset request");
  }

  const resetResult = await pool.query(
    `
    SELECT *
    FROM password_resets
    WHERE user_id = $1
      AND token_hash = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    `,
    [user.id, tokenHash],
  );

  const reset = resetResult.rows[0];

  if (!reset) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    user.id,
  ]);

  await pool.query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [
    reset.id,
  ]);

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

  res.redirect(
    `${process.env.CLIENT_URL}/login?token=${token}&user=${userJson}`,
  );
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
};
