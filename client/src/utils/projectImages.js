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

/** Displayable project images: drops repo links that were saved into the images field. */
export const getProjectValidImages = (project) => {
  if (!project?.images) return [];
  return normalizeProjectImages(project.images).filter(
    (url) =>
      typeof url === "string" &&
      url.trim() &&
      !url.endsWith(".git") &&
      !url.includes("github.com/"),
  );
};

/** Preferred thumbnail: a permanent (non-legacy-disk) image when one exists. */
export const getProjectMainImage = (project) => {
  const validImages = getProjectValidImages(project);
  const permanent = keepPermanentImages(validImages);
  return permanent[0] || validImages[0] || null;
};
