const CareerPlan = require("../models/CareerPlan");
const groq = require("../config/groq");

const CAREER_MODEL = "llama-3.3-70b-versatile";
const VALID_LEVELS = ["student", "entry", "mid", "senior"];

function buildPrompt({ targetRole, currentSkills, experienceLevel }) {
  return `You are an expert career mentor. Generate career guidance as a single valid JSON object — no markdown fences, no commentary.

Schema:
{
  "title": string,
  "summary": string (2-3 sentences),
  "skillGaps": [string] (5-8 specific skills or knowledge gaps to close),
  "recommendedRoles": [string] (2-4 realistic job titles matching this trajectory),
  "actionPlan": [ { "step": string, "description": string } ] (5-8 concrete, ordered steps),
  "resources": [ { "title": string, "url": string or null } ] (5-8 real, well-known resources; use null for url if unsure rather than inventing one)
}

Target role: "${targetRole}"
Current skills/background: "${currentSkills || "not specified — use your best judgement"}"
Experience level: "${experienceLevel}"

Return ONLY the JSON object.`;
}

function stripCodeFences(text) {
  return text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
}

// POST /api/career  { targetRole, currentSkills, experienceLevel }
async function createCareerPlan(req, res, next) {
  try {
    const { targetRole, currentSkills, experienceLevel } = req.body;
    if (!targetRole || !experienceLevel) {
      return res.status(400).json({ success: false, message: "targetRole and experienceLevel are required" });
    }
    if (!VALID_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({ success: false, message: "Invalid experienceLevel" });
    }

    const plan = await CareerPlan.create({
      user: req.user._id,
      targetRole,
      currentSkills: currentSkills || "",
      experienceLevel,
      status: "generating",
    });

    res.status(202).json({ success: true, plan: plan.toSummary() });

    try {
      const completion = await groq.chat.completions.create({
        model: CAREER_MODEL,
        messages: [{ role: "user", content: buildPrompt({ targetRole, currentSkills, experienceLevel }) }],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(stripCodeFences(raw));

      plan.title = String(parsed.title || `${targetRole} Career Plan`);
      plan.summary = String(parsed.summary || "");
      plan.skillGaps = Array.isArray(parsed.skillGaps) ? parsed.skillGaps.map(String) : [];
      plan.recommendedRoles = Array.isArray(parsed.recommendedRoles) ? parsed.recommendedRoles.map(String) : [];
      plan.actionPlan = (Array.isArray(parsed.actionPlan) ? parsed.actionPlan : []).map((s) => ({
        step: String(s.step || ""),
        description: String(s.description || ""),
      }));
      plan.resources = (Array.isArray(parsed.resources) ? parsed.resources : []).map((r) => ({
        title: String(r.title || ""),
        url: r.url ? String(r.url) : null,
      }));
      plan.status = "ready";
      await plan.save();
    } catch (genErr) {
      console.error("Career plan generation failed:", genErr);
      plan.status = "failed";
      plan.errorMessage = "Couldn't generate this — try again, or adjust the target role.";
      await plan.save();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/career
async function listCareerPlans(req, res, next) {
  try {
    const plans = await CareerPlan.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, plans: plans.map((p) => p.toSummary()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/career/:id
async function getCareerPlan(req, res, next) {
  try {
    const plan = await CareerPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/career/:id
async function deleteCareerPlan(req, res, next) {
  try {
    const result = await CareerPlan.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCareerPlan, listCareerPlans, getCareerPlan, deleteCareerPlan };
