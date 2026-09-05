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

const CANONICAL_CLIENT_URL = "https://www.ypheareak.site";

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    // Google returns this value unchanged to the callback. Always use the
    // official URL rather than the Vercel deployment that served this route.
    state: CANONICAL_CLIENT_URL,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "https://www.ypheareak.site/login?error=google_failed",
  }),
  googleCallback,
);

module.exports = router;
