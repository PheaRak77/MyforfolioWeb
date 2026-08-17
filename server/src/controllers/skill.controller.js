const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Public: Get all skills belonging to the admin/portfolio owner
const getAllSkills = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT s.*
    FROM skills s
    INNER JOIN users u ON u.id = s.user_id
    WHERE u.role = 'admin'
    ORDER BY s.display_order ASC, s.percentage DESC, s.created_at ASC
    `,
  );

  res.json({
    success: true,
    skills: result.rows,
  });
});

// Admin Dashboard: Get logged-in admin's own skills
const getMySkills = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT *
    FROM skills
    WHERE user_id = $1
    ORDER BY display_order ASC, percentage DESC, created_at ASC
    `,
    [req.user.id],
  );

  res.json({
    success: true,
    skills: result.rows,
  });
});

// Get single skill by ID
const getSkillById = asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM skills WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Skill not found");
  }

  res.json({
    success: true,
    skill: result.rows[0],
  });
});

// Create new skill
const createSkill = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    percentage,
    icon,
    level,
    color,
    is_featured,
    display_order,
  } = req.body;

  if (!name) {
    throw new ApiError(400, "Skill name is required");
  }

  const skillCategory = category || "Backend";
  const skillPercentage =
    percentage !== undefined && percentage !== ""
      ? Math.max(0, Math.min(100, Number(percentage)))
      : 80;

  const result = await pool.query(
    `
    INSERT INTO skills (
      user_id,
      name,
      category,
      percentage,
      icon,
      level,
      color,
      is_featured,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      req.user.id,
      name.trim(),
      skillCategory.trim(),
      skillPercentage,
      icon || null,
      level || "Advanced",
      color || "#3B82F6",
      Boolean(is_featured),
      Number(display_order) || 0,
    ],
  );

  res.status(201).json({
    success: true,
    message: "Skill created successfully",
    skill: result.rows[0],
  });
});

// Update skill
const updateSkill = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM skills WHERE id = $1",
    [req.params.id],
  );

  const skill = currentResult.rows[0];

  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  if (skill.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to update this skill");
  }

  const name = req.body.name !== undefined ? req.body.name.trim() : skill.name;
  const category =
    req.body.category !== undefined ? req.body.category.trim() : skill.category;
  const percentage =
    req.body.percentage !== undefined
      ? Math.max(0, Math.min(100, Number(req.body.percentage)))
      : skill.percentage;
  const icon = req.body.icon !== undefined ? req.body.icon : skill.icon;
  const level = req.body.level !== undefined ? req.body.level : skill.level;
  const color = req.body.color !== undefined ? req.body.color : skill.color;
  const is_featured =
    req.body.is_featured !== undefined
      ? Boolean(req.body.is_featured)
      : skill.is_featured;
  const display_order =
    req.body.display_order !== undefined
      ? Number(req.body.display_order)
      : skill.display_order;

  const result = await pool.query(
    `
    UPDATE skills
    SET
      name = $1,
      category = $2,
      percentage = $3,
      icon = $4,
      level = $5,
      color = $6,
      is_featured = $7,
      display_order = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
    `,
    [
      name,
      category,
      percentage,
      icon,
      level,
      color,
      is_featured,
      display_order,
      req.params.id,
    ],
  );

  res.json({
    success: true,
    message: "Skill updated successfully",
    skill: result.rows[0],
  });
});

// Delete skill
const deleteSkill = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM skills WHERE id = $1",
    [req.params.id],
  );

  const skill = currentResult.rows[0];

  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  if (skill.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to delete this skill");
  }

  await pool.query("DELETE FROM skills WHERE id = $1", [req.params.id]);

  res.json({
    success: true,
    message: "Skill deleted successfully",
  });
});

module.exports = {
  getAllSkills,
  getMySkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
};
