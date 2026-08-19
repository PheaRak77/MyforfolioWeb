const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { fileToDataUrl } = require("../utils/fileToDataUrl");
const {
  isCloudinaryConfigured,
  uploadToCloudinary,
} = require("../config/cloudinary");

const getSubfolderFromUrl = (originalUrl = "") => {
  if (originalUrl.includes("project")) return "project";
  if (originalUrl.includes("certificate")) return "certificate";
  if (originalUrl.includes("profile")) return "profile";
  return "general";
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const subfolder = getSubfolderFromUrl(req.originalUrl);

  // 1. Try uploading to Cloudinary (permanent CDN URL)
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path, {
        folder: subfolder,
      });

      if (cloudinaryUrl) {
        return res.status(201).json({
          success: true,
          message: "Image uploaded to Cloudinary successfully",
          url: cloudinaryUrl,
          provider: "cloudinary",
        });
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to base64:", err.message);
    }
  }

  // 2. Fallback: Convert to Base64 data URL stored directly in database
  const dataUrl = await fileToDataUrl(req.file.path);

  res.status(201).json({
    success: true,
    message: "Image uploaded and stored as data URL",
    url: dataUrl,
    provider: "base64",
  });
});

/**
 * Upload raw Base64 data URL directly to Cloudinary (optional conversion)
 */
const uploadRawImage = asyncHandler(async (req, res) => {
  const { image, folder = "general" } = req.body;

  if (!image || typeof image !== "string") {
    throw new ApiError(400, "Image data is required");
  }

  if (isCloudinaryConfigured()) {
    const cloudinaryUrl = await uploadToCloudinary(image, { folder });
    if (cloudinaryUrl) {
      return res.status(201).json({
        success: true,
        message: "Image uploaded to Cloudinary",
        url: cloudinaryUrl,
        provider: "cloudinary",
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Image retained as data URL",
    url: image,
    provider: "base64",
  });
});

module.exports = {
  uploadImage,
  uploadRawImage,
};

