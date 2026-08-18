const fs = require("fs/promises");
const path = require("path");

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * Converts an uploaded file on disk to a base64 data URL, then deletes the temp file.
 * Render's filesystem is ephemeral — images must live in PostgreSQL, not on disk.
 */
const fileToDataUrl = async (filePath) => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const buffer = await fs.readFile(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "image/jpeg";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  await fs.unlink(absolutePath).catch(() => {});

  return dataUrl;
};

module.exports = { fileToDataUrl };
