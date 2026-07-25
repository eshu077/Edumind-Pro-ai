const mongoose = require("mongoose");

const studyTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD" — simplest key for calendar-style grouping
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studyTaskSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("StudyTask", studyTaskSchema);
