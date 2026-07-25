const { v2: cloudinary } = require("cloudinary");

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "[EduMind Pro AI] Cloudinary is not configured — avatar upload will fail until CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are set in backend/.env."
  );
}

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "edumind-pro-ai/avatars", ...options }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = { cloudinary, isConfigured, uploadBuffer };
