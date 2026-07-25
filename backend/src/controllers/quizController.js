const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const groq = require("../config/groq");

const QUIZ_MODEL = "llama-3.3-70b-versatile";

const TYPE_LABELS = {
  mcq: "multiple choice (exactly 4 options)",
  true_false: "true/false",
  fill_blank: "fill in the blank (short exact answer)",
  coding: "short coding/conceptual question with a concise reference answer",
};

function buildPrompt({ topic, difficulty, questionCount, types }) {
  const typeList = types.map((t) => TYPE_LABELS[t]).join(", ");
  return `You are an expert quiz writer. Generate a quiz as a single valid JSON object — no markdown fences, no commentary before or after it.

JSON schema:
{
  "title": string,
  "questions": [
    {
      "type": "mcq" | "true_false" | "fill_blank" | "coding",
      "question": string,
      "options": [string] (exactly 4 items — ONLY include this field for type "mcq"),
      "correctAnswer": string (for mcq: must exactly match one of the options; for true_false: "True" or "False"; for fill_blank: the short exact expected answer; for coding: a concise reference answer covering the key terms expected),
      "explanation": string (1-2 sentences on why that answer is correct)
    }
  ]
}

Requirements:
- Exactly ${questionCount} questions total.
- Only use these question types, distributed roughly evenly: ${typeList}.
- Topic: "${topic}". Difficulty: "${difficulty}".
- Every question must be unambiguous with a single defensible correct answer.
- Return ONLY the JSON object described above.`;
}

function stripCodeFences(text) {
  return text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

// POST /api/quizzes  { topic, difficulty, questionCount, types }
async function createQuiz(req, res, next) {
  try {
    const { topic, difficulty, questionCount, types } = req.body;

    if (!topic || !difficulty || !questionCount || !Array.isArray(types) || types.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "topic, difficulty, questionCount, and at least one type are required" });
    }
    const count = Math.min(Math.max(parseInt(questionCount, 10) || 0, 1), 25);
    const validTypes = types.filter((t) => Object.keys(TYPE_LABELS).includes(t));
    if (validTypes.length === 0) {
      return res.status(400).json({ success: false, message: "At least one valid question type is required" });
    }
    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Invalid difficulty" });
    }

    const quiz = await Quiz.create({ user: req.user._id, topic, difficulty, types: validTypes, status: "generating" });
    res.status(202).json({ success: true, quiz: quiz.toSummary() });

    try {
      const completion = await groq.chat.completions.create({
        model: QUIZ_MODEL,
        messages: [{ role: "user", content: buildPrompt({ topic, difficulty, questionCount: count, types: validTypes }) }],
        temperature: 0.6,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(stripCodeFences(raw));

      const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
        .slice(0, count)
        .filter((q) => validTypes.includes(q.type))
        .map((q) => ({
          type: q.type,
          question: String(q.question || ""),
          options: q.type === "mcq" ? (Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : []) : [],
          correctAnswer: String(q.correctAnswer || ""),
          explanation: String(q.explanation || ""),
        }))
        .filter((q) => q.question && q.correctAnswer);

      if (questions.length === 0) {
        throw new Error("The model returned no usable questions for this topic.");
      }

      quiz.title = String(parsed.title || `${topic} Quiz`);
      quiz.questions = questions;
      quiz.status = "ready";
      await quiz.save();
    } catch (genErr) {
      console.error("Quiz generation failed:", genErr);
      quiz.status = "failed";
      quiz.errorMessage = "Couldn't generate this quiz. Try again, or adjust the topic/settings.";
      await quiz.save();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/quizzes
async function listQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, quizzes: quizzes.map((q) => q.toSummary()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/quizzes/:id — playable version, answers stripped
async function getQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    res.json({ success: true, quiz: quiz.status === "ready" ? quiz.toPlayable() : quiz.toSummary() });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/quizzes/:id
async function deleteQuiz(req, res, next) {
  try {
    const result = await Quiz.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Quiz not found" });
    await QuizAttempt.deleteMany({ quiz: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function gradeAnswer(question, userAnswer) {
  const ua = normalize(userAnswer);
  if (!ua) return false;

  if (question.type === "mcq" || question.type === "true_false" || question.type === "fill_blank") {
    return ua === normalize(question.correctAnswer);
  }

  if (question.type === "coding") {
    // Keyword-overlap grading, not code execution — this project doesn't
    // include a code execution sandbox. This checks whether the answer
    // answer covers enough of the reference answer's key terms.
    const refWords = [...new Set(normalize(question.correctAnswer).split(/\W+/).filter((w) => w.length > 2))];
    const userWords = new Set(ua.split(/\W+/).filter((w) => w.length > 2));
    if (refWords.length === 0) return false;
    const overlap = refWords.filter((w) => userWords.has(w)).length;
    return overlap / refWords.length >= 0.5;
  }

  return false;
}

// POST /api/quizzes/:id/attempts  { answers: [{ questionIndex, userAnswer }] }
async function submitAttempt(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (quiz.status !== "ready") return res.status(400).json({ success: false, message: "Quiz isn't ready yet" });

    const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(submitted.map((a) => [a.questionIndex, a.userAnswer]));

    let correctCount = 0;
    const results = quiz.questions.map((q, i) => {
      const userAnswer = answerMap.get(i) ?? "";
      const correct = gradeAnswer(q, userAnswer);
      if (correct) correctCount++;
      return {
        questionIndex: i,
        userAnswer: String(userAnswer),
        correct,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const totalCount = quiz.questions.length;
    const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers: results.map(({ questionIndex, userAnswer, correct }) => ({ questionIndex, userAnswer, correct })),
      correctCount,
      totalCount,
      scorePercent,
    });

    res.status(201).json({
      success: true,
      attempt: { id: attempt._id, correctCount, totalCount, scorePercent, createdAt: attempt.createdAt },
      results,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/quizzes/:id/attempts — this user's attempt history for a quiz, best score first
async function listAttempts(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.id, user: req.user._id })
      .select("correctCount totalCount scorePercent createdAt")
      .sort("-scorePercent -createdAt");
    res.json({ success: true, attempts });
  } catch (err) {
    next(err);
  }
}

// GET /api/quizzes/analytics/summary — overall performance across all quizzes
async function getAnalytics(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id }).select("scorePercent quiz");
    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / totalAttempts);
    const bestScore = totalAttempts === 0 ? 0 : Math.max(...attempts.map((a) => a.scorePercent));
    const quizzesTaken = new Set(attempts.map((a) => String(a.quiz))).size;

    res.json({ success: true, analytics: { totalAttempts, averageScore, bestScore, quizzesTaken } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createQuiz, listQuizzes, getQuiz, deleteQuiz, submitAttempt, listAttempts, getAnalytics };
