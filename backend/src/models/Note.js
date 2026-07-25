const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema({ front: String, back: String }, { _id: false });

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    format: {
      type: String,
      enum: ["notes", "cheatsheet", "summary", "flashcards", "mind_map", "interview_questions"],
      required: true,
    },
    sourceDocument: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    title: { type: String, default: "" },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
    content: { type: String, default: "" }, // markdown — used for every format except flashcards
    flashcards: [flashcardSchema], // used only when format === "flashcards"
  },
  { timestamps: true }
);

noteSchema.methods.toSummary = function () {
  return {
    id: this._id,
    topic: this.topic,
    format: this.format,
    title: this.title,
    status: this.status,
    errorMessage: this.errorMessage,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Note", noteSchema);
