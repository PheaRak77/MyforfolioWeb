const pool = require("../config/db");
const {
  normalizeImageArray,
  normalizeImageField,
  isLegacyDiskUpload,
} = require("../utils/normalizeImage");
const sanitizeUser = require("../utils/sanitizeUser");
const asyncHandler = require("../utils/asyncHandler");

const PUBLIC_PORTFOLIO_QUERY = `
  WITH admin_user AS (
    SELECT id, name, email, phone, dob, profile_image, role, created_at
    FROM users
    ORDER BY
      CASE WHEN role = 'admin' THEN 1 ELSE 2 END,
      CASE WHEN profile_image IS NOT NULL OR phone IS NOT NULL OR dob IS NOT NULL THEN 1 ELSE 2 END,
      created_at ASC
    LIMIT 1
  )
  SELECT
    (SELECT row_to_json(admin_user) FROM admin_user) AS profile,
    COALESCE((
      SELECT json_agg(p ORDER BY p.created_at DESC)
      FROM projects p
      INNER JOIN users u ON u.id = p.user_id
      WHERE u.role = 'admin'
    ), '[]'::json) AS projects,
    COALESCE((
      SELECT json_agg(c ORDER BY c.created_at DESC)
      FROM certificates c
      INNER JOIN users u ON u.id = c.user_id
      WHERE u.role = 'admin'
    ), '[]'::json) AS certificates,
    COALESCE((
      SELECT json_agg(s ORDER BY s.display_order ASC, s.percentage DESC, s.created_at ASC)
      FROM skills s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.role = 'admin'
    ), '[]'::json) AS skills
`;

/**
 * Fetches the complete public portfolio in ONE PostgreSQL CTE round-trip
 * instead of 4 separate queries, then normalizes image fields.
 */
const buildPublicPortfolioPayload = async () => {
  const { rows } = await pool.query(PUBLIC_PORTFOLIO_QUERY);
  const row = rows[0] || {};
  const profile = row.profile || null;
  const projects = Array.isArray(row.projects) ? row.projects : [];
  const certificates = Array.isArray(row.certificates) ? row.certificates : [];
  const skills = Array.isArray(row.skills) ? row.skills : [];

  return {
    success: true,
    user: profile
      ? {
          ...sanitizeUser(profile),
          profile_image: normalizeImageField(profile.profile_image),
          profile_image_missing: isLegacyDiskUpload(profile.profile_image),
        }
      : null,
    projects: projects.map((project) => ({
      ...project,
      images: normalizeImageArray(project.images),
      images_missing:
        Array.isArray(project.images) && project.images.some(isLegacyDiskUpload),
    })),
    certificates: certificates.map((certificate) => ({
      ...certificate,
      image: normalizeImageField(certificate.image),
      image_missing: isLegacyDiskUpload(certificate.image),
    })),
    skills,
  };
};

const getPublicPortfolio = asyncHandler(async (req, res) => {
  const payload = await buildPublicPortfolioPayload();
  res.json(payload);
});

module.exports = { getPublicPortfolio, buildPublicPortfolioPayload };
