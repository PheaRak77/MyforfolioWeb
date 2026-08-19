const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();

  return Boolean(
    name &&
      name !== "YOUR_CLOUD_NAME_HERE" &&
      key &&
      secret
  );
};

// Configure Cloudinary dynamically
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
}

/**
 * Uploads a file path or Base64 data string to Cloudinary.
 * Cleans up any local temporary file automatically.
 *
 * @param {string} filePathOrData - Local file path or base64 data string
 * @param {object} options - Optional folder and transformation settings
 * @returns {Promise<string|null>} Cloudinary HTTPS secure URL or null if failed
 */
const uploadToCloudinary = async (filePathOrData, options = {}) => {
  if (!filePathOrData) return null;

  if (!isCloudinaryConfigured()) {
    return null;
  }

  // Re-ensure config is up to date with any newly loaded env vars
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });

  const { folder = "portfolio", publicId = null } = options;

  try {
    const uploadOptions = {
      folder: `portfolio/${folder}`,
      resource_type: "image",
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(filePathOrData, uploadOptions);

    // Clean up local file if it is a disk path
    if (typeof filePathOrData === "string" && !filePathOrData.startsWith("data:")) {
      await fs.unlink(filePathOrData).catch(() => {});
    }

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    // Still clean up local file
    if (typeof filePathOrData === "string" && !filePathOrData.startsWith("data:")) {
      await fs.unlink(filePathOrData).catch(() => {});
    }
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
};

