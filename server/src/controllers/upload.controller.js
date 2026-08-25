const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
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

const hasAllowedImageSignature = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  const header = buffer.subarray(0, 12);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
  const isAvif = header.subarray(4, 8).toString() === "ftyp" && header.subarray(8, 12).toString().includes("avif");
  return isJpeg || isPng || isWebp || isAvif;
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Image file is required");
  }
  if (!hasAllowedImageSignature(req.file.buffer)) {
    throw new ApiError(400, "Uploaded file is not a valid supported image");
  }

  const subfolder = getSubfolderFromUrl(req.originalUrl);

  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Image storage is not configured. Please configure Cloudinary and try again.");
  }

  const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, { folder: subfolder });
  if (!cloudinaryUrl) {
    throw new ApiError(502, "Image upload failed. Please try again.");
  }

  return res.status(201).json({
    success: true,
    message: "Image uploaded to Cloudinary successfully",
    url: cloudinaryUrl,
    provider: "cloudinary",
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
  if (image.length > 8 * 1024 * 1024) {
    throw new ApiError(413, "Image data is too large");
  }

  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Image storage is not configured. Please configure Cloudinary and try again.");
  }
  const cloudinaryUrl = await uploadToCloudinary(image, { folder });
  if (!cloudinaryUrl) {
    throw new ApiError(502, "Image upload failed. Please try again.");
  }

  res.status(201).json({
    success: true,
    message: "Image uploaded to Cloudinary",
    url: cloudinaryUrl,
    provider: "cloudinary",
  });
});

module.exports = {
  uploadImage,
  uploadRawImage,
};
