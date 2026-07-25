const multer = require("multer");
const { SUPPORTED_EXTENSIONS, getExtension } = require("../utils/extractText");

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const storage = multer.memoryStorage(); // no disk writes — buffer goes straight to text extraction

function fileFilter(req, file, cb) {
  const ext = getExtension(file.originalname);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Unsupported file type: .${ext}. Allowed: ${SUPPORTED_EXTENSIONS.join(", ")}`));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

module.exports = upload;
