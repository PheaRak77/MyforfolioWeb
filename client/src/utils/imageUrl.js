import { getImagePlaceholder } from "./imagePlaceholder.js";

/**
 * Formats image URLs for deployed environments with automatic performance optimizations:
 * - On-the-fly Cloudinary WebP/AVIF conversion (`f_auto`)
 * - Smart perceptual compression (`q_auto:good`)
 * - Auto device-pixel-ratio (`dpr_auto`)
 * - Responsive dimensional limits per variant
 */

const getApiBaseUrl = () =>
  (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "https://myportfolio-api-8b84.onrender.com/api"
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

/**
 * Injects responsive Cloudinary transformation parameters for instant loading.
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com") || !url.includes("/image/upload/")) return url;

  // Don't duplicate if transformations already present in URL
  if (/\/image\/upload\/[a-z0-9_,:]+\/v[0-9]+/i.test(url)) {
    return url;
  }

  const {
    width,
    height,
    crop = "limit",
    gravity,
    quality = "auto:good",
    format = "auto",
    aspectRatio,
  } = options;

  const transforms = [`f_${format}`, `q_${quality}`, "dpr_auto"];

  if (aspectRatio) transforms.push(`ar_${aspectRatio}`);
  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  if (crop && (width || height || aspectRatio)) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);

  const transformString = transforms.join(",");
  return url.replace("/image/upload/", `/image/upload/${transformString}/`);
};

const RESPONSIVE_WIDTHS = {
  avatar: [80, 160, 240],
  profile: [320, 480, 640, 800, 1000],
  hero: [400, 600, 800, 1000],
  project: [360, 640, 900],
  certificate: [360, 640, 900],
  "certificate-modal": [800, 1200, 1600],
  default: [480, 800, 1200],
};

const VARIANT_SIZES = {
  profile: { width: 800, height: 800, crop: "fill", gravity: "face" },
  avatar: { width: 240, height: 240, crop: "fill", gravity: "face" },
  project: { width: 900, crop: "limit" },
  certificate: { width: 900, crop: "limit" },
  "certificate-modal": { width: 1600, crop: "limit" },
  hero: { width: 800, crop: "limit" },
  default: { width: 1200, crop: "limit" },
};

export const getCloudinarySrcSet = (url, options = {}) => {
  if (!url?.includes("cloudinary.com") || !url.includes("/image/upload/")) return undefined;
  const variant = options.variant || "default";
  const sizing = options.customSize || VARIANT_SIZES[variant] || VARIANT_SIZES.default;
  const widths = RESPONSIVE_WIDTHS[variant] || RESPONSIVE_WIDTHS.default;

  return widths
    .map((width) => {
      const widthOptions = { ...sizing, width };
      // Proportionally scale height if specified, preventing stretched 160x600 distortions
      if (sizing.width && sizing.height) {
        widthOptions.height = Math.round((sizing.height / sizing.width) * width);
      }
      return `${optimizeCloudinaryUrl(url, widthOptions)} ${width}w`;
    })
    .join(", ");
};

export const getFullImageUrl = (imagePath, options = {}) => {
  if (!imagePath || typeof imagePath !== "string") return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  const { label = "Image", variant = "default", allowLegacy = false, customSize } = options;

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

  // Apply Cloudinary speed & size optimization
  if (resolved.includes("cloudinary.com")) {
    const sizing = customSize || VARIANT_SIZES[variant] || VARIANT_SIZES.default;
    resolved = optimizeCloudinaryUrl(resolved, sizing);
  }

  return resolved;
};
