import { isLegacyDiskUrl } from "./imageUrl";

/** Normalize project images from API (array) or legacy comma-string */
export const normalizeProjectImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.filter((img) => typeof img === "string" && img.trim());
  }
  if (typeof images === "string" && images.trim()) {
    if (images.trim().startsWith("data:")) return [images.trim()];
    return images
      .split(/,(?=\s*(?:data:|https?:|\/uploads))/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const hasLegacyProjectImages = (images) =>
  normalizeProjectImages(images).some(isLegacyDiskUrl);

export const keepPermanentImages = (images) =>
  normalizeProjectImages(images).filter((img) => !isLegacyDiskUrl(img));
