const express = require("express");
const { protect } = require("../middleware/auth");
const {
  run,
  runTests,
  saveSnippet,
  listSnippets,
  getSnippet,
  deleteSnippet,
} = require("../controllers/playgroundController");

const router = express.Router();

router.use(protect);

router.post("/run", run);
router.post("/run-tests", runTests);
router.post("/snippets", saveSnippet);
router.get("/snippets", listSnippets);
router.get("/snippets/:id", getSnippet);
router.delete("/snippets/:id", deleteSnippet);

module.exports = router;
