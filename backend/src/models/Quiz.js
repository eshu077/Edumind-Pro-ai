const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mcq", "true_false", "fill_blank", "coding"], required: true },
    question: { type: String, required: true },
    options: [{ type: String }], // used for "mcq" only; "true_false" implies ["True", "False"]
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    types: [{ type: String, enum: ["mcq", "true_false", "fill_blank", "coding"] }],
    title: { type: String, default: "" },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
    questions: [questionSchema],
  },
  { timestamps: true }
);

quizSchema.methods.toSummary = function () {
  return {
    id: this._id,
    topic: this.topic,
    difficulty: this.difficulty,
    types: this.types,
    title: this.title,
    status: this.status,
    errorMessage: this.errorMessage,
    questionCount: this.questions.length,
    createdAt: this.createdAt,
  };
};

// Strips correct answers/explanations — safe to send before a quiz is submitted.
quizSchema.methods.toPlayable = function () {
  return {
    id: this._id,
    title: this.title,
    topic: this.topic,
    difficulty: this.difficulty,
    status: this.status,
    questions: this.questions.map((q, i) => ({
      index: i,
      type: q.type,
      question: q.question,
      options: q.type === "mcq" ? q.options : q.type === "true_false" ? ["True", "False"] : undefined,
    })),
  };
};

module.exports = mongoose.model("Quiz", quizSchema);
