const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { fileToDataUrl } = require("../utils/fileToDataUrl");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  // Store as base64 data URL — Render disk is ephemeral and files are lost on redeploy
  const dataUrl = await fileToDataUrl(req.file.path);

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
    url: dataUrl,
  });
});

module.exports = {
  uploadImage,
};
