const express = require("express");
const rateLimit = require("express-rate-limit");
const { passport, hasGoogleCredentials } = require("../config/passport");
const {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Tighter limiter on brute-forceable endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.get("/verify-email", verifyEmail);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", protect, getMe);

// Google OAuth2 — only wired up once GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL are set in .env
function requireGoogleConfigured(req, res, next) {
  if (!hasGoogleCredentials) {
    return res.status(501).json({
      success: false,
      message: "Google login isn't configured on this server yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL to backend/.env.",
    });
  }
  next();
}

router.get(
  "/google",
  requireGoogleConfigured,
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/google/callback",
  requireGoogleConfigured,
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  googleCallback
);

module.exports = router;
