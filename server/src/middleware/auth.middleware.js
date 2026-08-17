const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const result = await pool.query(
    `
     SELECT id , name , email , phone , role , dob, profile_image, provider , created_at
     FROM users 
     WHERE id = $1
    `,
    [decoded.id],
  );
  if (result.rows.length === 0) {
    throw new ApiError(401, "User not found ");
  }

  req.user = result.rows[0];
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role != "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
