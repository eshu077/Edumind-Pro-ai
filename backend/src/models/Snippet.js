const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled" },
    language: { type: String, required: true },
    code: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Snippet", snippetSchema);
