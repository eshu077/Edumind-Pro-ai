const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    chunkIndex: { type: Number, required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    sizeBytes: { type: Number },
    status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
    errorMessage: { type: String },
    chunkCount: { type: Number, default: 0 },
    chunks: [chunkSchema],
  },
  { timestamps: true }
);

documentSchema.methods.toSummary = function () {
  return {
    id: this._id,
    originalName: this.originalName,
    fileType: this.fileType,
    status: this.status,
    errorMessage: this.errorMessage,
    chunkCount: this.chunkCount,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Document", documentSchema);
