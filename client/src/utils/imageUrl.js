/**
 * Formats image URLs so that relative paths (/uploads/...) or localhost URLs
 * are properly routed to the production backend API URL in deployed environments.
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  // If it's a data URL or blob URL, return as-is
  if (cleanPath.startsWith("data:") || cleanPath.startsWith("blob:")) {
    return cleanPath;
  }

  // Base API URL (e.g., https://myportfolio-api-8b84.onrender.com or http://localhost:5000)
  const apiUrl = (
    import.meta.env.VITE_API_URL || "https://myportfolio-api-8b84.onrender.com/api"
  )
    .trim()
    .replace(/\/api\/?$/, "");

  // If path contains localhost:5000 or 127.0.0.1:5000, rewrite to point to the active backend
  if (
    cleanPath.includes("localhost:5000") ||
    cleanPath.includes("127.0.0.1:5000")
  ) {
    const uploadIndex = cleanPath.indexOf("/uploads");
    if (uploadIndex !== -1) {
      const relativeUploadPath = cleanPath.substring(uploadIndex);
      return `${apiUrl}${relativeUploadPath}`;
    }
  }

  // If path is a relative uploads path
  if (cleanPath.startsWith("/uploads/")) {
    return `${apiUrl}${cleanPath}`;
  }
  if (cleanPath.startsWith("uploads/")) {
    return `${apiUrl}/${cleanPath}`;
  }

  // If it's already an external absolute URL (Unsplash, Cloudinary, AWS S3, etc.)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  // Default fallback to backend base URL
  return `${apiUrl}/${cleanPath.replace(/^\//, "")}`;
};
