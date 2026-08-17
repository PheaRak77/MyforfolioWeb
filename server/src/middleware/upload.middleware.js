const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const folders = [
  "uploads",
  "uploads/profile",
  "uploads/project",
  "uploads/certificate",
];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    const originalUrl = req.originalUrl || "";
    let subfolder = "profile";

    if (originalUrl.includes("project")) {
      subfolder = "project";
    }

    if (originalUrl.includes("certificate")) {
      subfolder = "certificate";
    }
    cb(null, path.join("uploads", subfolder));
  },

  filename: function (req, file, cb) {
    const extension = file.mimetype.split("/")[1].split("+")[0];
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, `${randomName}.${extension}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024),
  },
});

module.exports = upload;
