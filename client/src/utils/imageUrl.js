/**
 * Formats image URLs so that relative paths (/uploads/...) or localhost URLs
 * are properly routed in deployed environments.
 *
 * Production strategy:
 * - data: / blob: URLs → returned as-is (stored in PostgreSQL, survives Render redeploys)
 * - External CDN URLs → returned as-is with HTTPS enforced
 * - Legacy Render /uploads/ paths → proxied through same-origin /media/ on Vercel
 *   (fixes Safari/Brave mixed-content & cross-origin blocking)
 */

const getApiBaseUrl = () =>
  (
    import.meta.env.VITE_API_URL || "https://myportfolio-api-8b84.onrender.com/api"
  )
    .trim()
    .replace(/\/api\/?$/, "");

const isBrowser = typeof window !== "undefined";

const shouldUseMediaProxy = () => {
  if (!isBrowser) return false;
  const host = window.location.hostname;
  return (
    !host.includes("localhost") &&
    !host.includes("127.0.0.1") &&
    (host.includes("vercel.app") || import.meta.env.PROD)
  );
};

export const isLegacyDiskUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return false;
  if (imagePath.startsWith("data:")) return false;
  return /\/uploads\//i.test(imagePath);
};

export const getFullImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  if (cleanPath.startsWith("data:") || cleanPath.startsWith("blob:")) {
    return cleanPath;
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

  if (shouldUseMediaProxy() && resolved.includes("/uploads/")) {
    const uploadsIndex = resolved.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
      return resolved.substring(uploadsIndex);
    }
  }

  return resolved;
};
