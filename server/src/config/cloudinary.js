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
 * Uploads a Buffer, Base64 data string, or file path to Cloudinary.
 *
 * @param {Buffer|string} input - File buffer, base64 data URL, or file path
 * @param {object} options - Optional folder and publicId settings
 * @returns {Promise<string|null>} Cloudinary HTTPS secure URL or null if failed
 */
const uploadToCloudinary = async (input, options = {}) => {
  if (!input) return null;

  if (!isCloudinaryConfigured()) {
    return null;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });

  const { folder = "portfolio", publicId = null } = options;

  const uploadOptions = {
    folder: `portfolio/${folder}`,
    resource_type: "image",
  };

  if (publicId) {
    uploadOptions.public_id = publicId;
  }

  try {
    // If input is a Buffer (from multer.memoryStorage)
    if (Buffer.isBuffer(input)) {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error("Cloudinary stream upload error:", error.message);
              return reject(error);
            }
            resolve(result.secure_url);
          },
        );
        uploadStream.end(input);
      });
    }

    // If input is a Base64 string or file path
    const result = await cloudinary.uploader.upload(input, uploadOptions);

    if (typeof input === "string" && !input.startsWith("data:")) {
      await fs.unlink(input).catch(() => {});
    }

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    if (typeof input === "string" && !input.startsWith("data:")) {
      await fs.unlink(input).catch(() => {});
    }
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
};


