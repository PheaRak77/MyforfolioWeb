import api from "../api/axios";
import { compressImageFile } from "./imageCompressor";

/**
 * Uploads an image file to Cloudinary via backend upload API.
 * Automatically falls back to compressed Base64 data URL if upload fails.
 * 
 * @param {File} file - Selected image file
 * @param {string} endpoint - Backend upload route (e.g. "/uploads/certificate-image")
 * @param {object} options - Optional compression fallback options
 * @returns {Promise<{ url: string, provider: "cloudinary" | "base64" }>}
 */
export const uploadMediaImage = async (
  file,
  endpoint = "/uploads/certificate-image",
  options = { maxWidth: 1000, maxHeight: 800, quality: 0.85 }
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // 1. Try uploading to Backend -> Cloudinary
  try {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 25000,
    });

    if (data?.success && data?.url) {
      return {
        url: data.url,
        provider: data.provider || (data.url.includes("cloudinary.com") ? "cloudinary" : "base64"),
      };
    }
  } catch (err) {
    console.warn("Backend Cloudinary upload failed, falling back to local compression:", err?.message);
  }

  // 2. Fallback: Compress to client-side base64 data URL
  const base64Url = await compressImageFile(
    file,
    options.maxWidth || 1000,
    options.maxHeight || 800,
    options.quality || 0.85
  );

  return {
    url: base64Url,
    provider: "base64",
  };
};
