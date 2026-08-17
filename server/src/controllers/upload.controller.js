const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const filePath = req.file.path.replace(/\\/g, "/");
  const url = `${req.protocol}://${req.get("host")}/${filePath}`;

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
    url,
  });
});

module.exports = {
  uploadImage,
};
