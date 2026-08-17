const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const getAllCertificates = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT c.*
    FROM certificates c
    INNER JOIN users u ON u.id = c.user_id
    WHERE u.role = 'admin'
    ORDER BY c.created_at DESC
    `,
  );

  res.json({
    success: true,
    certificates: result.rows,
  });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM certificates WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Certificate not found");
  }

  res.json({
    success: true,
    certificate: result.rows[0],
  });
});

// Admin dashboard: get only the logged-in user's own certificates
const getMyCertificates = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM certificates WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id],
  );

  res.json({
    success: true,
    certificates: result.rows,
  });
});

const createCertificate = asyncHandler(async (req, res) => {
  const { course, instructor, image, description, issued_on } = req.body;

  if (!course) {
    throw new ApiError(400, "Certificate course is required");
  }

  const result = await pool.query(
    `
    INSERT INTO certificates (
      user_id,
      course,
      instructor,
      image,
      description,
      issued_on
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      req.user.id,
      course,
      instructor || null,
      image || null,
      description || null,
      issued_on || null,
    ],
  );

  res.status(201).json({
    success: true,
    message: "Certificate created successfully",
    certificate: result.rows[0],
  });
});

const updateCertificate = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM certificates WHERE id = $1",
    [req.params.id],
  );

  const certificate = currentResult.rows[0];

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  if (certificate.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to update this certificate");
  }

  const course = req.body.course ?? certificate.course;
  const instructor = req.body.instructor ?? certificate.instructor;
  const image = req.body.image ?? certificate.image;
  const description = req.body.description ?? certificate.description;
  const issued_on = req.body.issued_on ?? certificate.issued_on;

  const result = await pool.query(
    `
    UPDATE certificates
    SET
      course = $1,
      instructor = $2,
      image = $3,
      description = $4,
      issued_on = $5
    WHERE id = $6
    RETURNING *
    `,
    [course, instructor, image, description, issued_on, req.params.id],
  );

  res.json({
    success: true,
    message: "Certificate updated successfully",
    certificate: result.rows[0],
  });
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const currentResult = await pool.query(
    "SELECT * FROM certificates WHERE id = $1",
    [req.params.id],
  );

  const certificate = currentResult.rows[0];

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  if (certificate.user_id !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You are not allowed to delete this certificate");
  }

  await pool.query("DELETE FROM certificates WHERE id = $1", [req.params.id]);

  res.json({
    success: true,
    message: "Certificate deleted successfully",
  });
});

module.exports = {
  getAllCertificates,
  getCertificateById,
  getMyCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
};
