const crypto = require("crypto");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/tokens");
const {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} = require("../utils/sendEmail");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

async function issueSession(user, res, statusCode = 200) {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5); // keep last 5 devices
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toSafeObject(),
  });
}

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const user = new User({ name, email, password });
    const rawToken = user.createEmailVerificationToken();
    await user.save();

    const verifyLink = `${CLIENT_URL}/verify-email?token=${rawToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your EduMind Pro AI account",
        html: verificationEmailTemplate(user.name, verifyLink),
      });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify your account.",
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/verify-email?token=...
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Missing verification token" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Verification link is invalid or expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    }

    user.lastActiveAt = new Date();
    return issueSession(user, res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: "Refresh token invalid or expired" });
    }

    const user = await User.findById(decoded.sub).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(token)) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: "Refresh token not recognized" });
    }

    // Rotate: remove used token, issue a new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    return issueSession(user, res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } });
    }
    clearRefreshCookie(res);
    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });

    // Always respond the same way to avoid leaking which emails are registered
    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    };

    if (!user) return res.json(genericResponse);

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetLink = `${CLIENT_URL}/reset-password?token=${rawToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your EduMind Pro AI password",
        html: resetPasswordEmailTemplate(user.name, resetLink),
      });
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr.message);
    }

    return res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires +refreshTokens");

    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // force re-login on all devices
    await user.save();

    return res.json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  return res.json({ success: true, user: req.user.toSafeObject() });
}

// GET /api/auth/google/callback  (after passport.authenticate succeeds)
async function googleCallback(req, res, next) {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    // Hand the access token to the frontend via a short-lived redirect fragment
    return res.redirect(`${CLIENT_URL}/auth/callback#accessToken=${accessToken}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleCallback,
};
