const router = require("express").Router();
const passport = require("passport");

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
} = require("../controllers/auth.controller");

const { requireAuth } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_failed`,
  }),
  googleCallback,
);

module.exports = router;
