const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const filePath = req.file.path.replace(/\\/g, "/");
  const isProd = process.env.NODE_ENV === "production";
  const protocol = req.headers["x-forwarded-proto"] || (isProd ? "https" : req.protocol);
  const host = req.get("host");
  const url = `${protocol}://${host}/${filePath}`;

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
    url,
  });
});

module.exports = {
  uploadImage,
};
