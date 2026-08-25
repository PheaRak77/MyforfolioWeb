const pool = require("../config/db");
const {
  normalizeImageArray,
  normalizeImageField,
  isLegacyDiskUpload,
} = require("../utils/normalizeImage");
const sanitizeUser = require("../utils/sanitizeUser");
const asyncHandler = require("../utils/asyncHandler");

const getPublicPortfolio = asyncHandler(async (req, res) => {
  // One request replaces four homepage requests. Queries run concurrently and
  // the response is cached at the HTTP layer by the surrounding middleware.
  const [profileResult, projectsResult, certificatesResult, skillsResult] = await Promise.all([
    pool.query(`
      SELECT id, name, email, phone, dob, profile_image, role, created_at
      FROM users
      ORDER BY
        CASE WHEN role = 'admin' THEN 1 ELSE 2 END,
        CASE WHEN profile_image IS NOT NULL OR phone IS NOT NULL OR dob IS NOT NULL THEN 1 ELSE 2 END,
        created_at ASC
      LIMIT 1
    `),
    pool.query(`
      SELECT p.* FROM projects p
      INNER JOIN users u ON u.id = p.user_id
      WHERE u.role = 'admin'
      ORDER BY p.created_at DESC
    `),
    pool.query(`
      SELECT c.* FROM certificates c
      INNER JOIN users u ON u.id = c.user_id
      WHERE u.role = 'admin'
      ORDER BY c.created_at DESC
    `),
    pool.query(`
      SELECT s.* FROM skills s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.role = 'admin'
      ORDER BY s.display_order ASC, s.percentage DESC, s.created_at ASC
    `),
  ]);

  const profile = profileResult.rows[0];
  res.json({
    success: true,
    user: profile ? {
      ...sanitizeUser(profile),
      profile_image: normalizeImageField(profile.profile_image),
      profile_image_missing: isLegacyDiskUpload(profile.profile_image),
    } : null,
    projects: projectsResult.rows.map((project) => ({
      ...project,
      images: normalizeImageArray(project.images),
      images_missing: Array.isArray(project.images) && project.images.some(isLegacyDiskUpload),
    })),
    certificates: certificatesResult.rows.map((certificate) => ({
      ...certificate,
      image: normalizeImageField(certificate.image),
      image_missing: isLegacyDiskUpload(certificate.image),
    })),
    skills: skillsResult.rows,
  });
});

module.exports = { getPublicPortfolio };
