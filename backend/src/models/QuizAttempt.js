const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    userAnswer: { type: String, default: "" },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: [answerSchema],
    correctCount: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    scorePercent: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
