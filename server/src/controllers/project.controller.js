const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const parseArray = (value, fieldName) => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an array`);
  }

  return value;
};

const getAllProjects = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT p.*
    FROM projects p
    INNER JOIN users u ON u.id = p.user_id
    WHERE u.role = 'admin'
    ORDER BY p.created_at DESC
    `,
  );

  res.json({
    success: true,
    projects: result.rows,
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Project not found");
  }

  res.json({
    success: true,
    project: result.rows[0],
  });
});

// Admin dashboard: get only the logged-in user's own projects
const getMyProjects = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id],
  );

  res.json({
    success: true,
    projects: result.rows,
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description, tech_stack, images, links, is_featured } =
    req.body;

  if (!title) {
    throw new ApiError(400, "Project title is required");
  }

  const techStack = parseArray(tech_stack, "tech_stack");
  const projectImages = parseArray(images, "images");
  const projectLinks = parseArray(links, "links");

  const result = await pool.query(
    `
    INSERT INTO projects (
      user_id,
      title,
      description,
      tech_stack,
      images,
      links,
      is_featured
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    RETURNING *
    `,
    [
      req.user.id,
      title,
      description || "",
      techStack,
      projectImages,
      JSON.stringify(projectLinks),
      Boolean(is_featured),
    ],
  );

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    project: result.rows[0],
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM projects WHERE id = $1",
    [req.params.id],
  );

  const project = currentResult.rows[0];

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to update this project");
  }

  const title = req.body.title ?? project.title;
  const description = req.body.description ?? project.description;

  const tech_stack =
    req.body.tech_stack !== undefined
      ? parseArray(req.body.tech_stack, "tech_stack")
      : project.tech_stack;

  const images =
    req.body.images !== undefined
      ? parseArray(req.body.images, "images")
      : project.images;

  const links =
    req.body.links !== undefined
      ? parseArray(req.body.links, "links")
      : project.links;

  const is_featured =
    req.body.is_featured !== undefined
      ? Boolean(req.body.is_featured)
      : project.is_featured;

  const result = await pool.query(
    `
    UPDATE projects
    SET
      title = $1,
      description = $2,
      tech_stack = $3,
      images = $4,
      links = $5::jsonb,
      is_featured = $6
    WHERE id = $7
    RETURNING *
    `,
    [
      title,
      description,
      tech_stack,
      images,
      JSON.stringify(links),
      is_featured,
      req.params.id,
    ],
  );

  res.json({
    success: true,
    message: "Project updated successfully",
    project: result.rows[0],
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM projects WHERE id = $1",
    [req.params.id],
  );

  const project = currentResult.rows[0];

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to delete this project");
  }

  await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);

  res.json({
    success: true,
    message: "Project deleted successfully",
  });
});

module.exports = {
  getAllProjects,
  getProjectById,
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
};
