const router = require("express").Router();

const {
  getPublicProfile,
  getProfile,
  updateProfile,
} = require("../controllers/user.controller");

const { requireAuth } = require("../middleware/auth.middleware");

router.get("/public-profile", getPublicProfile);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

module.exports = router;
