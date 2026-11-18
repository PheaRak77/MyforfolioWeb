import api from "../api/axios";
import { compressImageFileToBlob } from "./imageCompressor";

/**
 * Compresses an image client-side and uploads it directly into PostgreSQL via the backend API.
 *
 * @param {File} file - Selected image file
 * @param {string} endpoint - Backend upload route (e.g. "/uploads/project-image")
 * @param {object} options - Optional compression settings
 * @returns {Promise<{ url: string, provider: "database" | "cloudinary" | "base64" }>}
 */
export const uploadMediaImage = async (
  file,
  endpoint = "/uploads/certificate-image",
  options = { maxWidth: 1280, maxHeight: 1280, quality: 0.82 }
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  let uploadPayload = file;
  try {
    uploadPayload = await compressImageFileToBlob(
      file,
      options.maxWidth || 1280,
      options.maxHeight || 1280,
      options.quality || 0.82
    );
  } catch (compErr) {
    console.warn("Client pre-compression skipped:", compErr?.message);
  }

  try {
    const ext = uploadPayload.type === "image/webp" ? "webp" : "jpg";
    const filename =
      uploadPayload === file && file.name ? file.name : `upload.${ext}`;
    const formData = new FormData();
    formData.append("image", uploadPayload, filename);

    const { data } = await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    if (data?.success && data?.url) {
      return {
        url: data.url,
        provider: data.provider || "database",
      };
    }

    throw new Error(data?.message || "Unexpected upload response");
  } catch (err) {
    const serverMessage = err.response?.data?.message || err.message;
    console.error("Database image upload failed:", serverMessage);
    throw new Error(
      serverMessage || "Image upload failed. Please check your connection and try again.",
      { cause: err }
    );
  }
};
