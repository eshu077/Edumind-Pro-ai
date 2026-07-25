const { runSubmission, runBatch } = require("../utils/judge0");
const { LANGUAGES } = require("../utils/languages");
const Snippet = require("../models/Snippet");

function resolveLanguage(language) {
  const entry = LANGUAGES[language];
  if (!entry) {
    const err = new Error(`Unsupported language: ${language}`);
    err.statusCode = 400;
    throw err;
  }
  return entry;
}

// POST /api/playground/run  { language, code, stdin }
async function run(req, res, next) {
  try {
    const { language, code, stdin } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }
    const lang = resolveLanguage(language);
    const result = await runSubmission({ languageId: lang.id, sourceCode: code, stdin });
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

// POST /api/playground/run-tests  { language, code, testCases: [{ input, expectedOutput }] }
async function runTests(req, res, next) {
  try {
    const { language, code, testCases } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ success: false, message: "At least one test case is required" });
    }

    const lang = resolveLanguage(language);
    const results = await runBatch({ languageId: lang.id, sourceCode: code, testCases });

    const graded = results.map((r, i) => {
      const expected = (testCases[i].expectedOutput ?? "").trim();
      const actual = (r.stdout ?? "").trim();
      return {
        input: testCases[i].input || "",
        expectedOutput: testCases[i].expectedOutput || "",
        actualOutput: r.stdout,
        stderr: r.stderr,
        compileOutput: r.compileOutput,
        status: r.status,
        passed: r.status === "Accepted" && actual === expected,
      };
    });

    res.json({ success: true, results: graded });
  } catch (err) {
    next(err);
  }
}

// POST /api/playground/snippets  { language, code, title }
async function saveSnippet(req, res, next) {
  try {
    const { language, code, title } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "language and code are required" });
    }
    const snippet = await Snippet.create({ user: req.user._id, language, code, title: title || "Untitled" });
    res.status(201).json({ success: true, snippet });
  } catch (err) {
    next(err);
  }
}

// GET /api/playground/snippets
async function listSnippets(req, res, next) {
  try {
    const snippets = await Snippet.find({ user: req.user._id }).select("-code").sort("-updatedAt");
    res.json({ success: true, snippets });
  } catch (err) {
    next(err);
  }
}

// GET /api/playground/snippets/:id
async function getSnippet(req, res, next) {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.id, user: req.user._id });
    if (!snippet) return res.status(404).json({ success: false, message: "Snippet not found" });
    res.json({ success: true, snippet });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/playground/snippets/:id
async function deleteSnippet(req, res, next) {
  try {
    const result = await Snippet.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Snippet not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { run, runTests, saveSnippet, listSnippets, getSnippet, deleteSnippet };
