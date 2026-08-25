const router = require("express").Router();

const upload = require("../middleware/upload.middleware");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const {
  uploadImage,
  uploadRawImage,
} = require("../controllers/upload.controller");

router.post("/profile-image", requireAuth, requireAdmin, upload.single("image"), uploadImage);
router.post("/project-image", requireAuth, requireAdmin, upload.single("image"), uploadImage);
router.post(
  "/certificate-image",
  requireAuth, requireAdmin,
  upload.single("image"),
  uploadImage,
);
router.post("/raw", requireAuth, requireAdmin, uploadRawImage);

module.exports = router;
