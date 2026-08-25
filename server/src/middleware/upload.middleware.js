const multer = require("multer");

// Use memoryStorage — zero disk dependency, perfectly compatible with Cloudinary & serverless/Render
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ];

  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WebP, and AVIF images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 6 * 1024 * 1024),
  },
});

module.exports = upload;
