const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sanitizeUser = require("../utils/sanitizeUser");

const getPublicProfile = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT id, name, email, phone, dob, profile_image, role, created_at
    FROM users
    ORDER BY 
      CASE WHEN role = 'admin' THEN 1 ELSE 2 END,
      CASE WHEN profile_image IS NOT NULL OR phone IS NOT NULL OR dob IS NOT NULL THEN 1 ELSE 2 END,
      created_at ASC
    LIMIT 1
    `,
  );

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      user: null,
    });
  }

  res.json({
    success: true,
    user: sanitizeUser(result.rows[0]),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, dob, profile_image } = req.body;

  const result = await pool.query(
    `
    UPDATE users
    SET
      name = COALESCE(NULLIF($1, ''), name),
      phone = COALESCE(NULLIF($2, ''), phone),
      dob = COALESCE($3::date, dob),
      profile_image = COALESCE(NULLIF($4, ''), profile_image)
    WHERE id = $5
    RETURNING *
    `,
    [name, phone, dob || null, profile_image, req.user.id],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: sanitizeUser(result.rows[0]),
  });
});

module.exports = {
  getPublicProfile,
  getProfile,
  updateProfile,
};
