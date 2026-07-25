const User = require("../models/User");
const { uploadBuffer, isConfigured } = require("../config/cloudinary");

// PATCH /api/users/profile  { name }
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (name && name.trim()) user.name = name.trim();
    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/avatar  (multipart, field name "avatar")
async function uploadAvatar(req, res, next) {
  try {
    if (!isConfigured) {
      return res.status(501).json({
        success: false,
        message: "Avatar upload isn't configured on this server yet. Add CLOUDINARY_* to backend/.env.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const result = await uploadBuffer(req.file.buffer, {
      public_id: `user-${req.user._id}`,
      overwrite: true,
      transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
    });

    const user = await User.findById(req.user._id);
    user.avatar = result.secure_url;
    await user.save();

    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, uploadAvatar };
