const router = require("express").Router();

const upload = require("../middleware/upload.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  uploadImage,
  uploadRawImage,
} = require("../controllers/upload.controller");

router.post("/profile-image", requireAuth, upload.single("image"), uploadImage);
router.post("/project-image", requireAuth, upload.single("image"), uploadImage);
router.post(
  "/certificate-image",
  requireAuth,
  upload.single("image"),
  uploadImage,
);
router.post("/raw", requireAuth, uploadRawImage);

module.exports = router;

