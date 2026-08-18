/**
 * Normalizes image fields for API responses.
 * - Keeps data URLs and external CDN URLs as-is (forces HTTPS)
 * - Rewrites legacy Render disk paths to HTTPS upload URLs
 * - Marks ephemeral /uploads/ paths that are not data URLs (files lost on Render redeploy)
 */

const RENDER_HOST_PATTERN =
  /(?:https?:\/\/)?(?:myportfolio-api-8b84\.onrender\.com|localhost:5000|127\.0\.0\.1:5000)/i;

const normalizeSingleImage = (value) => {
  if (!value || typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  const apiBase = (
    process.env.API_PUBLIC_URL ||
    process.env.SERVER_URL ||
    "https://myportfolio-api-8b84.onrender.com"
  ).replace(/\/api\/?$/, "");

  if (trimmed.startsWith("/uploads/")) {
    return `${apiBase}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `${apiBase}/${trimmed}`;
  }

  return trimmed;
};

const isLegacyDiskUpload = (value) => {
  if (!value || typeof value !== "string") return false;
  if (value.startsWith("data:")) return false;
  return RENDER_HOST_PATTERN.test(value) && value.includes("/uploads/");
};

const normalizeImageField = (value) => normalizeSingleImage(value);

const normalizeImageArray = (values) => {
  if (!Array.isArray(values)) return values;
  return values.map((item) => normalizeSingleImage(item)).filter(Boolean);
};

module.exports = {
  normalizeSingleImage,
  normalizeImageField,
  normalizeImageArray,
  isLegacyDiskUpload,
};
