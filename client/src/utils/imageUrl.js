import { getImagePlaceholder } from "./imagePlaceholder";

/**
 * Formats image URLs for deployed environments.
 * Legacy Render /uploads/ files are gone after redeploy — returns SVG placeholder instead.
 */

const getApiBaseUrl = () =>
  (
    import.meta.env.VITE_API_URL || "https://myportfolio-api-8b84.onrender.com/api"
  )
    .trim()
    .replace(/\/api\/?$/, "");

const isBrowser = typeof window !== "undefined";

const isProductionHost = () => {
  if (!isBrowser) return false;
  const host = window.location.hostname;
  return !host.includes("localhost") && !host.includes("127.0.0.1");
};

export const isLegacyDiskUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return false;
  if (imagePath.startsWith("data:")) return false;
  return /\/uploads\//i.test(imagePath);
};

export const isBrokenImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return true;
  if (imagePath.startsWith("data:") || imagePath.startsWith("blob:")) return false;
  if (imagePath.startsWith("https://") && !isLegacyDiskUrl(imagePath)) return false;
  if (isLegacyDiskUrl(imagePath) && isProductionHost()) return true;
  return false;
};

export const getFullImageUrl = (imagePath, options = {}) => {
  if (!imagePath || typeof imagePath !== "string") return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  const { label = "Image", variant = "default", allowLegacy = false } = options;

  if (cleanPath.startsWith("data:") || cleanPath.startsWith("blob:")) {
    return cleanPath;
  }

  if (isLegacyDiskUrl(cleanPath) && isProductionHost() && !allowLegacy) {
    return getImagePlaceholder(label, variant);
  }

  const apiUrl = getApiBaseUrl();
  let resolved = cleanPath;

  if (
    cleanPath.includes("localhost:5000") ||
    cleanPath.includes("127.0.0.1:5000")
  ) {
    const uploadIndex = cleanPath.indexOf("/uploads");
    if (uploadIndex !== -1) {
      resolved = `${apiUrl}${cleanPath.substring(uploadIndex)}`;
    }
  } else if (cleanPath.startsWith("/uploads/")) {
    resolved = `${apiUrl}${cleanPath}`;
  } else if (cleanPath.startsWith("uploads/")) {
    resolved = `${apiUrl}/${cleanPath}`;
  } else if (!cleanPath.startsWith("http://") && !cleanPath.startsWith("https://")) {
    resolved = `${apiUrl}/${cleanPath.replace(/^\//, "")}`;
  }

  if (resolved.startsWith("http://")) {
    resolved = resolved.replace(/^http:\/\//i, "https://");
  }

  return resolved;
};
