const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const STORED_IMAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS stored_images (
    id SERIAL PRIMARY KEY,
    folder VARCHAR(50) DEFAULT 'general',
    mime_type VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL,
    byte_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

let tableReadyPromise = null;
const ensureStoredImagesTable = () => {
  if (!tableReadyPromise) {
    tableReadyPromise = pool.query(STORED_IMAGES_TABLE_SQL).catch((err) => {
      tableReadyPromise = null;
      throw err;
    });
  }
  return tableReadyPromise;
};

const getSubfolderFromUrl = (originalUrl = "") => {
  if (originalUrl.includes("project")) return "project";
  if (originalUrl.includes("certificate")) return "certificate";
  if (originalUrl.includes("profile")) return "profile";
  return "general";
};

const detectImageMimeType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  const header = buffer.subarray(0, 12);
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }
  if (header.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return "image/png";
  }
  if (
    header.subarray(0, 4).toString() === "RIFF" &&
    header.subarray(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    header.subarray(4, 8).toString() === "ftyp" &&
    header.subarray(8, 12).toString().includes("avif")
  ) {
    return "image/avif";
  }
  return null;
};

const saveImageBufferToDb = async ({ buffer, mimeType, folder = "general" }) => {
  await ensureStoredImagesTable();
  const { rows } = await pool.query(
    `
    INSERT INTO stored_images (folder, mime_type, data, byte_size)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [folder, mimeType, buffer, buffer.length],
  );
  return {
    id: rows[0].id,
    url: `/api/images/${rows[0].id}`,
  };
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Image file is required");
  }

  const mimeType = detectImageMimeType(req.file.buffer);
  if (!mimeType) {
    throw new ApiError(400, "Uploaded file is not a valid supported image");
  }

  const subfolder = getSubfolderFromUrl(req.originalUrl);
  const saved = await saveImageBufferToDb({
    buffer: req.file.buffer,
    mimeType,
    folder: subfolder,
  });

  return res.status(201).json({
    success: true,
    message: "Image saved to PostgreSQL database successfully",
    url: saved.url,
    provider: "database",
  });
});

/**
 * Save a Base64 data URL image directly into PostgreSQL stored_images.
 */
const uploadRawImage = asyncHandler(async (req, res) => {
  const { image, folder = "general" } = req.body;

  if (!image || typeof image !== "string") {
    throw new ApiError(400, "Image data is required");
  }
  if (image.length > 8 * 1024 * 1024) {
    throw new ApiError(413, "Image data is too large");
  }

  const match = image.match(/^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new ApiError(400, "Invalid base64 image format");
  }

  const buffer = Buffer.from(match[1], "base64");
  const mimeType = detectImageMimeType(buffer);
  if (!mimeType) {
    throw new ApiError(400, "Decoded image data is not a valid supported image");
  }

  const saved = await saveImageBufferToDb({ buffer, mimeType, folder });

  res.status(201).json({
    success: true,
    message: "Image saved to PostgreSQL database successfully",
    url: saved.url,
    provider: "database",
  });
});

/**
 * Stream a stored binary image from PostgreSQL with aggressive immutable CDN caching.
 */
const getStoredImage = asyncHandler(async (req, res) => {
  const imageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    throw new ApiError(400, "Invalid image id");
  }

  const { rows } = await pool.query(
    "SELECT mime_type, data FROM stored_images WHERE id = $1",
    [imageId],
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Image not found");
  }

  const { mime_type: mimeType, data } = rows[0];
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", data.length);
  res.setHeader(
    "Cache-Control",
    "public, max-age=31536000, s-maxage=31536000, immutable",
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.status(200).send(data);
});

module.exports = {
  uploadImage,
  uploadRawImage,
  getStoredImage,
  detectImageMimeType,
};
