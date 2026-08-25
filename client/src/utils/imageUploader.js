import api from "../api/axios";
import { compressImageFileToBlob } from "./imageCompressor";

/**
 * Uploads an image file to Cloudinary via backend upload API.
 * Automatically pre-compresses large files for instant network transfer.
 * Keeps image files on Cloudinary so the database never stores slow Base64 blobs.
 * 
 * @param {File} file - Selected image file
 * @param {string} endpoint - Backend upload route (e.g. "/uploads/certificate-image")
 * @param {object} options - Optional compression fallback options
 * @returns {Promise<{ url: string, provider: "cloudinary" | "base64" }>}
 */
export const uploadMediaImage = async (
  file,
  endpoint = "/uploads/certificate-image",
  options = { maxWidth: 1600, maxHeight: 1600, quality: 0.88 }
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // 1. Optimize Blob client-side before sending across network
  let uploadPayload = file;
  try {
    uploadPayload = await compressImageFileToBlob(
      file,
      options.maxWidth || 1600,
      options.maxHeight || 1600,
      options.quality || 0.88
    );
  } catch (compErr) {
    console.warn("Client pre-compression skipped:", compErr?.message);
  }

  // 2. Upload to Backend -> Cloudinary CDN
  try {
    const formData = new FormData();
    formData.append("image", uploadPayload, file.name || "image.jpg");

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
    console.warn("Backend Cloudinary upload failed, falling back to local base64:", err?.message);
  }

  throw new Error("Image upload failed. Please check your connection and try again.");
};
