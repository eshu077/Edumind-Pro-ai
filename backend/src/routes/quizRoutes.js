const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createQuiz,
  listQuizzes,
  getQuiz,
  deleteQuiz,
  submitAttempt,
  listAttempts,
  getAnalytics,
} = require("../controllers/quizController");

const router = express.Router();

router.use(protect);

router.get("/analytics/summary", getAnalytics);
router.post("/", createQuiz);
router.get("/", listQuizzes);
router.get("/:id", getQuiz);
router.delete("/:id", deleteQuiz);
router.post("/:id/attempts", submitAttempt);
router.get("/:id/attempts", listAttempts);

module.exports = router;
