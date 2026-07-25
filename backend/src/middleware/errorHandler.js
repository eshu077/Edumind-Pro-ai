function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, message: `That ${field} is already in use` });
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (20MB max)." : err.message;
    return res.status(400).json({ success: false, message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
  });
}

module.exports = { notFound, errorHandler };
