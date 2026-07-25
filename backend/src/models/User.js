const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      // Not required: users who sign up via Google have no password
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["student", "admin"], default: "student" },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshTokens: [{ type: String, select: false }],

    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return rawToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h
  return rawToken;
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    xp: this.xp,
    streak: this.streak,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
