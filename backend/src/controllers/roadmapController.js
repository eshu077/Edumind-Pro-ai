const Roadmap = require("../models/Roadmap");
const groq = require("../config/groq");

const ROADMAP_MODEL = "llama-3.3-70b-versatile";

function buildPrompt({ subject, difficulty, durationWeeks, goals }) {
  return `You are an expert curriculum designer. Generate a structured learning roadmap as a single valid JSON object — no markdown code fences, no commentary before or after it.

JSON schema to follow exactly:
{
  "title": string,
  "summary": string (2-3 sentences),
  "weeklySchedule": [
    { "weekNumber": number, "theme": string, "goals": [string], "tasks": [string], "estimatedHours": number }
  ],
  "milestones": [
    { "weekNumber": number, "title": string, "description": string, "project": string or null }
  ],
  "resources": [
    { "title": string, "url": string or null, "type": "article" | "video" | "course" | "book" | "docs" }
  ]
}

Requirements:
- weeklySchedule must have exactly ${durationWeeks} entries, weekNumber running 1 through ${durationWeeks} in order.
- 3 to 6 concrete, actionable tasks per week — not vague advice.
- 3 to 6 milestones spread across the timeline; at least one must include a hands-on "project".
- 5 to 10 resources total. Prefer real, well-known sources (official docs, MDN, freeCodeCamp, well-known courses/YouTube channels). If unsure of an exact URL, set "url" to null rather than inventing one.
- Difficulty level: "${difficulty}".
- Subject: "${subject}".
- Learner's stated goals: "${goals || "not specified — use your best judgement for this subject and level"}".

Return ONLY the JSON object described above.`;
}

function stripCodeFences(text) {
  return text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
}

function normalizeRoadmap(parsed, durationWeeks) {
  const weeklySchedule = (Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule : [])
    .slice(0, durationWeeks)
    .map((w, i) => ({
      weekNumber: Number(w.weekNumber) || i + 1,
      theme: String(w.theme || `Week ${i + 1}`),
      goals: Array.isArray(w.goals) ? w.goals.map(String) : [],
      tasks: (Array.isArray(w.tasks) ? w.tasks : []).map((t) => ({ title: String(t), completed: false })),
      estimatedHours: Number(w.estimatedHours) || 5,
    }));

  const milestones = (Array.isArray(parsed.milestones) ? parsed.milestones : []).map((m) => ({
    weekNumber: Number(m.weekNumber) || 1,
    title: String(m.title || "Milestone"),
    description: String(m.description || ""),
    project: m.project ? String(m.project) : null,
  }));

  const resources = (Array.isArray(parsed.resources) ? parsed.resources : []).map((r) => ({
    title: String(r.title || "Resource"),
    url: r.url ? String(r.url) : null,
    type: ["article", "video", "course", "book", "docs"].includes(r.type) ? r.type : "article",
  }));

  return {
    title: String(parsed.title || "Untitled roadmap"),
    summary: String(parsed.summary || ""),
    weeklySchedule,
    milestones,
    resources,
  };
}

// POST /api/roadmaps  { subject, difficulty, durationWeeks, goals }
async function createRoadmap(req, res, next) {
  try {
    const { subject, difficulty, durationWeeks, goals } = req.body;

    if (!subject || !difficulty || !durationWeeks) {
      return res.status(400).json({ success: false, message: "subject, difficulty, and durationWeeks are required" });
    }
    const weeks = Math.min(Math.max(parseInt(durationWeeks, 10) || 0, 1), 52);
    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return res.status(400).json({ success: false, message: "difficulty must be beginner, intermediate, or advanced" });
    }

    const roadmap = await Roadmap.create({
      user: req.user._id,
      subject,
      difficulty,
      durationWeeks: weeks,
      goals: goals || "",
      status: "generating",
    });

    res.status(202).json({ success: true, roadmap: roadmap.toSummary() });

    try {
      const completion = await groq.chat.completions.create({
        model: ROADMAP_MODEL,
        messages: [{ role: "user", content: buildPrompt({ subject, difficulty, durationWeeks: weeks, goals }) }],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(stripCodeFences(raw));
      const normalized = normalizeRoadmap(parsed, weeks);

      roadmap.title = normalized.title;
      roadmap.summary = normalized.summary;
      roadmap.weeklySchedule = normalized.weeklySchedule;
      roadmap.milestones = normalized.milestones;
      roadmap.resources = normalized.resources;
      roadmap.status = "ready";
      await roadmap.save();
    } catch (genErr) {
      console.error("Roadmap generation failed:", genErr);
      roadmap.status = "failed";
      roadmap.errorMessage = "Couldn't generate this roadmap. Try again, or adjust the subject/duration.";
      await roadmap.save();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/roadmaps
async function listRoadmaps(req, res, next) {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, roadmaps: roadmaps.map((r) => r.toSummary()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/roadmaps/:id
async function getRoadmap(req, res, next) {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    res.json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/roadmaps/:id
async function deleteRoadmap(req, res, next) {
  try {
    const result = await Roadmap.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Roadmap not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/roadmaps/:id/tasks/:taskId  { completed }
async function toggleTask(req, res, next) {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });

    let found = null;
    for (const week of roadmap.weeklySchedule) {
      const task = week.tasks.id(req.params.taskId);
      if (task) {
        found = task;
        break;
      }
    }
    if (!found) return res.status(404).json({ success: false, message: "Task not found" });

    found.completed = typeof req.body.completed === "boolean" ? req.body.completed : !found.completed;
    await roadmap.save();

    res.json({ success: true, taskId: found._id, completed: found.completed, progressPercent: roadmap.progressPercent });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRoadmap, listRoadmaps, getRoadmap, deleteRoadmap, toggleTask };
